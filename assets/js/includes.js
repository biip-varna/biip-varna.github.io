(function(){
  function loadInclude(id, path) {
    fetch(path)
      .then(r => r.text())
      .then(html => document.getElementById(id).innerHTML = html);
  }
  document.addEventListener('DOMContentLoaded', () => {
    const isEn = location.pathname.includes('-en');
loadInclude('site-header',
  isEn
    ? 'includes/header-en.html'
    : 'includes/header.html'
);

    document.body.addEventListener('click', e => {
      if (e.target.id === 'menu-toggle') {
        document.getElementById('nav-links').classList.toggle('open');
      }
    });
  });
})();