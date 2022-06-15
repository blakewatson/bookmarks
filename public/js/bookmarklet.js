(() => {
  const dev = false;
  const title = encodeURIComponent(document.title);
  const url = encodeURIComponent(window.location.href);
  const baseUrl = dev
    ? 'http://localhost:8888'
    : 'https://bookmarks.blakewatson.com';

  window.open(`${baseUrl}/?title=${title}&url=${url}`);
})();
