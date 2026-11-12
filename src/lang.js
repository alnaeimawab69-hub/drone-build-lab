/* Page language: English or Bahasa Malaysia. The choice is kept in this browser only (no account), and switching reloads the page */
const KEY = 'dbl-lang';
export const LANG = (() => { try { return localStorage.getItem(KEY) === 'ms' ? 'ms' : 'en'; } catch (e) { return 'en'; } })();
document.documentElement.lang = LANG;
export const tr = (en, ms) => (LANG === 'ms' ? ms : en);
export function setLang(l) { try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); }
export const LANGS = [['en', 'English'], ['ms', 'Bahasa Malaysia']];
