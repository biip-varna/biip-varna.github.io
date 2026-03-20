/* ================================================================
   biip.js — BIIP site enhancements v2
   Reads from articles.json as single source of truth.

   Features:
   1. Reading time on articles
   2. Language switcher fix
   3. Cite this article button
   4. Related articles by topic (tag-based)
   5. Latest articles feed on homepage
   6. Author article list on expert pages
   7. Social share buttons on articles
   8. Topic pages via URL param (?topic=bulgaria)

   SAFE: each feature in its own function, wrapped in try/catch.
         All data loaded from articles.json — edit that file only
         when adding new articles.
   ================================================================ */

(function () {
  'use strict';

  var ARTICLES = null; // loaded once, shared by all features

  /* ── Language map for switcher ───────────────────────────────── */
  var LANG_MAP = {
    'index.html': 'index-en.html',
    'index-en.html': 'index.html',
    'about.html': 'about-en.html',
    'about-en.html': 'about.html',
    'regions.html': 'regions-en.html',
    'regions-en.html': 'regions.html',
    'contact.html': 'contact-en.html',
    'contact-en.html': 'contact.html',
    'submit.html': 'submit-en.html',
    'submit-en.html': 'submit.html',
    'eksperti.html': 'experts-english.html',
    'experts-english.html': 'eksperti.html',
    'africa-en.html': 'afrika.html',
    'afrika.html': 'africa-en.html',
    'cee-en.html': 'tsentralna-iztochna-evropa.html',
    'tsentralna-iztochna-evropa.html': 'cee-en.html',
    'search.html': 'search-en.html',
    'search-en.html': 'search.html',
    'bg-md.html': 'bg-md-friendship-english.html',
    'bg-md-friendship-english.html': 'bg-md.html',
    'bg-ro-vm.html': 'bul-ro-en.html',
    'bul-ro-en.html': 'bg-ro-vm.html',
    'moskva-moldova.html': 'moscow-md.html',
    'moscow-md.html': 'moskva-moldova.html',
    'digitalna-ikonomika.html': 'digital-economy-english.html',
    'digital-economy-english.html': 'digitalna-ikonomika.html',
    'evroro-v-bg-dobra-ideya.html': 'the-euro-in-bulgaria-is-a-good-idea.html',
    'the-euro-in-bulgaria-is-a-good-idea.html': 'evroro-v-bg-dobra-ideya.html',
    'kogato-romania-te-zabrani.html': 'when-romania-bans-you.html',
    'when-romania-bans-you.html': 'kogato-romania-te-zabrani.html',
    'tryabva-okonchatelno-da-se-razdelim-sas-savetskoto-vaorazhenie.html':
      'bulgaria-must-leave-soviet-armament-behind.html',
    'bulgaria-must-leave-soviet-armament-behind.html':
      'tryabva-okonchatelno-da-se-razdelim-sas-savetskoto-vaorazhenie.html',
    'pretoria-bg.html': 'pretoria-diplomatic-withdrawal.html',
    'pretoria-diplomatic-withdrawal.html': 'pretoria-bg.html',
    'keranov.html': 'keranov-en.html',
    'keranov-en.html': 'keranov.html',
    'naama.html': 'naama-en.html',
    'naama-en.html': 'naama.html',
  };

  /* ── Tag labels ──────────────────────────────────────────────── */
  var TAG_LABEL_BG = {
    'bulgaria': 'България', 'moldova': 'Молдова', 'russia': 'Русия',
    'eu': 'ЕС', 'balkans': 'Балкани', 'china': 'Китай',
    'security': 'Сигурност', 'nato': 'НАТО', 'democracy': 'Демокрация',
    'governance': 'Управление', 'corruption': 'Корупция',
    'africa': 'Африка', 'southafrica': 'Южна Африка',
    'diplomacy': 'Дипломация', 'disinformation': 'Дезинформация',
    'ai': 'ИИ', 'digitaleconomy': 'Дигитална икономика',
    'economy': 'Икономика', 'europeanparliament': 'Европарламент',
    'minorities': 'Малцинства', 'romania': 'Румъния',
  };
  var TAG_LABEL_EN = {
    'bulgaria': 'Bulgaria', 'moldova': 'Moldova', 'russia': 'Russia',
    'eu': 'EU', 'balkans': 'Balkans', 'china': 'China',
    'security': 'Security', 'nato': 'NATO', 'democracy': 'Democracy',
    'governance': 'Governance', 'corruption': 'Corruption',
    'africa': 'Africa', 'southafrica': 'South Africa',
    'diplomacy': 'Diplomacy', 'disinformation': 'Disinformation',
    'ai': 'AI', 'digitaleconomy': 'Digital Economy',
    'economy': 'Economy', 'europeanparliament': 'European Parliament',
    'minorities': 'Minorities', 'romania': 'Romania',
  };

  /* ── Author → expert page map ────────────────────────────────── */
  var AUTHOR_PAGE = {
    'keranov':           { bg: 'experts/keranov.html',    en: 'experts/keranov-en.html' },
    'konstantin-keranov':{ bg: 'experts/smilkov.html',    en: 'experts/ksmilkov-english.html' },
    'biip':              { bg: 'eksperti.html',            en: 'experts-english.html' },
  };
  // Canonical author names for matching
  var AUTHOR_ALIASES = {
    'keranov': ['keranov', 'д-р димитър керанов', 'dr. dimitar keranov',
                'dimitar keranov', 'димитър керанов', 'dr. dimitar keranov, mrssaf'],
    'konstantin-keranov': ['константин керанов', 'konstantin keranov'],
    'manuel-muller': ['мануел мюлер', 'manuel müller', 'manuel muller'],
    'vladimir-mitev': ['владимир митев', 'vladimir mitev'],
    'biip': ['bulgarian institute for international politics', 'biip', 'бимп'],
  };

  function normalizeAuthorId(authorStr) {
    if (!authorStr) return null;
    var lower = authorStr.toLowerCase();
    for (var id in AUTHOR_ALIASES) {
      if (AUTHOR_ALIASES[id].some(function(a){ return lower.indexOf(a) !== -1; })) {
        return id;
      }
    }
    return null;
  }

  /* ── Helpers ─────────────────────────────────────────────────── */
  function currentFile() {
    var parts = window.location.pathname.split('/');
    return parts[parts.length - 1] || 'index.html';
  }

  function getLang() {
    return document.documentElement.lang || 'bg';
  }

  function tagLabel(tag, lang) {
    return lang === 'en' ? (TAG_LABEL_EN[tag] || tag) : (TAG_LABEL_BG[tag] || tag);
  }

  function imgSrc(img) {
    // Determine depth of current page
    var depth = window.location.pathname.split('/').length - 2;
    var prefix = '';
    for (var i = 0; i < depth; i++) prefix += '../';
    return prefix + img.replace(/ /g, '%20');
  }

  function articleUrl(file) {
    var depth = window.location.pathname.split('/').length - 2;
    var prefix = '';
    for (var i = 0; i < depth; i++) prefix += '../';
    return prefix + file;
  }

  /* ── FEATURE 1: Reading Time ─────────────────────────────────── */
  function initReadingTime() {
    var article = document.querySelector('article');
    if (!article) return;
    var text  = article.innerText || article.textContent || '';
    var words = text.trim().split(/\s+/).filter(function(w){ return w.length > 0; }).length;
    var mins  = Math.max(1, Math.round(words / 200));
    var lang  = getLang();
    var label = (lang === 'en')
      ? mins + ' min read'
      : 'Четенето отнема около ' + mins + (mins === 1 ? ' минута' : ' минути');
    var datePara = article.querySelector('p[style*="color:#888"]') || article.querySelector('p');
    if (!datePara) return;
    var span = document.createElement('span');
    span.className = 'reading-time';
    span.textContent = ' · ⏱ ' + label;
    datePara.appendChild(span);
  }

  /* ── FEATURE 2: Language Switcher ───────────────────────────── */
  function initLangSwitcher() {
    var file = currentFile();
    var counterpart = LANG_MAP[file];
    if (!counterpart) return;
    document.querySelectorAll('nav a').forEach(function(a) {
      var txt = a.textContent.trim();
      if (txt === 'BG' || txt === 'EN') {
        var href = a.getAttribute('href') || '';
        a.setAttribute('href', href.replace(/[^/]*\.html$/, counterpart));
      }
    });
  }

  /* ── FEATURE 3: Cite This Article ───────────────────────────── */
  function initCiteButton() {
    var article = document.querySelector('article');
    if (!article) return;
    var lang    = getLang();
    var titleEl = document.querySelector('title');
    var titleTx = titleEl ? titleEl.textContent.replace(/\s*\|\s*(БИМП|BIIP).*/i, '').trim() : '';
    var authorM = document.querySelector('meta[name="author"]');
    var author  = authorM ? authorM.getAttribute('content') : '';
    var pubM    = document.querySelector('meta[property="article:published_time"]');
    var pubDate = pubM ? pubM.getAttribute('content') : '';
    var url     = window.location.href.replace(window.location.hash, '');
    var year    = pubDate ? pubDate.substring(0, 4) : new Date().getFullYear();
    var dateStr = pubDate
      ? new Date(pubDate).toLocaleDateString(lang === 'en' ? 'en-GB' : 'bg-BG',
          {year:'numeric', month:'long', day:'numeric'})
      : '';

    function fmtAPA(name) {
      var parts = name.trim().split(' ');
      if (parts.length < 2) return name;
      var last = parts[parts.length - 1];
      var first = parts.slice(0, -1).map(function(p){ return p[0] ? p[0] + '.' : ''; }).join(' ');
      return last + ', ' + first;
    }

    var chicago = (author ? author.split(';')[0].trim() + '. ' : '') +
      '"' + titleTx + '." ' +
      'Bulgarian Institute for International Politics (BIIP), ' +
      (dateStr ? dateStr + '. ' : '') + url + '.';

    var apa = (author ? fmtAPA(author.split(';')[0].trim()) + ' ' : '') +
      '(' + year + '). ' + titleTx + '. ' +
      'Bulgarian Institute for International Politics. ' + url;

    var btnLabel = lang === 'en' ? '📋 Cite this article' : '📋 Цитирайте тази статия';
    var copyLbl  = lang === 'en' ? 'Copy' : 'Копирай';
    var copiedLbl= lang === 'en' ? '✓ Copied!' : '✓ Копирано!';

    document.body.insertAdjacentHTML('beforeend',
      '<div id="cite-modal" role="dialog" aria-modal="true" style="display:none;position:fixed;' +
      'top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:10000;' +
      'align-items:center;justify-content:center;">' +
        '<div style="background:#fff;max-width:600px;width:90%;border-radius:10px;padding:1.5em;' +
        'box-shadow:0 8px 32px rgba(0,0,0,0.18);position:relative;">' +
          '<button type="button" id="cite-close" style="position:absolute;top:10px;right:14px;' +
          'background:none;border:none;font-size:1.4em;cursor:pointer;color:#555;" ' +
          'aria-label="Close">✕</button>' +
          '<h3 style="margin:0 0 1em 0;">' + btnLabel + '</h3>' +
          '<label style="font-weight:bold;font-size:.9em;">Chicago</label>' +
          '<div class="cite-box" id="cite-chicago">' + chicago + '</div>' +
          '<button type="button" class="cite-copy-btn" data-target="cite-chicago">' + copyLbl + '</button>' +
          '<label style="font-weight:bold;font-size:.9em;margin-top:1em;display:block;">APA 7</label>' +
          '<div class="cite-box" id="cite-apa">' + apa + '</div>' +
          '<button type="button" class="cite-copy-btn" data-target="cite-apa">' + copyLbl + '</button>' +
        '</div></div>');

    var afterH = article.querySelector('h2') || article.querySelector('h1');
    if (!afterH) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cite-trigger-btn';
    btn.textContent = btnLabel;
    afterH.insertAdjacentElement('afterend', btn);

    function closeModal() {
      document.getElementById('cite-modal').style.display = 'none';
      btn.focus();
    }
    btn.addEventListener('click', function() {
      document.getElementById('cite-modal').style.display = 'flex';
      document.getElementById('cite-close').focus();
    });
    document.getElementById('cite-close').addEventListener('click', closeModal);
    document.getElementById('cite-modal').addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

    document.querySelectorAll('.cite-copy-btn').forEach(function(cb) {
      cb.addEventListener('click', function() {
        var text = document.getElementById(cb.getAttribute('data-target')).textContent;
        var self = cb;
        function done() {
          self.textContent = copiedLbl;
          setTimeout(function(){ self.textContent = copyLbl; }, 2000);
        }
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
          document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta); done();
        }
      });
    });
  }

  /* ── FEATURE 4: Related Articles ────────────────────────────── */
  function initRelatedArticles() {
    if (!ARTICLES) return;
    var article = document.querySelector('article');
    if (!article) return;
    var file = currentFile();
    var lang = getLang();
    var current = null;
    for (var i = 0; i < ARTICLES.length; i++) {
      var fname = ARTICLES[i].file.split('/').pop();
      if (fname === file) { current = ARTICLES[i]; break; }
    }
    if (!current || !current.tags || !current.tags.length) return;

    var related = ARTICLES.filter(function(a) {
      var fname = a.file.split('/').pop();
      if (fname === file) return false;
      if (a.lang !== lang) return false;
      return a.tags && a.tags.some(function(t){ return current.tags.indexOf(t) !== -1; });
    }).slice(0, 3);
    if (!related.length) return;

    var existing = article.querySelector('.related-articles');
    if (existing) existing.remove();

    var heading = lang === 'en' ? 'Related Articles' : 'Свързани статии';
    var html = '<section class="related-articles"><h2>' + heading + '</h2><div class="related-list">';
    related.forEach(function(a) {
      html += '<a href="' + a.file.split('/').pop() + '" class="related-article">' +
        '<img src="' + imgSrc(a.img) + '" alt="" class="related-thumb" width="44" height="44" loading="lazy">' +
        '<div class="related-info"><div class="related-title">' + a.title + '</div></div></a>';
    });
    html += '</div></section>';
    article.insertAdjacentHTML('beforeend', html);
  }

  /* ── FEATURE 5: Tag badges on articles ──────────────────────── */
  function initTagBadges() {
    if (!ARTICLES) return;
    var article = document.querySelector('article');
    if (!article) return;
    var file = currentFile();
    var lang = getLang();
    var current = null;
    for (var i = 0; i < ARTICLES.length; i++) {
      if (ARTICLES[i].file.split('/').pop() === file) { current = ARTICLES[i]; break; }
    }
    if (!current || !current.tags || !current.tags.length) return;

    var datePara = article.querySelector('p[style*="color:#888"]');
    if (!datePara) return;

    var tagHtml = '<div class="article-tags" style="margin-top:0.5em;">';
    current.tags.forEach(function(tag) {
      var depth = window.location.pathname.split('/').length - 2;
      var prefix = '';
      for (var i = 0; i < depth; i++) prefix += '../';
      tagHtml += '<a href="' + prefix + 'topics.html?topic=' + encodeURIComponent(tag) +
        '" class="tag-badge">' + tagLabel(tag, lang) + '</a> ';
    });
    tagHtml += '</div>';
    datePara.insertAdjacentHTML('afterend', tagHtml);
  }

  /* ── FEATURE 6: Social Share Buttons ────────────────────────── */
  function initShareButtons() {
    var article = document.querySelector('article');
    if (!article) return;
    var lang    = getLang();
    var url     = encodeURIComponent(window.location.href);
    var titleEl = document.querySelector('title');
    var title   = encodeURIComponent(titleEl ? titleEl.textContent.replace(/\s*\|\s*(БИМП|BIIP).*/i,'').trim() : '');

    var shareLabel  = lang === 'en' ? 'Share:' : 'Сподели:';
    var linkedinUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + url;
    var twitterUrl  = 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title;
    var facebookUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + url;

    var html =
      '<div class="share-buttons">' +
        '<span class="share-label">' + shareLabel + '</span>' +
        '<a href="' + linkedinUrl + '" target="_blank" rel="noopener noreferrer" ' +
          'class="share-btn share-linkedin" aria-label="Share on LinkedIn">in</a>' +
        '<a href="' + twitterUrl + '" target="_blank" rel="noopener noreferrer" ' +
          'class="share-btn share-twitter" aria-label="Share on X/Twitter">𝕏</a>' +
        '<a href="' + facebookUrl + '" target="_blank" rel="noopener noreferrer" ' +
          'class="share-btn share-facebook" aria-label="Share on Facebook">f</a>' +
      '</div>';

    // Insert after the date paragraph
    var datePara = article.querySelector('p[style*="color:#888"]');
    if (datePara) {
      datePara.insertAdjacentHTML('afterend', html);
    } else {
      article.insertAdjacentHTML('afterbegin', html);
    }
  }

  /* ── FEATURE 7: Latest Articles on Homepage ─────────────────── */
  function initLatestFeed() {
    if (!ARTICLES) return;
    var lang = getLang();

    // Look for the placeholder we'll inject into
    var container = document.getElementById('latest-articles-feed');
    if (!container) return;

    // Get articles in this language sorted by date desc
    var filtered = ARTICLES.filter(function(a){ return a.lang === lang; });
    filtered.sort(function(a, b){ return (b.date || '').localeCompare(a.date || ''); });
    var latest = filtered.slice(0, 6);

    var html = '<div class="article-preview-list">';
    latest.forEach(function(a) {
      html +=
        '<a href="' + a.file + '" class="article-preview">' +
          '<img src="' + a.img.replace(/ /g, '%20') + '" alt="" class="article-thumb" ' +
            'width="44" height="44" loading="lazy">' +
          '<div class="article-info">' +
            '<h4>' + a.title + '</h4>' +
            '<p class="article-meta">' + (a.author || '') +
              (a.date ? ' · ' + a.date : '') + '</p>' +
            '<p class="article-teaser">' + (a.desc || '') + '</p>' +
          '</div>' +
        '</a>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  /* ── FEATURE 8: Author Article List on Expert Pages ─────────── */
  function initAuthorArticles() {
    if (!ARTICLES) return;
    var container = document.getElementById('author-articles');
    if (!container) return;

    var lang     = getLang();
    var authorId = container.getAttribute('data-author-id');
    if (!authorId) return;

    var authored = ARTICLES.filter(function(a) {
      if (a.lang !== lang) return false;
      // Match by authorId directly or via alias normalisation
      if (a.authorId === authorId) return true;
      var normId = normalizeAuthorId(a.author);
      return normId === authorId;
    });
    authored.sort(function(a, b){ return (b.date || '').localeCompare(a.date || ''); });

    if (!authored.length) {
      container.style.display = 'none';
      return;
    }

    var heading = lang === 'en' ? 'Articles by this Expert' : 'Статии на този експерт';
    var html = '<h2 style="margin-top:2em;">' + heading + '</h2><div class="article-preview-list">';
    authored.forEach(function(a) {
      html +=
        '<a href="../' + a.file + '" class="article-preview">' +
          '<img src="../' + a.img.replace(/ /g, '%20') + '" alt="" class="article-thumb" ' +
            'width="44" height="44" loading="lazy">' +
          '<div class="article-info">' +
            '<h4>' + a.title + '</h4>' +
            '<p class="article-meta">' + (a.date || '') + '</p>' +
          '</div>' +
        '</a>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  /* ── FEATURE 9: Topics Page ──────────────────────────────────── */
  function initTopicsPage() {
    if (!ARTICLES) return;
    var container = document.getElementById('topics-page');
    if (!container) return;

    var lang  = getLang();
    var params = new URLSearchParams(window.location.search);
    var topic = params.get('topic');

    // Build tag cloud if no topic selected
    if (!topic) {
      var tagCounts = {};
      ARTICLES.forEach(function(a) {
        if (a.lang !== lang) return;
        (a.tags || []).forEach(function(t) {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      });
      var heading = lang === 'en' ? 'Browse by Topic' : 'Разгледай по тема';
      var html = '<h1>' + heading + '</h1><div class="tag-cloud">';
      Object.keys(tagCounts).sort().forEach(function(tag) {
        html += '<a href="topics.html?topic=' + encodeURIComponent(tag) + '" class="tag-badge tag-large">' +
          tagLabel(tag, lang) + ' <span class="tag-count">(' + tagCounts[tag] + ')</span></a> ';
      });
      html += '</div>';
      container.innerHTML = html;
      return;
    }

    // Show articles for selected topic
    var filtered = ARTICLES.filter(function(a) {
      return a.lang === lang && a.tags && a.tags.indexOf(topic) !== -1;
    });
    filtered.sort(function(a, b){ return (b.date || '').localeCompare(a.date || ''); });

    var topicName = tagLabel(topic, lang);
    var backLabel = lang === 'en' ? '← All topics' : '← Всички теми';
    var html = '<p><a href="topics.html">' + backLabel + '</a></p>' +
      '<h1>' + topicName + ' <span style="font-weight:normal;color:#888;font-size:0.7em;">(' + filtered.length + ')</span></h1>' +
      '<div class="article-preview-list">';

    filtered.forEach(function(a) {
      html +=
        '<a href="' + a.file + '" class="article-preview">' +
          '<img src="' + a.img.replace(/ /g, '%20') + '" alt="" class="article-thumb" ' +
            'width="44" height="44" loading="lazy">' +
          '<div class="article-info">' +
            '<h4>' + a.title + '</h4>' +
            '<p class="article-meta">' + (a.author || '') + (a.date ? ' · ' + a.date : '') + '</p>' +
            '<p class="article-teaser">' + (a.desc || '') + '</p>' +
          '</div>' +
        '</a>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  /* ── INIT ────────────────────────────────────────────────────── */
  function runAll() {
    try { initReadingTime(); }    catch(e) { console.warn('readingTime:', e); }
    try { initLangSwitcher(); }   catch(e) { console.warn('langSwitcher:', e); }
    try { initCiteButton(); }     catch(e) { console.warn('citeButton:', e); }
    try { initTagBadges(); }      catch(e) { console.warn('tagBadges:', e); }
    try { initShareButtons(); }   catch(e) { console.warn('shareButtons:', e); }
    try { initRelatedArticles(); }catch(e) { console.warn('relatedArticles:', e); }
    try { initLatestFeed(); }     catch(e) { console.warn('latestFeed:', e); }
    try { initAuthorArticles(); } catch(e) { console.warn('authorArticles:', e); }
    try { initTopicsPage(); }     catch(e) { console.warn('topicsPage:', e); }
  }

  function init() {
    // Load articles.json first, then run all features
    var depth = window.location.pathname.split('/').length - 2;
    var prefix = '';
    for (var i = 0; i < depth; i++) prefix += '../';

    fetch(prefix + 'articles.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        ARTICLES = data;
        runAll();
      })
      .catch(function(e) {
        console.warn('biip: could not load articles.json, running without article data', e);
        runAll(); // still run lang switcher, cite button etc.
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
