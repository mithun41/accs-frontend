'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, BookOpenText, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { mediaUrl } from '@/lib/utils';
import { useT } from '@/i18n/LanguageProvider';

// Only the first pages are shown, even if a longer PDF was uploaded
const MAX_PAGES = 10;
// Copied from node_modules by scripts/copy-pdf-worker.mjs
const WORKER_SRC = '/pdfjs/pdf.worker.min.mjs';

/**
 * Renders the PDF's pages as images (canvas) with pdf.js, so the preview reads the same on phones
 * (which can't show PDFs inline) as on desktop, without a download / print toolbar.
 */
function PdfPages({ url }) {
  const t = useT();
  const holder = useRef(null);
  const [state, setState] = useState({ status: 'loading', shown: 0, total: 0 });

  useEffect(() => {
    const box = holder.current;
    let cancelled = false;
    let task = null;

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.min.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
        task = pdfjs.getDocument({ url, isEvalSupported: false });
        const doc = await task.promise;
        if (cancelled) return;
        const shown = Math.min(doc.numPages, MAX_PAGES);
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const width = box.clientWidth || 600;

        for (let n = 1; n <= shown; n += 1) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });

          const figure = document.createElement('figure');
          figure.className = 'space-y-1.5';
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = 'block h-auto w-full rounded-md bg-white shadow-sm ring-1 ring-slate-200';
          canvas.addEventListener('contextmenu', (e) => e.preventDefault());
          const caption = document.createElement('figcaption');
          caption.className = 'text-center text-xs text-slate-400';
          caption.textContent = t('Page {n} of {total}', { n, total: doc.numPages });
          figure.append(canvas, caption);
          box.append(figure);

          await page.render({ canvas, viewport }).promise;
          if (n === 1 && !cancelled) setState({ status: 'ready', shown, total: doc.numPages });
        }
        if (!cancelled) setState({ status: 'ready', shown, total: doc.numPages });
      } catch {
        if (!cancelled) setState({ status: 'error', shown: 0, total: 0 });
      }
    })();

    return () => {
      cancelled = true;
      task?.destroy();
      box.replaceChildren();
    };
  }, [url, t]);

  return (
    <div className="mx-auto max-w-2xl">
      {state.status === 'loading' && (
        <p className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="size-5 animate-spin text-brand-600" /> {t('Opening the preview…')}
        </p>
      )}
      {state.status === 'error' && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <AlertTriangle className="size-6 text-amber-500" />
          <p className="text-sm text-slate-600">{t('The preview could not be opened.')}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="link text-sm">{t('Open the preview PDF')}</a>
        </div>
      )}
      <div ref={holder} className="space-y-5" />
      {state.status === 'ready' && state.total > state.shown && (
        <p className="mt-5 text-center text-xs text-slate-500">{t('The preview shows the first {count} pages.', { count: state.shown })}</p>
      )}
    </div>
  );
}

/** "Read a few pages" button that opens the uploaded preview PDF in a reader. */
export default function BookPreview({ pdf, title, className }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  if (!pdf) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className || 'btn btn-secondary w-full'}>
        <BookOpenText className="size-4 text-brand-600" /> {t('Read a few pages')}
      </button>
      {open && (
        <Modal open onClose={() => setOpen(false)} size="xl" title={t('Book preview')} description={title}>
          <PdfPages url={mediaUrl(pdf)} />
        </Modal>
      )}
    </>
  );
}
