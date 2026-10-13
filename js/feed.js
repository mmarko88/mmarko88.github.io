// Feed: infinite scroll (auto 2 batches -> "Load more"), share/copy, scroll restore
(function () {
  var list = document.getElementById('feed_items');
  var nextLink = document.querySelector('.feed_next');
  var sentinel = document.getElementById('feed_sentinel');
  var loadBtn = document.getElementById('feed_loadmore');
  if (!list || !sentinel) return;

  var loading = false;
  var autoLeft = 2;
  var fetched = 0;

  function done() {
    sentinel.textContent = "You're all caught up";
    sentinel.className = 'feed_end';
    if (nextLink) nextLink.hidden = true;
    if (loadBtn) loadBtn.hidden = true;
  }

  function loadMore() {
    if (loading || !nextLink || !nextLink.href) return Promise.resolve();
    loading = true;
    return fetch(nextLink.href)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('#feed_items > *').forEach(function (n) {
          list.appendChild(document.importNode(n, true));
        });
        var newNext = doc.querySelector('.feed_next');
        if (newNext && newNext.href) { nextLink.href = newNext.href; } else { done(); }
        fetched++;
        if (--autoLeft <= 0 && observer) {
          observer.disconnect();
          if (loadBtn && nextLink && nextLink.href) loadBtn.hidden = false;
        }
      })
      .catch(function () { if (loadBtn) loadBtn.hidden = false; })
      .finally(function () { loading = false; });
  }

  if (!nextLink) done();

  var observer = null;
  if (nextLink && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) loadMore();
    }, { rootMargin: '600px' });
    observer.observe(sentinel);
  }
  if (loadBtn) loadBtn.addEventListener('click', loadMore);
  if (nextLink) nextLink.addEventListener('click', function (e) { e.preventDefault(); loadMore(); });

  // share: native share -> clipboard fallback
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.feed_share');
    if (!b) return;
    if (navigator.share) {
      navigator.share({ title: b.dataset.title, url: b.dataset.share }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(b.dataset.share).then(function () {
        b.textContent = 'Copied!';
        setTimeout(function () { b.textContent = 'Share'; }, 1500);
      });
    }
  });

  // scroll restore: replay loaded pages, then jump to saved position
  var KEY = 'feedState';
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) {}
  var pagesToReplay = saved && saved.pages ? saved.pages : 0;

  function replay() {
    if (pagesToReplay > 0 && nextLink && nextLink.href) {
      pagesToReplay--;
      autoLeft++;
      loadMore().then(replay);
    } else if (saved && saved.y) {
      requestAnimationFrame(function () { scrollTo(0, saved.y); });
    }
  }
  if (saved) replay();

  window.addEventListener('beforeunload', function () {
    sessionStorage.setItem(KEY, JSON.stringify({ pages: fetched, y: scrollY }));
  });
})();
