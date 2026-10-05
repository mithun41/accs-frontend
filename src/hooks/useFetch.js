'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/utils';

/**
 * Small data-fetching hook.
 * `fetcher` runs whenever `deps` change; pass `enabled: false` to skip.
 * `reload()` refetches in the background while keeping the current data on screen.
 */
export function useFetch(fetcher, deps = [], { enabled = true, initialData = null } = {}) {
  const fetcherRef = useRef(fetcher);
  useLayoutEffect(() => {
    fetcherRef.current = fetcher;
  });

  const key = enabled ? JSON.stringify(deps) : null;
  const [state, setState] = useState({ key: undefined, data: initialData, error: null, status: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (key === null) return undefined;
    let cancelled = false;
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((data) => {
        if (!cancelled) setState({ key, data, error: null, status: 200 });
      })
      .catch((err) => {
        if (!cancelled) {
          setState((s) => ({ key, data: s.data, error: getErrorMessage(err), status: err?.response?.status || 0 }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key, version]);

  const setData = useCallback(
    (next) => setState((s) => ({ ...s, data: typeof next === 'function' ? next(s.data) : next })),
    []
  );
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    data: state.data,
    setData,
    loading: key !== null && state.key !== key,
    error: state.key === key ? state.error : null,
    status: state.status,
    reload,
  };
}
