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
    'asia.html': 'asia-en.html',
    'asia-en.html': 'asia.html',
    'proektsia-ep-juli25.html': 'ep-coalition-preview-summary.html',
    'ep-coalition-preview-summary.html': 'proektsia-ep-juli25.html',
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

  /* ── Expert tag codes → labels (mirrors TAG_LABEL in listing pages) ── */
  var EXPERT_TAG_LABEL = {
    AFR:   { bg: 'Африка',                  en: 'Africa' },
    IR:    { bg: 'Международни отношения',  en: 'International Relations' },
    SEC:   { bg: 'Сигурност & геополитика', en: 'Security & Geopolitics' },
    EU:    { bg: 'Европейски въпроси',      en: 'EU Affairs' },
    TECH:  { bg: 'Технологии',             en: 'Technology' },
    COMMS: { bg: 'Комуникации',            en: 'Communications' },
    CZ:    { bg: 'Чехия',                  en: 'Czech Politics' },
    ME:    { bg: 'Близък изток',           en: 'Middle East' },
    AIR:   { bg: 'Авиация',               en: 'Aviation Policy' },
  };

  /* ── Author → expert profile map ────────────────────────────── */
  var AUTHOR_PAGE = {
    'keranov':            { bg: 'experts/keranov.html',          en: 'experts/keranov-en.html',
                            img: 'experts/images/Keranov.jpg',
                            role_bg: 'Експерт Африка и ЦИЕ',    role_en: 'Expert on Africa & CEE',
                            tags: ['AFR', 'IR', 'SEC'] },
    'konstantin-keranov': { bg: null, en: null,
                            img: 'experts/images/KKeranov.png',
                            role_bg: 'Експерт Дигитална икономика',
                            role_en: 'Expert on Digital Economy & Emerging Technologies',
                            tags: ['TECH'] },
    'uzunov':             { bg: 'experts/uzunov.html',           en: 'experts/auzunov-english.html',
                            img: 'experts/images/Uzunov.jpg',
                            role_bg: 'Експерт Национална сигурност',
                            role_en: 'Expert on National Security & Geopolitics',
                            tags: ['SEC', 'IR'] },
    'smilkov':            { bg: 'experts/smilkov.html',          en: 'experts/ksmilkov-english.html',
                            img: 'experts/images/Smilkov.png',
                            role_bg: 'Експерт Международни отношения',
                            role_en: 'Expert on International Relations',
                            tags: ['IR'] },
    'petrov':             { bg: 'experts/petrov.html',           en: 'experts/aradzhioni.html',
                            img: 'experts/images/petrovs.jpg',
                            role_bg: 'Експерт Международна сигурност',
                            role_en: 'Expert on International Security',
                            tags: ['SEC', 'IR'] },
    'naama':              { bg: 'experts/naama.html',            en: 'experts/naama-en.html',
                            img: 'experts/images/Naama-Karim.jpg',
                            role_bg: 'Експерт Близък изток',
                            role_en: 'Expert on Middle East & International Relations',
                            tags: ['IR', 'ME'] },
    'rovinalti':          { bg: 'experts/rovinalti.html',        en: 'experts/arovinalti-english.html',
                            img: 'experts/images/Rovinalti-Luca.jpg',
                            role_bg: 'Политически консултант; Европейски въпроси',
                            role_en: 'Political Consultant; Expert on EU Affairs',
                            tags: ['EU', 'COMMS'] },
    'vaculik':            { bg: 'experts/vaculik.html',          en: 'experts/dvaculik-english.html',
                            img: 'experts/images/Vaculik.png',
                            role_bg: 'Експерт Чешка политика',
                            role_en: 'Expert on Czech Politics',
                            tags: ['CZ'] },
    'biip':               { bg: 'eksperti.html',                 en: 'experts-english.html',
                            img: null, role_bg: null, role_en: null, tags: [] },
    'sonet-schutte':      { bg: null, en: null,
                            img: 'experts/images/Schutte.png',
                            role_bg: 'Асоцииран експерт',
                            role_en: 'Associate Expert',
                            tags: ['COMMS'] },
    'pavel-stefanov':     { bg: null, en: null,
                            img: 'experts/images/stefanov.jpg',
                            role_bg: 'Асоцииран експерт',
                            role_en: 'Associate Expert',
                            tags: ['AIR'] },
  };
  // Canonical author names for matching
  var AUTHOR_ALIASES = {
    'keranov':            ['д-р димитър керанов', 'dr. dimitar keranov',
                           'dimitar keranov', 'димитър керанов', 'dr. dimitar keranov, mrssaf'],
    'konstantin-keranov': ['константин керанов', 'konstantin keranov'],
    'uzunov':             ['д-р александър узунов', 'dr. alexander uzunov',
                           'александър узунов', 'alexander uzunov'],
    'smilkov':            ['доц. д-р калоян смилков', 'assoc. prof. dr. kaloyan smilkov',
                           'калоян смилков', 'kaloyan smilkov'],
    'petrov':             ['сергей петров', 'sergey petrov', 'aradjioni', 'aradzhioni'],
    'naama':              ['карим фахир наама', 'karim fahir naama', 'prof. karim fahir naama'],
    'rovinalti':          ['лука ровиналти', 'luca rovinalti'],
    'vaculik':            ['давид вацулик', 'david vaculík', 'david vaculik'],
    'manuel-muller':      ['мануел мюлер', 'manuel müller', 'manuel muller'],
    'vladimir-mitev':     ['владимир митев', 'vladimir mitev'],
    'biip':               ['bulgarian institute for international politics', 'biip', 'бимп'],
    'sonet-schutte':      ['sonet schutte', 'сонет шут'],
    'pavel-stefanov':     ['павел стефанов', 'pavel stefanov'],
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
  function getPrefix() {
    var depth = window.location.pathname.split('/').length - 2;
    var prefix = '';
    for (var i = 0; i < depth; i++) prefix += '../';
    return prefix;
  }

  function isNew(dateStr) {
    if (!dateStr) return false;
    return (Date.now() - new Date(dateStr).getTime()) < 30 * 24 * 60 * 60 * 1000;
  }

  function currentFile() {
    var parts = window.location.pathname.split('/');
    return parts[parts.length - 1] || 'index.html';
  }

  function getLang() {
    return document.documentElement.lang || 'bg';
  }

  function imgSrc(img) {
    if (!img) return '';
    // img is stored as "article images/xxx.png" (relative to articles/ folder)
    // Related articles render on article pages which are in articles/ folder
    // So path is correct as-is, just encode spaces
    return img.replace(/ /g, '%20');
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
      // Strip honorific prefixes so "Dr. Dimitar Keranov" -> "Keranov, D." not "Keranov, D. D."
      var stripped = name.trim().replace(/^(Dr\.?|Prof\.?|Assoc\.?|д-р|Д-р|проф\.?|доц\.?)\s+/i, '');
      var parts = stripped.split(' ');
      if (parts.length < 2) return stripped;
      var last = parts[parts.length - 1];
      var initials = parts.slice(0, -1).map(function(p){ return p[0] ? p[0] + '.' : ''; }).join(' ');
      return last + ', ' + initials;
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
          // Clipboard API unavailable — prompt user to copy manually
          self.textContent = lang === 'en' ? 'Select & copy above' : 'Маркирайте и копирайте';
          setTimeout(function(){ self.textContent = copyLbl; }, 3000);
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

    var existing = article.querySelector('.related-articles');
    if (existing) existing.remove();

    if (!related.length) return;

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
      return a.author.split(';').some(function(name) {
        return normalizeAuthorId(name.trim()) === authorId;
      });
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
          '<img src="../articles/' + a.img.replace(/ /g, '%20') + '" alt="" class="article-thumb" ' +
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

  /* ── INIT ────────────────────────────────────────────────────── */

  /* ── Share Buttons ───────────────────────────────────────────── */
  function initShareButtons() {
    var article = document.querySelector('article');
    if (!article) return;

    var lang  = getLang();
    var url   = encodeURIComponent(window.location.href);
    var titleEl = document.querySelector('title');
    var title = encodeURIComponent(
      titleEl ? titleEl.textContent.replace(/\s*\|\s*(БИМП|BIIP).*/i, '').trim() : ''
    );

    var label = lang === 'en' ? 'Share:' : 'Сподели:';

    var html =
      '<div class="share-bar">' +
        '<span class="share-label">' + label + '</span>' +
        '<a href="https://www.linkedin.com/sharing/share-offsite/?url=' + url + '" ' +
           'target="_blank" rel="noopener noreferrer" class="share-btn share-linkedin" ' +
           'aria-label="Share on LinkedIn">LinkedIn</a>' +
        '<a href="https://twitter.com/intent/tweet?url=' + url + '&text=' + title + '" ' +
           'target="_blank" rel="noopener noreferrer" class="share-btn share-twitter" ' +
           'aria-label="Share on X / Twitter">𝕏</a>' +
        '<a href="https://www.facebook.com/sharer/sharer.php?u=' + url + '" ' +
           'target="_blank" rel="noopener noreferrer" class="share-btn share-facebook" ' +
           'aria-label="Share on Facebook">Facebook</a>' +
        '<a href="https://t.me/share/url?url=' + url + '&text=' + title + '" ' +
           'target="_blank" rel="noopener noreferrer" class="share-btn share-telegram" ' +
           'aria-label="Share on Telegram">Telegram</a>' +
        '<a href="https://api.whatsapp.com/send?text=' + title + '%20' + url + '" ' +
           'target="_blank" rel="noopener noreferrer" class="share-btn share-whatsapp" ' +
           'aria-label="Share on WhatsApp">WhatsApp</a>' +
        '<a href="mailto:?subject=' + title + '&body=' + title + '%0A%0A' + url + '" ' +
           'class="share-btn share-email" ' +
           'aria-label="' + (lang === 'en' ? 'Share via email' : 'Сподели по имейл') + '">' +
           (lang === 'en' ? 'Email' : 'Имейл') + '</a>' +
      '</div>';

    // Insert before the back-link or at end of article
    var backLink = document.querySelector('.back-link');
    if (backLink) {
      backLink.insertAdjacentHTML('beforebegin', html);
    } else {
      article.insertAdjacentHTML('afterend', html);
    }
  }




  /* ── FEATURE: Section Page Article Feed ─────────────────────── */
  function initSectionFeed() {
    var feed = document.getElementById('section-article-feed');
    if (!feed || !ARTICLES) return;

    var lang     = getLang();
    var tags     = (feed.getAttribute('data-tags') || '').split(',').map(function(t){ return t.trim(); }).filter(Boolean);
    var allLangs = feed.getAttribute('data-all-langs') === 'true';

    // Filter articles
    var filtered = ARTICLES.filter(function(a) {
      var langOk = allLangs ? true : a.lang === lang;
      var tagOk  = tags.length === 0 || (a.tags || []).some(function(t){ return tags.indexOf(t) !== -1; });
      return langOk && tagOk;
    });

    // Sort newest first
    filtered.sort(function(a, b){ return (b.date || '').localeCompare(a.date || ''); });

    // Update count badge
    var countEl = document.getElementById('section-article-count');
    if (countEl) {
      var total = ARTICLES.filter(function(a){
        return (a.tags||[]).some(function(t){ return tags.indexOf(t) !== -1; });
      }).length;
      countEl.textContent = total + (lang === 'en' ? ' article' + (total !== 1 ? 's' : '') : ' статии');
    }

    if (!filtered.length) {
      feed.innerHTML = '<p style="color:#888; padding:1em 0;">' +
        (lang === 'en' ? 'No articles yet in this section.' : 'Все още няма статии в този раздел.') + '</p>';
      return;
    }

    // Language filter buttons
    var bgCount = ARTICLES.filter(function(a){
      return a.lang === 'bg' && (a.tags||[]).some(function(t){ return tags.indexOf(t) !== -1; });
    }).length;
    var enCount = ARTICLES.filter(function(a){
      return a.lang === 'en' && (a.tags||[]).some(function(t){ return tags.indexOf(t) !== -1; });
    }).length;

    var filterHtml = '';
    if (bgCount > 0 && enCount > 0) {
      filterHtml =
        '<div class="section-filter" style="display:flex;gap:0.5em;margin-bottom:1.2em;flex-wrap:wrap;">' +
          '<button type="button" class="sf-btn sf-active" data-lang="all">' +
            (lang === 'en' ? 'All' : 'Всички') + ' (' + filtered.length + ')' +
          '</button>' +
          '<button type="button" class="sf-btn" data-lang="bg">БГ (' + bgCount + ')</button>' +
          '<button type="button" class="sf-btn" data-lang="en">EN (' + enCount + ')</button>' +
        '</div>';
    }

    function renderCards(articles) {
      return articles.map(function(a) {
        var fname   = a.file.split('/').pop();
        var href    = 'articles/' + fname;
        var imgSrc  = ('articles/' + a.img).replace(/ /g, '%20');
        var dateStr = a.date ? a.date.split('-').reverse().join('.') : '';
        var rt      = a.readTime ? ' · ' + a.readTime + (lang === 'en' ? ' min' : ' мин') : '';
        var langBadge = a.lang === 'en'
          ? '<span class="sc-lang-badge sc-en">EN</span>'
          : '<span class="sc-lang-badge sc-bg">БГ</span>';
        var newBadge = isNew(a.date)
          ? '<span class="badge-new">' + (lang === 'en' ? 'New' : 'Ново') + '</span>'
          : '';
        return '<a href="' + href + '" class="sc-card">' +
          '<img src="' + imgSrc + '" alt="" class="sc-img" loading="lazy" width="120" height="80">' +
          '<div class="sc-body">' +
            '<div class="sc-meta">' + langBadge + newBadge + dateStr + rt + (a.author ? ' · ' + a.author : '') + '</div>' +
            '<h3 class="sc-title">' + a.title + '</h3>' +
            '<p class="sc-teaser">' + (a.teaser || '') + '</p>' +
          '</div>' +
        '</a>';
      }).join('');
    }

    feed.innerHTML = filterHtml + '<div id="sc-cards">' + renderCards(filtered) + '</div>';

    // Filter button logic
    feed.querySelectorAll('.sf-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        feed.querySelectorAll('.sf-btn').forEach(function(b){ b.classList.remove('sf-active'); });
        btn.classList.add('sf-active');
        var chosen = btn.getAttribute('data-lang');
        var subset = chosen === 'all' ? filtered : filtered.filter(function(a){ return a.lang === chosen; });
        document.getElementById('sc-cards').innerHTML = renderCards(subset);
      });
    });
  }

  /* ── FEATURE: Reading Progress Bar ──────────────────────────── */
  function initReadingProgress() {
    if (!document.querySelector('article')) return;
    var bar = document.createElement('div');
    bar.id = 'reading-progress';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Reading progress');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    document.body.insertBefore(bar, document.body.firstChild);

    function update() {
      var article = document.querySelector('article');
      var rect = article.getBoundingClientRect();
      var total = article.offsetHeight - window.innerHeight;
      var scrolled = Math.max(0, -rect.top);
      var pct = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0;
      bar.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', Math.round(pct));
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ── FEATURE: Back to Top Button ─────────────────────────────── */
  function initBackToTop() {
    var lang = getLang();
    var label = lang === 'en' ? 'Back to top' : 'Към началото';
    var btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.innerHTML = '&#8679;';
    document.body.appendChild(btn);

    window.addEventListener('scroll', function() {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── FEATURE: Weather Widget (Varna, no cookies/tracking) ─────── */
  function initWeatherWidget() {
    var placeholder = document.getElementById('varna-weather');
    if (!placeholder) return;
    var lang = getLang();

    var codes = {
      0:  { en: 'Clear sky',        bg: 'Ясно небе',          icon: '☀️' },
      1:  { en: 'Mainly clear',     bg: 'Предимно ясно',      icon: '🌤️' },
      2:  { en: 'Partly cloudy',    bg: 'Частично облачно',   icon: '⛅' },
      3:  { en: 'Overcast',         bg: 'Облачно',            icon: '☁️' },
      45: { en: 'Foggy',            bg: 'Мъгливо',            icon: '🌫️' },
      48: { en: 'Foggy',            bg: 'Мъгливо',            icon: '🌫️' },
      51: { en: 'Light drizzle',    bg: 'Слаб ръмеж',         icon: '🌦️' },
      53: { en: 'Drizzle',          bg: 'Ръмеж',              icon: '🌦️' },
      55: { en: 'Heavy drizzle',    bg: 'Силен ръмеж',        icon: '🌦️' },
      61: { en: 'Light rain',       bg: 'Слаб дъжд',          icon: '🌧️' },
      63: { en: 'Rain',             bg: 'Дъжд',               icon: '🌧️' },
      65: { en: 'Heavy rain',       bg: 'Силен дъжд',         icon: '🌧️' },
      71: { en: 'Light snow',       bg: 'Слаб сняг',          icon: '🌨️' },
      73: { en: 'Snow',             bg: 'Сняг',               icon: '❄️' },
      75: { en: 'Heavy snow',       bg: 'Силен сняг',         icon: '❄️' },
      80: { en: 'Rain showers',     bg: 'Валежи',             icon: '🌦️' },
      81: { en: 'Rain showers',     bg: 'Валежи',             icon: '🌦️' },
      82: { en: 'Heavy showers',    bg: 'Силни валежи',       icon: '⛈️' },
      95: { en: 'Thunderstorm',     bg: 'Гръмотевична буря',  icon: '⛈️' },
      96: { en: 'Thunderstorm',     bg: 'Гръмотевична буря',  icon: '⛈️' },
      99: { en: 'Thunderstorm',     bg: 'Гръмотевична буря',  icon: '⛈️' }
    };

    fetch('https://api.open-meteo.com/v1/forecast?latitude=43.2167&longitude=27.9167&current=temperature_2m,weathercode&wind_speed_unit=ms&timezone=Europe%2FSofia')
      .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(data) {
        var temp = Math.round(data.current.temperature_2m);
        var code = data.current.weathercode;
        var info = codes[code] || { en: '', bg: '', icon: '🌡️' };
        var desc = lang === 'en' ? info.en : info.bg;
        var locLabel = lang === 'en' ? 'Varna, now' : 'Варна, в момента';
        var sourceLabel = lang === 'en'
          ? 'Weather data: Open-Meteo (no tracking, no cookies)'
          : 'Данни за времето: Open-Meteo (без проследяване, без бисквитки)';

        placeholder.innerHTML =
          '<div class="weather-widget">' +
            '<span class="weather-icon">' + info.icon + '</span>' +
            '<div class="weather-info">' +
              '<div class="weather-temp">' + temp + '°C</div>' +
              '<div class="weather-desc">' + desc + '</div>' +
            '</div>' +
            '<span class="weather-location">📍 ' + locLabel + '</span>' +
            '<span class="weather-source">' + sourceLabel + '</span>' +
          '</div>';
      })
      .catch(function() {
        placeholder.innerHTML = ''; // silent fail — no broken UI
      });
  }

  /* ── FEATURE: Regions Latest Feed ───────────────────────────── */
  function initRegionsLatestFeed() {
    var feed = document.getElementById('regions-latest-feed');
    if (!feed || !ARTICLES) return;
    var lang = getLang();

    // Sort all articles by date descending, show latest 6
    var sorted = ARTICLES.slice().sort(function(a, b) {
      return (b.date || '').localeCompare(a.date || '');
    }).slice(0, 6);

    if (!sorted.length) { feed.innerHTML = ''; return; }

    var html = '';
    sorted.forEach(function(a) {
      var fname = a.file.split('/').pop();
      var href = 'articles/' + fname;
      var imgPath = 'articles/' + a.img.replace(/ /g, '%20');
      var langLabel = a.lang === 'en'
        ? '<span class="lang-badge lang-en">EN</span>'
        : '<span class="lang-badge lang-bg">БГ</span>';
      var dateStr = a.date ? a.date.split('-').reverse().join('.') : '';
      var rtLabel = a.readTime ? ' · ' + a.readTime + (lang === 'en' ? ' min read' : ' мин') : '';
      var newBadge = isNew(a.date)
        ? '<span class="badge-new">' + (lang === 'en' ? 'New' : 'Ново') + '</span>'
        : '';
      html +=
        '<a href="' + href + '" class="latest-item">' +
          '<img src="' + imgPath + '" alt="" class="latest-thumb" width="52" height="52" loading="lazy">' +
          '<div class="latest-info">' +
            '<div class="latest-title">' + a.title + '</div>' +
            '<div class="latest-meta">' + langLabel + newBadge + dateStr + (a.author ? ' · ' + a.author : '') + rtLabel + '</div>' +
          '</div>' +
        '</a>';
    });
    feed.innerHTML = html;
  }

  function initPrintButtons() {
    document.addEventListener('click', function(e) {
      if (e.target && e.target.classList.contains('print-kachel__btn')) {
        window.print();
      }
    });
  }

  /* ── FEATURE: Expert Tag Pills ──────────────────────────────── */
  function initExpertTags() {
    var container = document.getElementById('author-articles');
    if (!container) return;
    var authorId = container.getAttribute('data-author-id');
    if (!authorId) return;
    var expert = AUTHOR_PAGE[authorId];
    if (!expert) return;
    var lang  = getLang();
    var codes = expert.tags || [];
    if (!codes.length) return;

    var html = '<div class="expert-tag-row">' +
      codes.map(function(code) {
        var entry = EXPERT_TAG_LABEL[code];
        var label = entry ? (entry[lang] || entry.en) : code;
        return '<span class="expert-tag">' + label + '</span>';
      }).join('') +
      '</div>';

    // Insert after the first <h2> inside <main>
    var h2 = document.querySelector('main h2');
    if (h2) h2.insertAdjacentHTML('afterend', html);
  }

  /* ── FEATURE: Home page "View all articles" button ──────────── */
  function initViewAllButton() {
    var btn = document.getElementById('home-view-btn');
    if (!btn) return;
    var lang = getLang();
    btn.addEventListener('click', function() {
      window.location.href = lang === 'en' ? 'regions-en.html' : 'regions.html';
    });
  }

  /* ── FEATURE: Home page "Surprise me" button ────────────────── */
  function initSurpriseButton() {
    var btn = document.getElementById('home-surprise-btn');
    if (!btn) return;
    btn.addEventListener('click', function() {
      var lang = getLang();
      var articles = ARTICLES;
      var pool = articles
        ? articles.filter(function(a) { return a.lang === lang; })
        : [];
      if (!pool.length && articles) pool = articles;

      if (!pool.length) {
        // Fallback if articles.json never loaded
        window.location.href = lang === 'en' ? 'regions-en.html' : 'regions.html';
        return;
      }
      var pick  = pool[Math.floor(Math.random() * pool.length)];
      window.location.href = getPrefix() + pick.file;
    });
  }

  /* ── FEATURE: Home page latest articles feed ─────────────────── */
  function initHomeLatestFeed() {
    var feed = document.getElementById('home-latest-feed');
    if (!feed || !ARTICLES) return;
    var lang  = getLang();
    var count = parseInt(feed.getAttribute('data-count') || '4', 10);
    var pool  = ARTICLES.filter(function(a) { return a.lang === lang; });
    pool.sort(function(a, b) { return b.date > a.date ? 1 : b.date < a.date ? -1 : 0; });
    var items = pool.slice(0, count);
    if (!items.length) return;

    var prefix = getPrefix();
    var byTxt = lang === 'en' ? 'by' : 'от';

    feed.innerHTML = items.map(function(a) {
      var imgSrc = a.img ? prefix + 'articles/' + a.img : '';
      var imgHtml = imgSrc
        ? '<img src="' + imgSrc + '" alt="' + a.title + '" class="article-thumb" loading="lazy" width="44" height="44">'
        : '';
      return '<a href="' + prefix + a.file + '" class="article-preview">' +
        imgHtml +
        '<div class="article-info">' +
          '<h4>' + a.title + '</h4>' +
          '<p class="article-meta">' + byTxt + ' ' + a.author + '</p>' +
          '<p class="article-teaser">' + (a.desc || '') + '</p>' +
        '</div>' +
        '</a>';
    }).join('');
  }

  /* ── FEATURE: Random Article Button ─────────────────────────── */
  function initRandomArticleButton() {
    var latestFeed = document.getElementById('regions-latest-feed');
    if (!latestFeed || !ARTICLES) return;
    var lang = getLang();
    var pool = ARTICLES.filter(function(a) { return a.lang === lang; });
    if (!pool.length) pool = ARTICLES;

    var label  = lang === 'en' ? 'Read something different' : 'Прочетете нещо различно';
    var btnTxt = lang === 'en' ? '&#127922; Surprise me' : '&#127922; Изненадайте ме';

    var wrap = document.createElement('div');
    wrap.className = 'random-article-wrap';
    wrap.innerHTML =
      '<p class="random-label">' + label + '</p>' +
      '<button type="button" class="random-btn" id="random-article-btn">' + btnTxt + '</button>';
    latestFeed.parentNode.appendChild(wrap);

    document.getElementById('random-article-btn').addEventListener('click', function() {
      var pick = pool[Math.floor(Math.random() * pool.length)];
      window.location.href = getPrefix() + pick.file;
    });
  }

  /* ── FEATURE: Author Expert Card ────────────────────────────── */
  function initAuthorCard() {
    var article = document.querySelector('article');
    if (!article || !ARTICLES) return;
    var lang    = getLang();
    var file    = window.location.pathname.split('/').pop();
    var current = ARTICLES.find(function(a) { return a.file.split('/').pop() === file; });
    if (!current || !current.author) return;

    var prefix = getPrefix();

    var viewLabel = lang === 'en' ? 'View full profile →' : 'Виж пълния профил →';

    // Build a card for every author who has profile data
    var authorNames = current.author.split(';').map(function(s) { return s.trim(); });
    var cards = [];
    authorNames.forEach(function(authorName) {
      var authorId = normalizeAuthorId(authorName);
      if (!authorId) return;
      var expert = AUTHOR_PAGE[authorId];
      if (!expert || !expert.img) return;
      var profileHref = expert[lang] || expert.bg || expert.en;
      var role        = expert['role_' + lang] || expert.role_en || expert.role_bg || '';
      var profileLink = profileHref
        ? '<a href="' + prefix + profileHref + '" class="author-card-link">' + viewLabel + '</a>'
        : '';
      cards.push(
        '<div class="author-card">' +
          '<img src="' + prefix + expert.img + '" alt="' + authorName + '" ' +
               'class="author-card-img" width="64" height="64" loading="lazy">' +
          '<div class="author-card-info">' +
            '<div class="author-card-name">' + authorName + '</div>' +
            (role ? '<div class="author-card-role">' + role + '</div>' : '') +
            profileLink +
          '</div>' +
        '</div>'
      );
    });

    if (!cards.length) return;

    var byLabel = cards.length > 1
      ? (lang === 'en' ? 'About the authors' : 'За авторите')
      : (lang === 'en' ? 'About the author'  : 'За автора');

    var html =
      '<div class="author-cards-wrap">' +
        '<div class="author-cards-label">' + byLabel + '</div>' +
        cards.join('') +
      '</div>';

    // Insert before share bar (which was inserted by initShareButtons)
    var shareBar = document.querySelector('.share-bar');
    if (shareBar) {
      shareBar.insertAdjacentHTML('beforebegin', html);
    } else {
      var backLink = document.querySelector('.back-link');
      if (backLink) {
        backLink.insertAdjacentHTML('beforebegin', html);
      } else {
        article.insertAdjacentHTML('afterend', html);
      }
    }
  }

  function runAll() {
    try { initReadingTime(); }    catch(e) { console.warn('readingTime:', e); }
    try { initLangSwitcher(); }   catch(e) { console.warn('langSwitcher:', e); }
    try { initCiteButton(); }     catch(e) { console.warn('citeButton:', e); }
    try { initRelatedArticles(); }catch(e) { console.warn('relatedArticles:', e); }
    try { initShareButtons(); }   catch(e) { console.warn('shareButtons:', e); }
    try { initAuthorCard(); }     catch(e) { console.warn('authorCard:', e); }
    try { initExpertTags(); }     catch(e) { console.warn('expertTags:', e); }
    try { initAuthorArticles(); } catch(e) { console.warn('authorArticles:', e); }
    try { initRegionsLatestFeed(); } catch(e) { console.warn('regionsLatestFeed:', e); }
    try { initRandomArticleButton(); } catch(e) { console.warn('randomArticle:', e); }
    try { initHomeLatestFeed(); }     catch(e) { console.warn('homeLatestFeed:', e); }
    try { initSectionFeed(); }      catch(e) { console.warn('sectionFeed:', e); }
    try { initReadingProgress(); }  catch(e) { console.warn('readingProgress:', e); }
    try { initBackToTop(); }        catch(e) { console.warn('backToTop:', e); }
    try { initPrintButtons(); }     catch(e) { console.warn('printButtons:', e); }
  }

  function init() {
    // Register these immediately — no articles.json dependency
    try { initViewAllButton(); }  catch(e) {}
    try { initSurpriseButton(); } catch(e) {}
    // Load articles.json first, then run all features
    fetch(getPrefix() + 'articles.json')
      .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(data) {
        ARTICLES = data;
        runAll();
        try { initWeatherWidget(); } catch(e) { console.warn('weather:', e); }
      })
      .catch(function(e) {
        console.warn('biip: could not load articles.json, running without article data', e);
        runAll(); // still run lang switcher, cite button etc.
        try { initWeatherWidget(); } catch(e) { console.warn('weather:', e); }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
