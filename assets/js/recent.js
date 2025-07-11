(function(){
  const isEn = window.location.pathname.includes('-en');
  const file = isEn
    ? '/includes/recent-articles-en.json'
    : '/includes/recent-articles.json';

  fetch(file)
    .then(r => r.json())
    .then(data => {
      const container = document.getElementById('recent-articles');
      if (!container) return;

      const heading = isEn ? 'Recent Articles' : 'Последни статии';
      container.innerHTML = `<h3>${heading}</h3>` +
        data.map(a =>
          `<a href="${a.url}">${a.title} <small>(${a.date})</small></a>`
        ).join('');
    });
})();