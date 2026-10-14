// Waline reactions on feed cards — anonymous one-click like.
// GET  /api/article?path=p1,p2&type=reaction0
//      -> {errno:0, data:[{reaction0}, ...]} — items align positionally
//         with the requested paths (no path field on items)
// POST /api/article  {path, type:'reaction0', action:'inc'}     -> +1 like
// reaction0 is the same counter shown as the first emoji reaction on the
// post page, so card likes and post reactions share one count.
(function () {
  var box = document.getElementById('feed_items');
  if (!box) return;
  var server = (box.dataset.walineServer || '').replace(/\/+$/, '');
  if (!server) return;

  var KEY = 'waline:liked:';

  function pendingButtons() {
    return Array.prototype.slice.call(box.querySelectorAll('.feed_like'))
      .filter(function (b) { return !b._likeInit; });
  }

  function applyState(b, count) {
    b._likeInit = true;
    var c = b.querySelector('.feed_like_count');
    if (c) c.textContent = count || 0;
    if (localStorage.getItem(KEY + b.dataset.path)) {
      b.classList.add('liked');
      b.setAttribute('aria-pressed', 'true');
    }
  }

  function fetchCounts() {
    var btns = pendingButtons();
    if (!btns.length) return;
    var paths = [];
    btns.forEach(function (b) { if (paths.indexOf(b.dataset.path) < 0) paths.push(b.dataset.path); });
    // mark first so infinite-scroll fetches can't double-fire for the same paths
    btns.forEach(function (b) { b._likeInit = true; });
    fetch(server + '/api/article?path=' + paths.map(encodeURIComponent).join(',') + '&type=reaction0')
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var list = (res && res.data) || [];
        var map = {};
        paths.forEach(function (p, i) { map[p] = (list[i] && list[i].reaction0) || 0; });
        btns.forEach(function (b) { applyState(b, map[b.dataset.path]); });
      })
      .catch(function () {
        btns.forEach(function (b) { b._likeInit = false; }); // retry on next observer tick
      });
  }

  // init counts now + for cards appended later by infinite scroll
  fetchCounts();
  new MutationObserver(fetchCounts).observe(box, { childList: true });

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.feed_like');
    if (!b || b.classList.contains('liked') || !box.contains(b)) return;
    b.classList.add('liked');                       // optimistic
    b.setAttribute('aria-pressed', 'true');
    var c = b.querySelector('.feed_like_count');
    if (c) c.textContent = (+c.textContent || 0) + 1;
    localStorage.setItem(KEY + b.dataset.path, '1');
    fetch(server + '/api/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: b.dataset.path, type: 'reaction0', action: 'inc' })
    }).catch(function () {
      // revert on network failure so the count stays honest
      b.classList.remove('liked');
      b.setAttribute('aria-pressed', 'false');
      if (c) c.textContent = Math.max((+c.textContent || 1) - 1, 0);
      localStorage.removeItem(KEY + b.dataset.path);
    });
  });
})();
