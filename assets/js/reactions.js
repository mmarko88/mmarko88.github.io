// Waline reactions on feed cards — the same 6-emoji row the comment
// widget renders on post pages (tieba pack), one toggle each.
// GET  /api/article?path=p1,p2&type=reaction0,...,reaction5
//      -> {errno:0, data:[{reaction0..reaction5}, ...]} — items align
//         positionally with the requested paths (no path field on items)
// POST /api/article  {path, type:'reactionN', action:'inc'|'desc'}
// The old heart button was reaction0 — same counter, and the original
// waline:liked:<path> localStorage keys still mark it as voted.
(function () {
  var box = document.getElementById('feed_items');
  if (!box) return;
  var server = (box.dataset.walineServer || '').replace(/\/+$/, '');
  if (!server) return;

  var KEY = 'waline:liked:';
  // bilibili emoji pack — same images + order as the widget's reaction row
  var EMOJI_BASE = 'https://unpkg.com/@waline/emojis/bilibili/';
  var EMOJI = [
    ['bb_thumbsup.png', 'Like'],
    ['bb_look_down.png', 'Dislike'],
    ['bb_sunglasses.png', 'Cool'],
    ['bb_pick_nose.png', 'Meh'],
    ['bb_awkward.png', 'Awkward'],
    ['bb_sleep.png', 'Boring']
  ];
  var TYPES = EMOJI.map(function (_, i) { return 'reaction' + i; });

  // reaction0 keeps the original key so likes from the heart era still apply
  function storeKey(path, type) {
    return type === 'reaction0' ? KEY + path : KEY + path + ':' + type;
  }

  function pendingCards() {
    return Array.prototype.slice.call(box.querySelectorAll('.feed_card[data-path]'))
      .filter(function (c) { return !c._reactsInit; });
  }

  function setCount(btn, n) {
    n = Math.max(n, 0);
    btn.querySelector('.feed_react_count').textContent = n;
    btn.classList.toggle('has_votes', n > 0);
  }

  function makeBadge(card, type, idx, n, liked) {
    var em = EMOJI[idx];
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'feed_action feed_react' + (liked ? ' liked' : '');
    btn.dataset.path = card.dataset.path;
    btn.dataset.type = type;
    btn.setAttribute('aria-pressed', String(liked));
    btn.setAttribute('aria-label', em[1]);
    btn.setAttribute('title', em[1]);
    btn.innerHTML = '<img src="' + EMOJI_BASE + em[0] + '" alt="' + em[1] + '" loading="lazy"><span class="feed_react_count"></span>';
    card.querySelector('.feed_reacts').appendChild(btn);
    setCount(btn, n);
  }

  function applyState(card, item) {
    item = item || {};
    card._reactsInit = true;
    var row = document.createElement('div');
    row.className = 'feed_reacts';
    card.appendChild(row);
    TYPES.forEach(function (type, i) {
      var liked = !!localStorage.getItem(storeKey(card.dataset.path, type));
      makeBadge(card, type, i, item[type] || 0, liked);
    });
  }

  function fetchCounts() {
    var cards = pendingCards();
    if (!cards.length) return;
    var paths = [];
    cards.forEach(function (c) { if (paths.indexOf(c.dataset.path) < 0) paths.push(c.dataset.path); });
    // mark first so infinite-scroll fetches can't double-fire for the same paths
    cards.forEach(function (c) { c._reactsInit = true; });
    fetch(server + '/api/article?path=' + paths.map(encodeURIComponent).join(',') + '&type=' + TYPES.join(','))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var list = (res && res.data) || [];
        var map = {};
        paths.forEach(function (p, i) { map[p] = list[i] || {}; });
        cards.forEach(function (c) { applyState(c, map[c.dataset.path]); });
      })
      .catch(function () {
        cards.forEach(function (c) { c._reactsInit = false; }); // retry on next observer tick
      });
  }

  // init counts now + for cards appended later by infinite scroll
  fetchCounts();
  new MutationObserver(fetchCounts).observe(box, { childList: true });

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.feed_react');
    if (!b || !box.contains(b)) return;
    var type = b.dataset.type;
    var key = storeKey(b.dataset.path, type);
    var liked = b.classList.contains('liked');
    var action = liked ? 'desc' : 'inc';
    var c = b.querySelector('.feed_react_count');
    // optimistic toggle
    b.classList.toggle('liked', !liked);
    b.setAttribute('aria-pressed', String(!liked));
    setCount(b, (+(c && c.textContent) || 0) + (liked ? -1 : 1));
    if (liked) localStorage.removeItem(key);
    else localStorage.setItem(key, '1');
    fetch(server + '/api/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: b.dataset.path, type: type, action: action })
    }).catch(function () {
      // revert on network failure so the count stays honest
      b.classList.toggle('liked', liked);
      b.setAttribute('aria-pressed', String(liked));
      setCount(b, (+(c && c.textContent) || 0) + (liked ? 1 : -1));
      if (liked) localStorage.setItem(key, '1');
      else localStorage.removeItem(key);
    });
  });
})();
