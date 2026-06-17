(function () {
  var saved = localStorage.getItem('df_theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.background = '#0b0f1a';
  }
})();
