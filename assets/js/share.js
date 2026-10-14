// Share: native share -> clipboard fallback.
// Used by feed cards (.feed_share) and post meta — loaded on all pages.
document.addEventListener('click', function (e) {
  var b = e.target.closest('.feed_share');
  if (!b) return;
  if (navigator.share) {
    navigator.share({ title: b.dataset.title, url: b.dataset.share }).catch(function () {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(b.dataset.share).then(function () {
      var html = b.innerHTML;
      b.textContent = 'Copied!';
      setTimeout(function () { b.innerHTML = html; }, 1500);
    });
  }
});
