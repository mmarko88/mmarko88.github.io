// Waline reactions on feed cards — heart like + emoji reaction badges.
// GET  /api/article?path=p1,p2&type=reaction0,...,reaction5
//      -> {errno:0, data:[{reaction0..reaction5}, ...]} — items align
//         positionally with the requested paths (no path field on items)
// POST /api/article  {path, type:'reactionN', action:'inc'|'desc'}
// reaction0 is the heart button; reaction1-5 render as emoji badges under
// the card — the same counters the comment widget shows on the post page.
(function () {
  var box = document.getElementById('feed_items');
  if (!box) return;
  var server = (box.dataset.walineServer || '').replace(/\/+$/, '');
  if (!server) return;

  var KEY = 'waline:liked:';
  var TYPES = ['reaction0', 'reaction1', 'reaction2', 'reaction3', 'reaction4', 'reaction5'];
  // waline's tieba emoji pack — the same images the widget uses on posts
  var EMOJI_BASE = 'https://unpkg.com/@waline/emojis/tieba/';
  var EMOJI = {
    reaction1: ['tieba_look_down.png', 'Dislike'],
    reaction2: ['tieba_sunglasses.png', 'Cool'],
    reaction3: ['tieba_pick_nose.png', 'Meh'],
    reaction4: ['tieba_awkward.png', 'Awkward'],
    reaction5: ['tieba_sleep.png', 'Boring']
  };

  // heart keeps the original key so likes stored by earlier versions apply
  function storeKey(path, type) {
    return type === 'reaction0' ? KEY + path : KEY + path + ':' + type;
  }

  function pendingButtons() {
    return Array.prototype.slice.call(box.querySelectorAll('.feed_like'))
      .filter(function (b) { return !b._likeInit; });
  }

  function setCount(b, n) {
    n = Math.max(n, 0);
    var c = b.querySelector('.feed_like_count');
    if (c) c.textContent = n;
    // three visual states: no likes (count hidden) / likes by others
    // (accent count, hollow heart) / liked by me (filled heart)
    b.classList.toggle('has_likes', n > 0);
  }

  function applyState(b, item) {
    item = item || {};
    b._likeInit = true;
    setCount(b, item.reaction0 || 0);
    if (localStorage.getItem(storeKey(b.dataset.path, 'reaction0'))) {
      b.classList.add('liked');
      b.setAttribute('aria-pressed', 'true');
    }
    renderReacts(b, item);
  }

  // emoji badge row under the card footer — created on demand
  function reactsRow(b) {
    var card = b.closest('.feed_card');
    var row = card && card.querySelector('.feed_reacts');
    if (!row && card) {
      row = document.createElement('div');
      row.className = 'feed_reacts';
      card.appendChild(row);
    }
    return row;
  }

  // one badge per reaction type that has votes (or was voted by this visitor)
  function renderReacts(b, item) {
    Object.keys(EMOJI).forEach(function (type) {
      var n = item[type] || 0;
      var liked = !!localStorage.getItem(storeKey(b.dataset.path, type));
      if (n <= 0 && !liked) return;
      var row = reactsRow(b);
      if (!row) return;
      var em = EMOJI[type];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'feed_action feed_react' + (liked ? ' liked' : '');
      btn.dataset.path = b.dataset.path;
      btn.dataset.type = type;
      btn.setAttribute('aria-pressed', String(liked));
      btn.setAttribute('aria-label', em[1]);
      btn.innerHTML = '<img src="' + EMOJI_BASE + em[0] + '" alt="" loading="lazy"><span class="feed_like_count">' + n + '</span>';
      btn.classList.toggle('has_likes', n > 0);
      row.appendChild(btn);
    });
  }

  function fetchCounts() {
    var btns = pendingButtons();
    if (!btns.length) return;
    var paths = [];
    btns.forEach(function (b) { if (paths.indexOf(b.dataset.path) < 0) paths.push(b.dataset.path); });
    // mark first so infinite-scroll fetches can't double-fire for the same paths
    btns.forEach(function (b) { b._likeInit = true; });
    fetch(server + '/api/article?path=' + paths.map(encodeURIComponent).join(',') + '&type=' + TYPES.join(','))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var list = (res && res.data) || [];
        var map = {};
        paths.forEach(function (p, i) { map[p] = list[i] || {}; });
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
    var b = e.target.closest('.feed_like, .feed_react');
    if (!b || !box.contains(b)) return;
    var type = b.dataset.type || 'reaction0';
    var key = storeKey(b.dataset.path, type);
    var liked = b.classList.contains('liked');
    var action = liked ? 'desc' : 'inc';
    var c = b.querySelector('.feed_like_count');
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
