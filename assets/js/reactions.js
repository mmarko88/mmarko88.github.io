// Waline reactions on feed cards — dev.to-style pill: up to 3 stacked
// emoji icons (top-voted types, still one-click toggles) + total count,
// plus a comments pill. The full 6-emoji row stays on post pages.
// GET  /api/article?path=p1,p2&type=reaction0,...,reaction5
//      -> {errno:0, data:[{reaction0..reaction5}, ...]} — items align
//         positionally with the requested paths (no path field on items)
// POST /api/article  {path, type:'reactionN', action:'inc'|'desc'}
// reaction0 keeps the original waline:liked:<path> keys from the heart era.
(function () {
  var box = document.getElementById('feed_items');
  if (!box) return;
  var server = (box.dataset.walineServer || '').replace(/\/+$/, '');
  if (!server) return;

  var KEY = 'waline:liked:';
  // twemoji pack — same images + order as the widget's reaction row
  var EMOJI_BASE = 'https://unpkg.com/@waline/emojis/tw/';
  var EMOJI = [
    ['1f44d.png', 'Like'],
    ['1f44e.png', 'Dislike'],
    ['1f60e.png', 'Cool'],
    ['1f612.png', 'Meh'],
    ['1f62c.png', 'Awkward'],
    ['1f634.png', 'Boring']
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

  function updateTotal(card) {
    var el = card.querySelector('.feed_react_total');
    var n = (card._counts || []).reduce(function (a, b) { return a + b; }, 0);
    if (el) el.textContent = n + ' reaction' + (n === 1 ? '' : 's');
  }

  function makeIcon(card, type, idx) {
    var em = EMOJI[idx];
    var liked = !!localStorage.getItem(storeKey(card.dataset.path, type));
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'feed_react' + (liked ? ' liked' : '');
    btn.dataset.type = type;
    btn._idx = idx;
    btn.setAttribute('aria-pressed', String(liked));
    btn.setAttribute('aria-label', em[1]);
    btn.setAttribute('title', em[1]);
    btn.innerHTML = '<img src="' + EMOJI_BASE + em[0] + '" alt="' + em[1] + '" loading="lazy">';
    card.querySelector('.feed_react_icons').appendChild(btn);
  }

  function applyState(card, item) {
    item = item || {};
    card._counts = TYPES.map(function (t) { return item[t] || 0; });
    var footer = card.querySelector('.feed_card_actions');
    if (!footer) return;
    // reactions pill: stacked icons + "N reactions" link
    var pill = document.createElement('div');
    pill.className = 'feed_action feed_react_pill';
    var icons = document.createElement('span');
    icons.className = 'feed_react_icons';
    pill.appendChild(icons);
    var link = document.createElement('a');
    link.className = 'feed_react_total';
    link.href = card.dataset.path + '#waline';
    pill.appendChild(link);
    footer.insertBefore(pill, footer.children[0]);
    // dev.to shows the icons of the most-voted reaction types
    TYPES.map(function (t, i) { return { type: t, idx: i, n: card._counts[i] }; })
      .sort(function (a, b) { return (b.n - a.n) || (a.idx - b.idx); })
      .slice(0, 3)
      .forEach(function (r) { makeIcon(card, r.type, r.idx); });
    updateTotal(card);
    // comments pill: "N comments" or "Add comment", links to the widget
    var clink = document.createElement('a');
    clink.className = 'feed_action feed_comments';
    clink.href = card.dataset.path + '#waline';
    clink.textContent = '💬';
    footer.insertBefore(clink, pill.nextSibling);
    fetch(server + '/api/comment?type=count&url=' + encodeURIComponent(card.dataset.path))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var n = (res && res.data && res.data[0]) || 0;
        clink.textContent = n ? '💬 ' + n + (n === 1 ? ' comment' : ' comments') : '💬 Add comment';
      })
      .catch(function () { clink.textContent = '💬 Comments'; });
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
    var card = b.closest('.feed_card');
    var idx = b._idx;
    var type = b.dataset.type;
    var key = storeKey(card.dataset.path, type);
    var liked = b.classList.contains('liked');
    var action = liked ? 'desc' : 'inc';
    var counts = card._counts || (card._counts = []);
    // optimistic toggle
    b.classList.toggle('liked', !liked);
    b.setAttribute('aria-pressed', String(!liked));
    counts[idx] = Math.max(0, (counts[idx] || 0) + (liked ? -1 : 1));
    updateTotal(card);
    if (liked) localStorage.removeItem(key);
    else localStorage.setItem(key, '1');
    fetch(server + '/api/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: card.dataset.path, type: type, action: action })
    }).catch(function () {
      // revert on network failure so the count stays honest
      b.classList.toggle('liked', liked);
      b.setAttribute('aria-pressed', String(liked));
      counts[idx] = Math.max(0, (counts[idx] || 0) + (liked ? 1 : -1));
      updateTotal(card);
      if (liked) localStorage.setItem(key, '1');
      else localStorage.removeItem(key);
    });
  });
})();
