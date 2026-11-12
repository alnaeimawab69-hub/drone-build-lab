import { LANG, LANGS, setLang, tr } from '../lang.js';

/* English / Bahasa Malaysia; the choice is stored in this browser and the page reloads in that language */
export default function LangSwitch() {
  return (
    <div className="lang" role="group" aria-label={tr('Language', 'Bahasa')}>
      {LANGS.map(([k, label]) => (
        <button key={k} type="button" lang={k} aria-pressed={LANG === k} onClick={() => LANG !== k && setLang(k)}>{label}</button>
      ))}
    </div>
  );
}
