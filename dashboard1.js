/* Acadaelash dashboard shell helpers.
   Small, additive: nothing here touches data or Supabase. If this file fails to load,
   the portal still works (it just loses the breadcrumb, eyebrow and shortcuts). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;

  /* Breadcrumb + eyebrow follow the page title that the portal already sets ------------- */
  var title = $('title'), crumb = $('dx-crumb'), eyebrow = $('dx-eyebrow'), nav = $('nav');
  function groupOf(btn) {
    var n = btn && btn.previousElementSibling;
    while (n && !n.classList.contains('dx-nav-label')) n = n.previousElementSibling;
    return n ? n.textContent.trim() : '';
  }
  function syncHead() {
    if (!title) return;
    if (crumb) crumb.textContent = title.textContent;
    if (title.textContent) document.title = title.textContent + ' | Acadaelash LMS';
    if (eyebrow && nav) eyebrow.textContent = groupOf(nav.querySelector('button.on'));
  }
  if (title) {
    new MutationObserver(syncHead).observe(title, { childList: true });
    if (nav) new MutationObserver(syncHead).observe(nav, { attributes: true, subtree: true, attributeFilter: ['class'] });
    syncHead();
  }

  /* Quick light / dark toggle: reuses the portal's own Appearance buttons ---------------- */
  var tbtn = $('dx-theme');
  function currentTheme() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function syncTheme() {
    if (tbtn) tbtn.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  if (tbtn) {
    tbtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      var opt = document.querySelector('[data-theme-opt="' + next + '"]');
      if (opt) opt.click();
      else {                                   /* fallback if the menu buttons are ever removed */
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('acadaelash-theme', next); } catch (e) { /* storage blocked */ }
      }
      syncTheme();
    });
    new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    syncTheme();
  }

  /* Ctrl+K / Cmd+K or "/" jumps to search, Esc leaves it ---------------------------------- */
  var input = $('gsearch'), kbd = $('dx-kbd');
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  if (kbd) kbd.textContent = isMac ? '⌘ K' : 'Ctrl K';
  document.addEventListener('keydown', function (e) {
    if (!input || document.body.classList.contains('locked')) return;
    var tag = (e.target && e.target.tagName) || '';
    var typing = /INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); input.focus(); input.select();
    } else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault(); input.focus();
    } else if (e.key === 'Escape' && e.target === input && !input.value) {
      input.blur();
    }
  });
})();