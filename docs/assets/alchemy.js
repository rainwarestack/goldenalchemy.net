(() => {
  'use strict';
  // Keep dynamically updated account and source links consistent with the built pages.
  function illuminateArrows(container) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: node => /[↗→↓]/.test(node.textContent) && node.parentElement?.closest('a,button') && !node.parentElement?.closest('script,style') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const pieces = node.textContent.split(/[↗→↓]/);
      const fragment = document.createDocumentFragment();
      pieces.forEach((text, index) => {
        if (index) { const dot = document.createElement('span'); dot.className = 'signal-dot'; dot.setAttribute('aria-hidden', 'true'); fragment.append(dot); }
        fragment.append(document.createTextNode(text));
      });
      node.replaceWith(fragment);
    });
  }
  illuminateArrows(document.body);
  const arrowObserver = new MutationObserver(records => records.forEach(record => {
    if (record.type === 'characterData') illuminateArrows(record.target.parentElement);
    else record.addedNodes.forEach(node => { if (node.nodeType === Node.ELEMENT_NODE) illuminateArrows(node); else if (node.nodeType === Node.TEXT_NODE && /[↗→↓]/.test(node.textContent)) illuminateArrows(node.parentElement); });
  }));
  arrowObserver.observe(document.body, {childList:true, subtree:true, characterData:true});
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const read = key => { try { return sessionStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { sessionStorage.setItem(key, value); } catch { /* Private browsing may disable storage. */ } };
  let paused = reduced.matches || read('ga-motion') === 'off';
  const toggle = document.createElement('button');
  toggle.className = 'motion-toggle'; toggle.type = 'button';
  const applyMotion = () => {
    root.classList.toggle('motion-paused', paused);
    toggle.textContent = paused ? 'Motion: off' : 'Motion: on';
    toggle.setAttribute('aria-pressed', String(!paused));
    toggle.setAttribute('aria-label', paused ? 'Turn decorative motion on' : 'Turn decorative motion off');
  };
  toggle.addEventListener('click', () => { paused = !paused; save('ga-motion', paused ? 'off' : 'on'); applyMotion(); });
  document.querySelector('.footer-bottom')?.append(toggle);
  reduced.addEventListener('change', () => { paused = reduced.matches; applyMotion(); });
  applyMotion();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('awaiting'); observer.unobserve(entry.target); }
    }), {threshold: 0.08});
    document.querySelectorAll('.section-top,.elements,.realm-card,.social-inner,.page-intro,.panel,.contact-section').forEach((el, i) => {
      el.classList.add('alchemy-reveal');
      if (el.getBoundingClientRect().top > innerHeight) el.classList.add('awaiting');
      el.style.transitionDelay = `${Math.min(i % 3, 2) * 70}ms`;
      observer.observe(el);
    });
  }
  const thread = document.createElement('div'); thread.className = 'scroll-thread'; thread.setAttribute('aria-hidden', 'true'); document.body.append(thread);
  let scheduled = false;
  function progress() {
    const distance = document.documentElement.scrollHeight - innerHeight;
    thread.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 0})`;
    scheduled = false;
  }
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(progress); } }, {passive:true});
  addEventListener('resize', progress); progress();
  const form = document.querySelector('#market-pin-form');
  if (form) {
    const gate = document.querySelector('#market-gate');
    const content = document.querySelector('#market-content');
    const message = document.querySelector('#gate-message');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const input = document.querySelector('#market-pin');
      const pin = input.value; input.value = '';
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
      const hash = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
      // Courtesy preview gate only. GitHub Pages cannot enforce server-side authorization.
      if (hash !== '55fdec963805de594b61b2c1692cadc2c1dfb844d6ac10c5bfed33c842087b2e') {
        message.textContent = 'That PIN didn’t open the door. Please try again.'; input.focus(); return;
      }
      content.replaceChildren(document.querySelector('#market-template').content.cloneNode(true));
      const lock = document.createElement('button'); lock.className = 'market-lock'; lock.type = 'button'; lock.textContent = 'Lock preview';
      lock.addEventListener('click', () => { document.dispatchEvent(new Event('ga:preview-lock')); content.replaceChildren(); content.hidden = true; gate.hidden = false; message.textContent = ''; input.focus(); });
      content.prepend(lock); gate.hidden = true; content.hidden = false;
      const heading = content.querySelector('h1'); heading.tabIndex = -1; heading.focus();
      document.dispatchEvent(new Event('ga:preview-open'));
    });
  }
})();
