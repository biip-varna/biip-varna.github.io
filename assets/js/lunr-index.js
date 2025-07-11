// Example documents array; replace with your actual index data.
const documents = [
  { url: "/index.html", title: "Добре дошли", content: "Ние сме независимо..." },
  { url: "/about.html", title: "За нас", content: "Българският институт..." },
  // …and so on for each page or article
];

const idx = lunr(function(){
  this.ref('url');
  this.field('title');
  this.field('content');
  documents.forEach(doc => this.add(doc));
});

window.addEventListener('DOMContentLoaded', () => {
  const box = document.getElementById('searchBox');
  const resultsList = document.getElementById('results');
  if (!box || !resultsList) return;

  box.addEventListener('input', () => {
    const query = box.value.trim();
    if (!query) {
      resultsList.innerHTML = '';
      return;
    }
    const results = idx.search(query);
    resultsList.innerHTML = results.map(r =>
      `<li><a href="${r.ref}">${r.ref}</a></li>`
    ).join('');
  });
});