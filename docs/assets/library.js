(() => {
  'use strict';
  const page = document.querySelector('.element-library'); if (!page) return;
  const $ = s => page.querySelector(s), element = page.dataset.element;
  const controls = {q:$('#resource-query'),method:$('#resource-method'),origin:$('#resource-origin'),kind:$('#resource-kind'),sort:$('#resource-sort')};
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const node = (tag, text, cls) => { const el=document.createElement(tag); el.textContent=text; if(cls)el.className=cls; return el; };
  let records=[], limit=12;
  const date = raw => { const n=Date.parse(raw); return Number.isFinite(n)?n:null; };
  function readUrl() {
    const params=new URLSearchParams(location.search);
    Object.entries(controls).forEach(([key,input]) => { const value=params.get(key); if(value!==null && (input.tagName==='INPUT'||[...input.options].some(o=>o.value===value)))input.value=value; });
  }
  readUrl();
  function render() {
    const q=normalize(controls.q.value.trim());
    const method=controls.method.value, origin=controls.origin.value,kind=controls.kind.value;
    const selected=[...controls.method.options].find(o=>o.value===method);
    let visible=records.filter(r=> (!q||q.split(/\s+/).every(term=>normalize([r.title,r.publisher,r.summary,...r.tags,...(r.tools||[])].join(' ')).includes(term))) && (!method||r.tags.some(t=>normalize(t)===normalize(method))) && (!origin||r.origin===origin) && (!kind||r.kind===kind));
    visible.sort((a,b)=>{
      if(controls.sort.value==='title')return a.title.localeCompare(b.title);
      const field=controls.sort.value==='added'?'addedAt':'publishedAt';
      const x=date(a[field]),y=date(b[field]);
      if(x===null&&y===null)return a.title.localeCompare(b.title); if(x===null)return 1;if(y===null)return -1;
      return controls.sort.value==='oldest'?x-y:y-x;
    });
    const grid=$('#resource-grid');grid.replaceChildren();
    visible.slice(0,limit).forEach(r=>{
      let url;try {url=new URL(r.url);if(url.protocol!=='https:')return;}catch{return;}
      const card=node('article','','resource-card');
      card.append(node('p',`${r.origin} / ${r.kind}`,'eyebrow'));
      const heading=node('h3',''),link=node('a',r.title);link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';heading.append(link);card.append(heading);
      card.append(node('p',r.publisher,'resource-publisher'));
      if(r.summary)card.append(node('p',r.summary,'resource-summary'));
      const tags=node('div','','resource-tags');r.tags.slice(0,5).forEach(t=>tags.append(node('span',t)));card.append(tags);
      const published=date(r.publishedAt),added=date(r.addedAt);
      card.append(node('p',published!==null?`Published ${new Date(published).toLocaleDateString()}`:`Publication date not supplied${added!==null?' · Indexed '+new Date(added).toLocaleDateString():''}`,'resource-date'));
      grid.append(card);
    });
    $('#library-status').textContent=visible.length?`${visible.length} resource${visible.length===1?'':'s'}${method?' for '+selected.textContent:''} · Showing ${Math.min(limit,visible.length)}`:method?'No resources indexed for this method yet. Try all methods or a broader search.':'No matching resources. Try another search or clear your filters.';
    $('#resource-more').hidden=visible.length<=limit;
    const params=new URLSearchParams();Object.entries(controls).forEach(([key,input])=>{if(input.value&&(key!=='sort'||input.value!=='newest'))params.set(key,input.value);});
    history.replaceState(null,'',location.pathname+(params.size?'?'+params:'')+location.hash);
  }
  $('#library-search').addEventListener('submit',e=>e.preventDefault());
  Object.values(controls).forEach(input=>input.addEventListener(input.tagName==='INPUT'?'input':'change',()=>{limit=12;render();}));
  $('#library-search').addEventListener('reset',()=>setTimeout(()=>{limit=12;render();},0));
  $('#resource-more').addEventListener('click',()=>{limit+=12;render();});
  document.querySelectorAll('.method-filter').forEach(button=>button.addEventListener('click',()=>{
    controls.method.value=button.dataset.method;controls.q.value='';controls.kind.value='';controls.origin.value='';limit=12;render();
    $('#resource-heading').scrollIntoView({behavior:document.documentElement.classList.contains('motion-paused')?'instant':'smooth',block:'start'});
    controls.method.focus({preventScroll:true});
  }));
  async function load() {
    try {
      const response=await fetch('/data/library.json',{cache:'no-cache',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error();
      const data=await response.json();if(!Array.isArray(data.resources))throw Error();
      records=data.resources.filter(r=>Array.isArray(r.elements)&&r.elements.includes(element)&&Array.isArray(r.tags)&&typeof r.title==='string');
      render();
      const sources=$('#library-sources');
      data.sources.forEach(s=>{const stamp=date(s.refreshedAt);sources.append(node('p',`${s.name}: ${s.status==='ok'?'feed refreshed':'refresh delayed; keeping archived links'}${stamp!==null?' · '+new Date(stamp).toLocaleString():''}`));});
    }catch {$('#library-status').textContent='The resource collection could not load. The method directory is still available. Please try again.';const retry=node('button','Retry','underlink');retry.type='button';retry.addEventListener('click',()=>{retry.remove();load();});$('#library-status').append(' ',retry);}
  }
  load();
})();
