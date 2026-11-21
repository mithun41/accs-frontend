// Copies the pdf.js worker into public/ so the book preview can load it from /pdfjs/.
// Runs automatically after `npm install` and before `npm run dev` / `npm run build`.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs');
const target = join(root, 'public', 'pdfjs', 'pdf.worker.min.mjs');

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log('pdf.js worker copied to public/pdfjs/');
