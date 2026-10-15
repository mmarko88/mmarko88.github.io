// Waline reactions on feed cards — dev.to-style pill: up to 3 emoji
// icons (top-voted types, still one-click toggles) with per-type counts,
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

  // per-icon count label: shown whenever the type has votes
  function updateCounts(card) {
    var counts = card._counts || [];
    Array.prototype.forEach.call(card.querySelectorAll('.feed_react'), function (b) {
      var n = counts[b._idx] || 0;
      var c = b.querySelector('.feed_react_n');
      if (c) c.textContent = n >= 1 ? String(n) : '';
    });
  }

  function makeIcon(card, icons, type, idx) {
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
    var n = card._counts[idx] || 0;
    btn.innerHTML = '<img src="' + EMOJI_BASE + em[0] + '" alt="' + em[1] + '" loading="lazy">' +
      '<span class="feed_react_n">' + (n >= 1 ? n : '') + '</span>';
    icons.appendChild(btn);
  }

  function applyState(card, item) {
    item = item || {};
    card._counts = TYPES.map(function (t) { return item[t] || 0; });
    var footer = card.querySelector('.feed_card_actions');
    if (!footer) return;
    // reactions pill: icons with per-type counts (like button when empty)
    var pill = document.createElement('div');
    pill.className = 'feed_action feed_react_pill';
    // dev.to: reaction types with votes get an icon (top 3); a type the
    // user already toggled stays visible even if its count reads 0
    var top = TYPES.map(function (t, i) { return { type: t, idx: i, n: card._counts[i] }; })
      .filter(function (r) { return r.n > 0 || localStorage.getItem(storeKey(card.dataset.path, r.type)); })
      .sort(function (a, b) { return (b.n - a.n) || (a.idx - b.idx); })
      .slice(0, 3);
    // no reactions yet: seed the pill with the like button so the first
    // reaction can be cast straight from the feed
    if (!top.length) top.push({ type: TYPES[0], idx: 0, n: 0 });
    var icons = document.createElement('span');
    icons.className = 'feed_react_icons';
    pill.appendChild(icons);
    top.forEach(function (r) { makeIcon(card, icons, r.type, r.idx); });
    footer.insertBefore(pill, footer.children[0]);
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
    updateCounts(card);
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
      updateCounts(card);
      if (liked) localStorage.setItem(key, '1');
      else localStorage.removeItem(key);
    });
  });
})();
