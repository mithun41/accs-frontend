'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import bn from './bn';

/**
 * Site language. Bangla is the default; visitors can switch to English with the toggle in the
 * header. The choice is kept in the `lang` cookie so the server renders the right language
 * straight away (no flash of the other language on reload).
 *
 * Texts are written in English in the code and wrapped with `t()`; `bn.js` maps each English
 * text to Bangla. Texts without a Bangla entry simply stay in English.
 */
export const LANGS = ['bn', 'en'];
export const DEFAULT_LANG = 'bn';
export const LANG_COOKIE = 'lang';

const LanguageContext = createContext({ lang: DEFAULT_LANG, setLang: () => {} });

const missing = new Set();

/** Translate `text` (English) into `lang`, filling `{name}` placeholders from `vars`. */
export function translate(lang, text, vars) {
  let out = text;
  if (lang === 'bn') {
    if (Object.prototype.hasOwnProperty.call(bn, text)) out = bn[text];
    else if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && !missing.has(text)) {
      // Development aid: list texts that still need a Bangla entry (window.__missingBn)
      missing.add(text);
      window.__missingBn = [...missing];
    }
  }
  if (vars) out = out.replace(/\{(\w+)\}/g, (match, key) => (vars[key] ?? match));
  return out;
}

export function LanguageProvider({ initialLang = DEFAULT_LANG, children }) {
  const [lang, setLangState] = useState(LANGS.includes(initialLang) ? initialLang : DEFAULT_LANG);

  const setLang = useCallback((next) => {
    if (!LANGS.includes(next)) return;
    setLangState(next);
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);

const CLASS_BN = [
  'প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ', 'পঞ্চম', 'ষষ্ঠ', 'সপ্তম', 'অষ্টম', 'নবম', 'দশম', 'একাদশ', 'দ্বাদশ',
];

/**
 * Category names come from the database in English. In Bangla, "Class 7" becomes "সপ্তম শ্রেণি"
 * and names listed in bn.js (subjects, Stationery, …) are translated; others stay as entered.
 */
export function translateCategory(lang, name) {
  if (lang !== 'bn' || !name) return name;
  const match = /^Class\s*(\d+)$/i.exec(String(name).trim());
  if (match && CLASS_BN[Number(match[1]) - 1]) return `${CLASS_BN[Number(match[1]) - 1]} শ্রেণি`;
  return Object.prototype.hasOwnProperty.call(bn, name) ? bn[name] : name;
}

/**
 * Content entered in the admin (banner texts, …) is shown as entered; in Bangla, texts that
 * have an entry in bn.js (e.g. the seeded demo banners) are shown in Bangla.
 */
export function useDataText() {
  const { lang } = useLanguage();
  return useCallback(
    (text) => (lang === 'bn' && text && Object.prototype.hasOwnProperty.call(bn, text) ? bn[text] : text),
    [lang]
  );
}

/** `const catName = useCategoryName();` then `catName(category)` or `catName('Physics')`. */
export function useCategoryName() {
  const { lang } = useLanguage();
  return useCallback((value) => translateCategory(lang, typeof value === 'string' ? value : value?.name), [lang]);
}

/** `const t = useT();` then `t('Add to cart')` or `t('{count} items', { count })`. */
export function useT() {
  const { lang } = useLanguage();
  return useCallback((text, vars) => translate(lang, text, vars), [lang]);
}
