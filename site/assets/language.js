// Redirect only the language-neutral entry; explicit language URLs stay stable.
(() => {
  const preferred = navigator.languages?.[0] || navigator.language || 'en';
  const language = preferred.toLowerCase().startsWith('es') ? 'es' : 'en';
  const target = new URL(`${language}/`, window.location.href);
  target.hash = window.location.hash;
  target.search = window.location.search;
  window.location.replace(target.href);
})();
