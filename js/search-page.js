// Search page driver — self-contained live search.
// (Theme's input path is buggy on /search/: it passes `true` as scope and
// filters out every result. This page uses its own input class so theme
// listeners never bind, and renders live results itself using the Fuse
// instance + index.json the theme already provides.)
document.addEventListener('DOMContentLoaded', function () {
  var field = document.querySelector('.search_page_input');
  var resultsEl = document.getElementById('searchpage');
  if (!field || !resultsEl || typeof Fuse === 'undefined') return;

  fetch('/index.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var fuse = new Fuse(data, {
        ignoreLocation: true,
        findAllMatches: true,
        includeScore: true,
        shouldSort: true,
        keys: ['title', 'link', 'body', 'id', 'section', 'tags'],
        threshold: 0.0
      });

      function snippet(body, term) {
        body = body || '';
        var idx = body.toLowerCase().indexOf(term);
        if (idx < 0) return body.slice(0, 160);
        var start = Math.max(0, idx - 40);
        return (start ? '…' : '') + body.slice(start, idx + 160) + '…';
      }

      function render(term) {
        term = term.trim().toLowerCase();
        resultsEl.innerHTML = '';
        if (term.length < 2) {
          resultsEl.innerHTML = '<span class="search_result">Type to search</span>';
          return;
        }
        var hits = fuse.search(term).slice(0, 12);
        if (!hits.length) {
          resultsEl.innerHTML = '<span class="search_result">No matches found</span>';
          return;
        }
        hits.forEach(function (h) {
          var it = h.item;
          var a = document.createElement('a');
          a.className = 'search_result passive';
          a.href = it.link + '?query=' + encodeURIComponent(term);
          var t = document.createElement('h3');
          t.textContent = it.title;
          a.appendChild(t);
          var p = document.createElement('p');
          p.textContent = snippet(it.body, term);
          a.appendChild(p);
          resultsEl.appendChild(a);
        });
      }

      var q = new URLSearchParams(window.location.search).get('query') || '';
      field.addEventListener('input', function () { render(field.value); });
      if (q) { field.value = q; render(q); }
      else { resultsEl.innerHTML = '<span class="search_result">Type to search</span>'; }
      field.focus();
    })
    .catch(function () {
      resultsEl.innerHTML = '<span class="search_result">Search index unavailable</span>';
    });
});
