// Redirect only the language-neutral entry; explicit language URLs stay stable.
(() => {
  const preferences = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || 'en'];
  const language = preferences
    .map((locale) => locale.toLowerCase().split('-')[0])
    .find((locale) => locale === 'es' || locale === 'en') || 'en';
  const target = new URL(`${language}/`, window.location.href);
  target.hash = window.location.hash;
  target.search = window.location.search;
  window.location.replace(target.href);
})();
