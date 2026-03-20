/* ================================================================
   biip.js — BIIP site enhancements
   Features: reading-time, language-switcher, search index, 
             topic tags / related articles, cite button
   Safe: each feature is isolated in its own init function.
         If one fails it does not affect the others.
   ================================================================ */

(function () {
  'use strict';

  /* ── FEATURE 1: Reading Time ─────────────────────────────────── */
  function initReadingTime() {
    var article = document.querySelector('article');
    if (!article) return;

    // Count words in article text only
    var text = article.innerText || article.textContent || '';
    var words = text.trim().split(/\s+/).filter(function(w){ return w.length > 0; }).length;
    var mins  = Math.max(1, Math.round(words / 200));

    // Determine label language
    var lang  = document.documentElement.lang || 'bg';
    var label = (lang === 'en')
      ? mins + ' min read'
      : 'Четенето отнема около ' + mins + (mins === 1 ? ' минута' : ' минути');

    // Inject after the publication date paragraph (color:#888 style)
    var datePara = article.querySelector('p[style*="color:#888"]');
    if (!datePara) {
      // fallback: first <p> in article
      datePara = article.querySelector('p');
    }
    if (!datePara) return;

    var span = document.createElement('span');
    span.className = 'reading-time';
    span.textContent = ' · ⏱ ' + label;
    span.setAttribute('aria-label', label);
    datePara.appendChild(span);
  }

  /* ── FEATURE 2: Language Switcher Fix ───────────────────────── */
  // Maps each page to its counterpart in the other language
  var LANG_MAP = {
    // Root pages
    'index.html':          'index-en.html',
    'index-en.html':       'index.html',
    'about.html':          'about-en.html',
    'about-en.html':       'about.html',
    'regions.html':        'regions-en.html',
    'regions-en.html':     'regions.html',
    'contact.html':        'contact-en.html',
    'contact-en.html':     'contact.html',
    'submit.html':         'submit-en.html',
    'submit-en.html':      'submit.html',
    'eksperti.html':       'experts-english.html',
    'experts-english.html':'eksperti.html',
    'africa-en.html':      'afrika.html',
    'afrika.html':         'africa-en.html',
    'cee-en.html':         'tsentralna-iztochna-evropa.html',
    'tsentralna-iztochna-evropa.html': 'cee-en.html',
    'bulgaria-soviet-en.html': 'index.html',
    // Articles (BG ↔ EN pairs)
    'bg-md.html':                    'bg-md-friendship-english.html',
    'bg-md-friendship-english.html': 'bg-md.html',
    'bg-ro-vm.html':                 'bul-ro-en.html',
    'bul-ro-en.html':                'bg-ro-vm.html',
    'moskva-moldova.html':           'moscow-md.html',
    'moscow-md.html':                'moskva-moldova.html',
    'digitalna-ikonomika.html':      'digital-economy-english.html',
    'digital-economy-english.html':  'digitalna-ikonomika.html',
    'evroro-v-bg-dobra-ideya.html':  'the-euro-in-bulgaria-is-a-good-idea.html',
    'the-euro-in-bulgaria-is-a-good-idea.html': 'evroro-v-bg-dobra-ideya.html',
    'kogato-romania-te-zabrani.html':'when-romania-bans-you.html',
    'when-romania-bans-you.html':    'kogato-romania-te-zabrani.html',
    'tryabva-okonchatelno-da-se-razdelim-sas-savetskoto-vaorazhenie.html':
                                     'bulgaria-must-leave-soviet-armament-behind.html',
    'bulgaria-must-leave-soviet-armament-behind.html':
                                     'tryabva-okonchatelno-da-se-razdelim-sas-savetskoto-vaorazhenie.html',
    'pretoria-bg.html':              'pretoria-diplomatic-withdrawal.html',
    'pretoria-diplomatic-withdrawal.html': 'pretoria-bg.html',
    // Experts
    'keranov.html':          'keranov-en.html',
    'keranov-en.html':       'keranov.html',
    'naama.html':            'naama-en.html',
    'naama-en.html':         'naama.html',
  };

  function initLangSwitcher() {
    // Get current filename
    var path  = window.location.pathname;
    var parts = path.split('/');
    var file  = parts[parts.length - 1] || 'index.html';
    if (!file) return;

    var counterpart = LANG_MAP[file];
    if (!counterpart) return;

    // Find the BG / EN link in the nav
    var navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(function(a) {
      var txt = a.textContent.trim();
      if (txt === 'BG' || txt === 'EN') {
        // Build correct relative URL preserving the directory depth
        var href = a.getAttribute('href') || '';
        // Replace just the filename part
        var newHref = href.replace(/[^/]+\.html$/, counterpart);
        a.setAttribute('href', newHref);
      }
    });
  }

  /* ── FEATURE 3: Cite This Article ───────────────────────────── */
  function initCiteButton() {
    var article = document.querySelector('article');
    if (!article) return;

    // Gather metadata
    var lang    = document.documentElement.lang || 'bg';
    var title   = document.querySelector('title');
    var titleTx = title ? title.textContent.replace(/\s*\|\s*БИМП.*|BIIP.*/i, '').trim() : document.title;
    var authorM = document.querySelector('meta[name="author"]');
    var author  = authorM ? authorM.getAttribute('content') : '';
    var pubM    = document.querySelector('meta[property="article:published_time"]');
    var pubDate = pubM ? pubM.getAttribute('content') : '';
    var url     = window.location.href.replace(window.location.hash, '');
    var year    = pubDate ? pubDate.substring(0, 4) : new Date().getFullYear();
    var dateStr = pubDate
      ? new Date(pubDate).toLocaleDateString(lang === 'en' ? 'en-GB' : 'bg-BG', {year:'numeric',month:'long',day:'numeric'})
      : '';

    // Format citations
    var chicago = (author ? author.split(';')[0].trim() + '. ' : '') +
      '"' + titleTx + '." ' +
      'Bulgarian Institute for International Politics (BIIP), ' +
      (dateStr ? dateStr + '. ' : '') +
      url + '.';

    var apa = (author ? formatAPA(author.split(';')[0].trim()) + ' ' : '') +
      '(' + year + '). ' +
      titleTx + '. ' +
      'Bulgarian Institute for International Politics. ' +
      url;

    function formatAPA(name) {
      // "First Last" → "Last, F."
      var parts = name.trim().split(' ');
      if (parts.length < 2) return name;
      var last  = parts[parts.length - 1];
      var first = parts.slice(0, -1).map(function(p){ return p[0] + '.'; }).join(' ');
      return last + ', ' + first;
    }

    // Build the button and modal
    var btnLabel = lang === 'en' ? '📋 Cite this article' : '📋 Цитирайте тази статия';
    var modalHtml =
      '<div id="cite-modal" role="dialog" aria-modal="true" aria-label="' + btnLabel + '" style="' +
        'display:none;position:fixed;top:0;left:0;width:100%;height:100%;' +
        'background:rgba(0,0,0,0.55);z-index:10000;align-items:center;justify-content:center;">' +
        '<div style="background:#fff;max-width:600px;width:90%;border-radius:10px;padding:1.5em;' +
          'box-shadow:0 8px 32px rgba(0,0,0,0.18);position:relative;">' +
          '<button type="button" id="cite-close" aria-label="Close" style="' +
            'position:absolute;top:10px;right:14px;background:none;border:none;' +
            'font-size:1.4em;cursor:pointer;color:#555;">✕</button>' +
          '<h3 style="margin:0 0 1em 0;">' + btnLabel + '</h3>' +
          '<label style="font-weight:bold;font-size:.9em;">Chicago / BIIP house style</label>' +
          '<div class="cite-box" id="cite-chicago">' + chicago + '</div>' +
          '<button type="button" class="cite-copy-btn" data-target="cite-chicago">' +
            (lang === 'en' ? 'Copy' : 'Копирай') + '</button>' +
          '<label style="font-weight:bold;font-size:.9em;margin-top:1em;display:block;">APA 7</label>' +
          '<div class="cite-box" id="cite-apa">' + apa + '</div>' +
          '<button type="button" class="cite-copy-btn" data-target="cite-apa">' +
            (lang === 'en' ? 'Copy' : 'Копирай') + '</button>' +
        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Inject cite button after the article heading
    var afterHeading = article.querySelector('h2');
    if (!afterHeading) afterHeading = article.querySelector('h1');
    if (!afterHeading) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cite-trigger-btn';
    btn.textContent = btnLabel;
    afterHeading.insertAdjacentElement('afterend', btn);

    // Wire events
    btn.addEventListener('click', function() {
      var modal = document.getElementById('cite-modal');
      modal.style.display = 'flex';
      document.getElementById('cite-close').focus();
    });

    document.getElementById('cite-close').addEventListener('click', closeModal);
    document.getElementById('cite-modal').addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });

    function closeModal() {
      document.getElementById('cite-modal').style.display = 'none';
      btn.focus();
    }

    // Copy buttons
    document.querySelectorAll('.cite-copy-btn').forEach(function(copyBtn) {
      copyBtn.addEventListener('click', function() {
        var target = document.getElementById(this.getAttribute('data-target'));
        var text = target.textContent;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function() {
            copyBtn.textContent = lang === 'en' ? '✓ Copied!' : '✓ Копирано!';
            setTimeout(function(){ copyBtn.textContent = lang === 'en' ? 'Copy' : 'Копирай'; }, 2000);
          });
        } else {
          // Fallback
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          copyBtn.textContent = lang === 'en' ? '✓ Copied!' : '✓ Копирано!';
          setTimeout(function(){ copyBtn.textContent = lang === 'en' ? 'Copy' : 'Копирай'; }, 2000);
        }
      });
    });
  }

  /* ── FEATURE 4: Related Articles by Topic ───────────────────── */
  // Topic taxonomy — each article tagged manually
  var ARTICLE_DATA = [
    {file:'chn.html',           lang:'bg', tags:['balkans','china','russia','disinformation'],
     title:'Пекин и Москва в Западните Балкани',
     img:'article images/chn.png'},
    {file:'syntheticbg.html',   lang:'bg', tags:['disinformation','ai','bulgaria'],
     title:'Синтетичното съдържание и институционалното доверие',
     img:'article images/synthetic.png'},
    {file:'bgsecurity.html',    lang:'en', tags:['bulgaria','security','nato'],
     title:'Bulgaria and Security at the Edge of Europe',
     img:'article images/bgrsecurity.png'},
    {file:'bruxbg.html',        lang:'en', tags:['bulgaria','eu','governance'],
     title:'Brussels to Sofia: EU Policy in Bulgaria',
     img:'article images/bruxbg.png'},
    {file:'bg-ro-vm.html',      lang:'bg', tags:['bulgaria','romania','moldova','eu'],
     title:'България и Румъния трябва да разширяват сътрудничеството си',
     img:'article images/bg-ro-vm.png'},
    {file:'bul-ro-en.html',     lang:'en', tags:['bulgaria','romania','moldova','eu'],
     title:'Bulgaria and Romania Must Expand Cooperation',
     img:'article images/bg-ro-vm.png'},
    {file:'moskva-moldova.html',lang:'bg', tags:['moldova','russia','security'],
     title:'Терорът на Москва над Молдова',
     img:'article images/pm.png'},
    {file:'moscow-md.html',     lang:'en', tags:['moldova','russia','security'],
     title:"Moscow's Terror over Moldova",
     img:'article images/pm.png'},
    {file:'bg-md.html',         lang:'bg', tags:['bulgaria','moldova','eu'],
     title:'България и Молдова – приятелство и общи предизвикателства',
     img:'article images/bg-md.png'},
    {file:'bg-md-friendship-english.html', lang:'en', tags:['bulgaria','moldova','eu'],
     title:'Bulgaria and Moldova – Friendship and Shared Challenges',
     img:'article images/bg-md.png'},
    {file:'digitalna-ikonomika.html', lang:'bg', tags:['digitaleconomy','ai'],
     title:'Дигиталната икономика и предизвикателствата пред политиката',
     img:'article images/digitalna-ikonomika.png'},
    {file:'digital-economy-english.html', lang:'en', tags:['digitaleconomy','ai'],
     title:'The Digital Economy and the Challenges for Policy',
     img:'article images/digital2.png'},
    {file:'evroro-v-bg-dobra-ideya.html', lang:'bg', tags:['bulgaria','eu','economy'],
     title:'Еврото в България е добра идея',
     img:'article images/euro bg.png'},
    {file:'the-euro-in-bulgaria-is-a-good-idea.html', lang:'en', tags:['bulgaria','eu','economy'],
     title:'The Euro in Bulgaria Is a Good Idea',
     img:'article images/euro bg.png'},
    {file:'kogato-romania-te-zabrani.html', lang:'bg', tags:['bulgaria','romania'],
     title:'Когато Румъния те забрани',
     img:'article images/RO flag.png'},
    {file:'when-romania-bans-you.html', lang:'en', tags:['bulgaria','romania'],
     title:'When Romania Bans You',
     img:'article images/RO flag.png'},
    {file:'pretoria-bg.html',   lang:'bg', tags:['africa','southafrica','diplomacy'],
     title:'Дипломатическото отдръпване на Претория',
     img:'article images/SA-BG.png'},
    {file:'pretoria-diplomatic-withdrawal.html', lang:'en', tags:['africa','southafrica','diplomacy'],
     title:"Pretoria's Diplomatic Withdrawal",
     img:'article images/SA-BG.png'},
    {file:'yuar-orazhiya.html', lang:'bg', tags:['africa','southafrica','security'],
     title:'Атомните бомби на Южна Африка',
     img:'article images/yuzhna-afrika-orazhiya.png'},
    {file:'taraclia-vote-en.html', lang:'en', tags:['moldova','minorities','eu'],
     title:"Minority Politics in Moldova: Taraclia's Vote",
     img:'article images/Taraclia.png'},
    {file:'beijing-bgr.html',   lang:'bg', tags:['china','bulgaria','diplomacy'],
     title:'Сигнал от Пекин: какво каза България на света',
     img:'article images/beijing.png'},
    {file:'no-corruption-bg.html', lang:'bg', tags:['bulgaria','governance','corruption'],
     title:'В България няма корупция',
     img:'article images/pm.png'},
    {file:'ep-coalition-preview-summary.html', lang:'en', tags:['eu','europeanparliament'],
     title:'Could the "von der Leyen coalition" lose its majority?',
     img:'article images/eustars.png'},
    {file:'ep-feb26.html',      lang:'en', tags:['eu','europeanparliament'],
     title:'European Parliament Seat Projection – February 2026',
     img:'article images/eustars.png'},
    {file:'proektsia-ep-juli25.html', lang:'bg', tags:['eu','europeanparliament'],
     title:'Може ли „коалицията на фон дер Лайен" да загуби мнозинството си?',
     img:'article images/eustars.png'},
    {file:'tryabva-okonchatelno-da-se-razdelim-sas-savetskoto-vaorazhenie.html', lang:'bg',
     tags:['bulgaria','security','nato'],
     title:'Трябва окончателно да се разделим със съветското въоръжение',
     img:'article images/soviet armament bg.png'},
    {file:'bulgaria-must-leave-soviet-armament-behind.html', lang:'en',
     tags:['bulgaria','security','nato'],
     title:'Bulgaria Must Leave Soviet Armament Behind',
     img:'article images/soviet armament bg.png'},
    {file:'bulgarias-democratic-challenge.html', lang:'en',
     tags:['bulgaria','democracy','governance'],
     title:"Bulgaria's Democratic Challenge",
     img:'article images/Bulgaria Democratic Challenge Article.png'},
    {file:'when-bulgarian-democracy-falters.html', lang:'en',
     tags:['bulgaria','democracy','governance'],
     title:'When Bulgarian Democracy Falters',
     img:'article images/When Bulgarian Democracy Falters Article.png'},
  ];

  function initRelatedArticles() {
    var article = document.querySelector('article');
    if (!article) return;

    // Get current file name
    var path  = window.location.pathname;
    var parts = path.split('/');
    var file  = parts[parts.length - 1];
    if (!file) return;

    var lang = document.documentElement.lang || 'bg';

    // Find current article in data
    var current = null;
    for (var i = 0; i < ARTICLE_DATA.length; i++) {
      if (ARTICLE_DATA[i].file === file) { current = ARTICLE_DATA[i]; break; }
    }
    if (!current) return;

    // Find related: same language, shares at least one tag, not self
    var related = ARTICLE_DATA.filter(function(a) {
      if (a.file === file) return false;
      if (a.lang !== lang) return false;
      return a.tags.some(function(t) { return current.tags.indexOf(t) !== -1; });
    }).slice(0, 3);

    if (related.length === 0) return;

    // Remove any existing hardcoded related section
    var existing = article.querySelector('.related-articles');
    if (existing) existing.remove();

    var heading = lang === 'en' ? 'Related Articles' : 'Свързани статии';

    var html = '<section class="related-articles"><h2>' + heading + '</h2><div class="related-list">';
    related.forEach(function(a) {
      html +=
        '<a href="' + a.file + '" class="related-article">' +
          '<img src="' + a.img + '" alt="" class="related-thumb" width="44" height="44" loading="lazy">' +
          '<div class="related-info">' +
            '<div class="related-title">' + a.title + '</div>' +
          '</div>' +
        '</a>';
    });
    html += '</div></section>';

    article.insertAdjacentHTML('beforeend', html);
  }

  /* ── INIT ────────────────────────────────────────────────────── */
  function init() {
    try { initReadingTime(); }    catch(e) { console.warn('biip: readingTime failed', e); }
    try { initLangSwitcher(); }   catch(e) { console.warn('biip: langSwitcher failed', e); }
    try { initCiteButton(); }     catch(e) { console.warn('biip: citeButton failed', e); }
    try { initRelatedArticles(); }catch(e) { console.warn('biip: relatedArticles failed', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
