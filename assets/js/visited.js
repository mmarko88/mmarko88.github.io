// Visited-post tracking — per-browser via localStorage.
// On post/til pages: record this URL as read.
// On the feed: dim cards whose post was already read (.is_read).
(function () {
  var KEY = 'visited:';
  function norm(p) { return p.replace(/\/+$/, '') + '/'; }
  var here = norm(location.pathname);

  if (/^\/(post|til)\/[^/]/.test(here)) {
    try { localStorage.setItem(KEY + here, '1'); } catch (e) {}
    return;
  }

  var box = document.getElementById('feed_items');
  if (!box) return;

  function mark() {
    var cards = box.querySelectorAll('.feed_card:not(.is_read)');
    Array.prototype.forEach.call(cards, function (card) {
      var a = card.querySelector('a.feed_card_link, a.feed_media');
      if (!a) return;
      var p = norm(new URL(a.href, location.origin).pathname);
      try {
        if (localStorage.getItem(KEY + p)) card.classList.add('is_read');
      } catch (e) {}
    });
  }

  mark();
  // cards appended later by infinite scroll
  new MutationObserver(mark).observe(box, { childList: true });
})();
