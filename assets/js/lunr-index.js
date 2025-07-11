// Example Lunr.js setup; replace `documents` with your actual page index
// `documents` is an array of objects like { url, title, content }
const documents = [
  { url: "/index.html", title: "Добре дошли", content: "Ние сме независимо…" },
  { url: "/about.html", title: "За нас", content: "Българският институт…" },
  // ...and so on for each page/article
];

const idx = lunr(function(){
  this.ref('url');
  this.field('title');
  this.field('content');
  documents.forEach(doc => this.add(doc));
});

window.addEventListener('DOMContentLoaded', () => {
  const box = document.getElementById('searchBox');
  const resList = document.getElementById('results');
  box.addEventListener('input', () => {
    const query = box.value;
    const results = idx.search(query);
    resList.innerHTML = results.map(r =>
      `<li><a href="${r.ref}">${r.ref}</a></li>`
    ).join('');
  });
});