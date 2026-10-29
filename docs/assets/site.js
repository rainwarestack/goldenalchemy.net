(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  const menu = $('.menu-toggle');
  const nav = $('#main-nav');
  const closeMenu = () => { nav?.classList.remove('open'); menu?.setAttribute('aria-expanded', 'false'); };
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav?.classList.contains('open')) { closeMenu(); menu.focus(); } });
  $$('#main-nav a').forEach(a => a.addEventListener('click', closeMenu));
  const info = $('#info-dialog');
  function showInfo(title, paragraphs) {
    $('#dialog-title').textContent = title;
    const body = $('#dialog-content'); body.replaceChildren();
    paragraphs.forEach(text => { const p = document.createElement('p'); p.textContent = text; body.append(p); });
    info.showModal();
  }
  $$('[data-community]').forEach(button => button.addEventListener('click', () => showInfo('The guild is taking shape.', ['Member accounts, profiles, uploads, and chat are coming in a future phase. Sign-in is not available yet.', 'Every public username will begin with chef. No registration details are being collected.'])));
  $$('[data-policy]').forEach(button => button.addEventListener('click', () => showInfo('Privacy & site information', ['This first version does not offer accounts, collect form submissions, or process payments. No analytics or location tracking have been added.', 'Public Instagram posts are refreshed through a secure scheduled workflow. Access credentials are never included in the website.', 'Google Fonts and Unsplash provide fonts and editorial photography and may receive normal connection information such as your IP address. Instagram and TikTok open only when you follow their links.', 'Editorial imagery is illustrative and is not presented as Chef Rain’s past work. The gallery is reserved for Chef Rain’s connected uploads.', 'For questions, contact @goldenalchemy.na on Instagram.'])));
  $$('dialog').forEach(dialog => {
    $('.dialog-close', dialog)?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
    dialog.addEventListener('close', () => { $$('video', dialog).forEach(video => video.pause()); });
  });
  $('#recipe-preview')?.addEventListener('submit', e => { e.preventDefault(); $('#recipe-message').textContent = 'Recipe discovery is coming soon. Search is not connected yet; your entry has not been sent anywhere.'; });
  if (!$('#media-grid')) return;
  let posts = [], filter = 'all';
  const status = $('#gallery-status'), grid = $('#media-grid'), timestamp = $('#feed-timestamp');
  function safeUrl(raw, instagramOnly = false) {
    try { const u = new URL(raw); return u.protocol === 'https:' && (!instagramOnly || ['instagram.com', 'www.instagram.com'].includes(u.hostname)) ? u.href : null; } catch { return null; }
  }
  function empty(title, text, retry = false) {
    status.replaceChildren();
    const box = document.createElement('div'); box.className = 'empty-state';
    const symbol = document.createElement('span'); symbol.className = 'empty-symbol'; symbol.setAttribute('aria-hidden','true'); symbol.textContent = '✧';
    const heading = document.createElement('h3'); heading.textContent = title;
    const p = document.createElement('p'); p.textContent = text;
    box.append(symbol, heading, p);
    if (retry) { const button = document.createElement('button'); button.className = 'retry'; button.textContent = 'Try again'; button.addEventListener('click', load); box.append(button); }
    else { const link = document.createElement('a'); link.className = 'underlink'; link.href = 'https://www.instagram.com/goldenalchemy.na/'; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Visit Chef Rain on Instagram ↗'; box.append(link); }
    status.append(box);
  }
  function openMedia(post) {
    const content = $('#media-content'); content.replaceChildren();
    const url = safeUrl(post.media_url), thumb = safeUrl(post.thumbnail_url);
    if (url) {
      const media = document.createElement(post.media_type === 'VIDEO' ? 'video' : 'img');
      media.src = url;
      if (media.tagName === 'VIDEO') { media.controls = true; media.playsInline = true; media.preload = 'metadata'; if (thumb) media.poster = thumb; }
      else media.alt = post.caption || 'A creation from Chef Rain’s kitchen';
      media.addEventListener('error', () => { media.remove(); });
      content.append(media);
    }
    const caption = document.createElement('p'); caption.textContent = post.caption || 'Fresh from Chef Rain’s kitchen.'; content.append(caption);
    const permalink = safeUrl(post.permalink, true);
    if (permalink) { const a = document.createElement('a'); a.href = permalink; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'View the original on Instagram ↗'; content.append(a); }
    $('#media-dialog').showModal();
  }
  function render() {
    grid.replaceChildren(); status.replaceChildren();
    const visible = posts.filter(p => filter === 'all' || (filter === 'video' ? p.media_type === 'VIDEO' : p.media_type !== 'VIDEO'));
    if (!visible.length) { empty(posts.length ? 'Nothing in this collection yet.' : 'Something good is on the way.', posts.length ? 'Try another filter to explore the kitchen.' : 'Chef Rain’s connected Instagram gallery is ready. New creations will appear here when posts are available.'); return; }
    visible.forEach(post => {
      const card = document.createElement('button'); card.className = 'media-card';
      const title = (post.caption || 'Fresh from the kitchen').split('\n')[0].slice(0, 100);
      card.setAttribute('aria-label', `Open ${post.media_type === 'VIDEO' ? 'video' : 'photo'}: ${title}`);
      const url = safeUrl(post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url);
      if (url) { const img = document.createElement('img'); img.src = url; img.alt = title; img.loading = 'lazy'; img.addEventListener('error', () => { img.remove(); }); card.append(img); }
      const label = document.createElement('span'); label.className = 'media-type'; label.textContent = post.media_type === 'VIDEO' ? '▶ VIDEO / INSTAGRAM' : 'PHOTO / INSTAGRAM';
      const strong = document.createElement('strong'); strong.textContent = title; card.append(label, strong);
      card.addEventListener('click', () => openMedia(post)); grid.append(card);
    });
  }
  $$('.filter').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; $$('.filter').forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); }); render(); }));
  async function load() {
    status.innerHTML = '<div class="skeleton" aria-label="Loading gallery"></div>'; grid.replaceChildren(); timestamp.textContent = '';
    try {
      const response = await fetch('/data/instagram.json', { cache: 'no-cache', signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('Feed unavailable');
      const data = await response.json();
      if (data.username !== 'goldenalchemy.na' || !Array.isArray(data.items)) throw new Error('Unexpected feed');
      posts = data.items.filter(p => p && ['IMAGE','VIDEO','CAROUSEL_ALBUM'].includes(p.media_type) && safeUrl(p.permalink, true));
      render();
      const date = new Date(data.updatedAt);
      if (!Number.isNaN(date.getTime())) { const stale = Date.now() - date.getTime() > 86400000; timestamp.textContent = `${stale ? 'Updates delayed · ' : ''}Instagram · Last refreshed ${date.toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}${stale ? '. Showing the last available collection.' : ''}`; }
    } catch { empty('The kitchen feed is taking a moment.', 'We couldn’t load the gallery. You can still find Chef Rain’s latest work on Instagram.', true); }
  }
  load();
})();
