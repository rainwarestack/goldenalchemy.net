(() => {
  'use strict';
  const mount = document.querySelector('#recall-results');
  if (!mount) return;
  const state = document.querySelector('#recall-state');
  const dates = document.querySelector('#recall-dates');
  function node(tag, text, className) {
    const el = document.createElement(tag); if (text) el.textContent = text;
    if (className) el.className = className; return el;
  }
  function reportDate(raw) {
    if (!/^\d{8}$/.test(raw || '')) return 'Not supplied';
    const date = new Date(`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}T12:00:00Z`);
    return Number.isNaN(date.getTime()) ? 'Not supplied' : date.toLocaleDateString([], {month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
  }
  function checkedDate(raw, withTime = true) {
    const d = new Date(raw || '');
    return Number.isNaN(d.getTime()) ? 'Not supplied' : d.toLocaleString([], withTime ? {dateStyle:'medium',timeStyle:'short'} : {dateStyle:'medium',timeZone:'UTC'});
  }
  function sourceUrl(raw) {
    try { const u = new URL(raw); return u.protocol === 'https:' && u.hostname === 'api.fda.gov' && u.pathname === '/food/enforcement.json' ? u.href : null; } catch { return null; }
  }
  function message(title, text, retry = false) {
    mount.replaceChildren(); const box = node('div', '', 'empty-state');
    box.append(node('h3',title),node('p',text));
    if (retry) { const button = node('button','Try again','retry'); button.addEventListener('click',load); box.append(button); }
    mount.append(box);
  }
  async function load() {
    state.textContent = 'LOADING'; state.classList.remove('feed-warning'); dates.textContent = '';
    mount.replaceChildren(node('div','','skeleton'));
    try {
      const response = await fetch('/data/recalls.json', {cache:'no-cache',signal:AbortSignal.timeout(12000)});
      if (!response.ok) throw new Error('Unavailable');
      const feed = await response.json();
      if (feed.source !== 'openFDA' || !Array.isArray(feed.items) || !['ready','stale','unavailable'].includes(feed.status)) throw new Error('Unexpected feed');
      if (feed.status === 'unavailable') throw new Error('Provider unavailable');
      const stale = feed.status === 'stale' || !Number.isFinite(Date.parse(feed.updatedAt)) || Date.now() - Date.parse(feed.updatedAt) > 172800000;
      state.textContent = stale ? 'UPDATES DELAYED' : 'FDA ENFORCEMENT REPORTS';
      state.classList.toggle('feed-warning',stale);
      dates.textContent = `FDA dataset: ${checkedDate(feed.sourceUpdatedAt,false)} · Last retrieved: ${checkedDate(feed.updatedAt)}${stale ? ' · Showing the last available records.' : ''}`;
      if (!feed.items.length) { message('No records in this preview.', 'This does not mean there are no recalls. Use the official FDA links below for current information.'); return; }
      mount.replaceChildren();
      const list = node('ol','','recall-list');
      feed.items.slice(0,6).forEach(item => {
        if (!item || typeof item.product_description !== 'string' || !sourceUrl(item.sourceUrl)) return;
        const li = node('li'), details = node('details'), summary = node('summary');
        const heading = node('span',item.product_description.slice(0,170) + (item.product_description.length > 170 ? '…' : ''),'recall-title');
        const meta = node('span',`${item.classification || 'Unclassified'} · Reported ${reportDate(item.report_date)}`,'recall-meta');
        summary.append(heading,meta); details.append(summary);
        const fields = [['Product',item.product_description],['Recalling firm',item.recalling_firm],['Reason',item.reason_for_recall],['Distribution',item.distribution_pattern],['Lot / code information',item.code_info],['Recall started',reportDate(item.recall_initiation_date)],['Recall number',item.recall_number]];
        const dl = node('dl'); fields.forEach(([key,value]) => { dl.append(node('dt',key),node('dd',value || 'Not supplied by FDA')); }); details.append(dl);
        const link = node('a','View official FDA record ↗','underlink'); link.href = sourceUrl(item.sourceUrl); link.target = '_blank'; link.rel = 'noopener noreferrer'; details.append(link); li.append(details); list.append(li);
      });
      if (!list.childElementCount) throw new Error('No valid records'); mount.append(list);
    } catch {
      state.textContent = 'FEED UNAVAILABLE'; state.classList.add('feed-warning'); dates.textContent = '';
      message('The FDA feed is taking a moment.', 'The preview could not be refreshed. Check the official FDA notices below; an unavailable feed does not indicate that food is safe or free from recalls.', true);
    }
  }
  load();
})();
