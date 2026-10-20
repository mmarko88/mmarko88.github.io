// Waline likes — a single heart button (Instagram-style like) with the
// count beside it. Runs on feed cards (.feed_card[data-path]) and on the
// post-page engagement bar (.post_like[data-path]); both write reaction0
// so feed and post counts stay identical.
// GET  /api/article?path=p1,p2&type=reaction0
//      -> {errno:0, data:[{reaction0}, ...]} — items align
//         positionally with the requested paths (no path field on items)
// POST /api/article  {path, type:'reactionN', action:'inc'|'desc'}
// reaction0 keeps the original waline:liked:<path> keys from the heart era.
(function () {
  var box = document.getElementById('feed_items');
  var postLike = document.querySelector('.post_like[data-path]');
  var server = (((box && box.dataset.walineServer) ||
    (postLike && postLike.dataset.walineServer)) || '').replace(/\/+$/, '');
  if (!server) return;

  var KEY = 'waline:liked:';
  // twemoji pack — same image as the widget's single reaction button
  var EMOJI_BASE = 'https://unpkg.com/@waline/emojis/tw/';
  var EMOJI = [
    ['2764.png', 'Like']
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
    // Instagram-style inline SVG heart — outline when unliked, filled when
    // liked. Works in both light and dark mode (no CSS filter on images).
    btn.innerHTML =
      '<svg class="feed_react_heart" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 ' +
        '2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 ' +
        '14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 ' +
        '11.54L12 21.35z"/>' +
      '</svg>' +
      '<span class="feed_react_n">' + (n >= 1 ? n : '') + '</span>';
    icons.appendChild(btn);
  }

  function applyState(card, item) {
    item = item || {};
    card._counts = TYPES.map(function (t) { return item[t] || 0; });
    var footer = card.querySelector('.feed_card_actions');
    if (!footer) return;
    // reactions pill: a single heart like button, always shown — the
    // count label stays empty until reaction0 has votes
    var pill = document.createElement('div');
    pill.className = 'feed_action feed_react_pill';
    var icons = document.createElement('span');
    icons.className = 'feed_react_icons';
    pill.appendChild(icons);
    makeIcon(card, icons, TYPES[0], 0);
    footer.insertBefore(pill, footer.children[0]);
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

  // feed: init counts now + for cards appended later by infinite scroll
  if (box) {
    fetchCounts();
    new MutationObserver(fetchCounts).observe(box, { childList: true });
  }

  // post page: render the heart immediately, then fill in the count
  if (postLike) {
    postLike._counts = [0];
    makeIcon(postLike, postLike.querySelector('.feed_react_icons'), TYPES[0], 0);
    fetch(server + '/api/article?path=' + encodeURIComponent(postLike.dataset.path) +
        '&type=' + TYPES.join(','))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var item = (res && res.data && res.data[0]) || {};
        postLike._counts = TYPES.map(function (t) { return item[t] || 0; });
        updateCounts(postLike);
      })
      .catch(function () {}); // heart still toggles; count stays hidden
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.feed_react');
    if (!b) return;
    // works for feed cards (.feed_card) and the post bar (.post_like)
    var card = b.closest('[data-path]');
    if (!card) return;
    var idx = b._idx;
    var type = b.dataset.type;
    var key = storeKey(card.dataset.path, type);
    var liked = b.classList.contains('liked');
    var action = liked ? 'desc' : 'inc';
    var counts = card._counts || (card._counts = []);
    // optimistic toggle
    b.classList.toggle('liked', !liked);
    b.setAttribute('aria-pressed', String(!liked));
    // Instagram-style one-shot "pulse" animation when transitioning
    // unliked -> liked. We remove it after the keyframes finish so the
    // same card can replay it on the next like.
    if (!liked) {
      b.classList.remove('just-liked');
      // Force reflow so re-adding the class retriggers the animation.
      // eslint-disable-next-line no-unused-expressions
      b.offsetWidth;
      b.classList.add('just-liked');
      setTimeout(function () { b.classList.remove('just-liked'); }, 550);
    }
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
