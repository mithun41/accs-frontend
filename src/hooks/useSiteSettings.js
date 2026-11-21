'use client';

import { useSyncExternalStore } from 'react';
import { marketingApi } from '@/lib/services';

// Storefront contact details (WhatsApp, hotline, ...) fetched once and shared by every component
const EMPTY = {};
let cache = EMPTY;
let pending = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

function load() {
  if (!pending) {
    pending = marketingApi
      .siteSettings()
      .then((res) => {
        cache = res || EMPTY;
        notify();
      })
      .catch(() => {
        pending = null;
      });
  }
}

function subscribe(fn) {
  listeners.add(fn);
  if (cache === EMPTY) load();
  return () => listeners.delete(fn);
}

/** Replace the shared copy after an admin saves new settings. */
export function setSiteSettings(next) {
  cache = next || EMPTY;
  notify();
}

export function useSiteSettings() {
  return useSyncExternalStore(subscribe, () => cache, () => EMPTY);
}
