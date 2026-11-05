(() => {
  'use strict';
  const form=document.querySelector('#recipe-preview');if(!form)return;
  const $=s=>document.querySelector(s),node=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;};
  const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  let recipes=[],matches=[],limit=6;
  const dialog=document.createElement('dialog');dialog.className='recipe-dialog';dialog.setAttribute('aria-labelledby','recipe-detail-title');document.body.append(dialog);
  const url=raw=>{try{const u=new URL(raw);return u.protocol==='https:'?u.href:null;}catch{return null;}};
  function details(recipe){
    dialog.replaceChildren();
    const close=node('button','×','dialog-close');close.type='button';close.setAttribute('aria-label','Close recipe');close.addEventListener('click',()=>dialog.close());dialog.append(close);
    const title=node('h2',recipe.name);title.id='recipe-detail-title';dialog.append(title,node('p',[recipe.area,recipe.category].filter(Boolean).join(' / '),'eyebrow'));
    if(url(recipe.image)){const image=document.createElement('img');image.src=recipe.image;image.alt=recipe.name;image.referrerPolicy='no-referrer';image.addEventListener('error',()=>image.remove(),{once:true});dialog.append(image);}
    dialog.append(node('h3','Ingredients'));const ingredients=node('ul','');recipe.ingredients.forEach(i=>ingredients.append(node('li',[i.measure,i.name].filter(Boolean).join(' '))));dialog.append(ingredients,node('h3','Method'));
    recipe.instructions.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).forEach(step=>dialog.append(node('p',step)));
    dialog.append(node('p','Recipe data: TheMealDB. Follow the recipe’s original guidance and check ingredients for your needs.','small muted'));
    if(url(recipe.source)){const source=node('a','Original recipe source','underlink');source.href=recipe.source;source.target='_blank';source.rel='noopener noreferrer';dialog.append(source);}
    dialog.showModal();
  }
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  function render(){
    const mount=$('#recipe-results');mount.replaceChildren();
    matches.slice(0,limit).forEach(recipe=>{
      const button=node('button','','recipe-result');button.type='button';button.setAttribute('aria-label','Open recipe: '+recipe.name);
      if(url(recipe.image)){const image=document.createElement('img');image.src=recipe.image;image.alt='';image.loading='lazy';image.referrerPolicy='no-referrer';image.addEventListener('error',()=>image.remove(),{once:true});button.append(image);}
      const copy=node('span','','recipe-result-copy');copy.append(node('strong',recipe.name),node('small',[recipe.area,recipe.category].filter(Boolean).join(' / ')));button.append(copy);button.addEventListener('click',()=>details(recipe));mount.append(button);
    });
    $('#recipe-message').textContent=matches.length?`${matches.length} recipe${matches.length===1?'':'s'} found · Showing ${Math.min(limit,matches.length)}`:'No recipes matched. Try fewer ingredients or another dish name.';
    $('#recipe-more').hidden=matches.length<=limit;
  }
  form.addEventListener('submit',event=>{event.preventDefault();if(!recipes.length)return;const terms=normalize($('#recipe-query').value).split(/[,\s]+/).filter(Boolean);matches=recipes.filter(r=>{const haystack=normalize([r.name,...r.ingredients.map(i=>i.name)].join(' '));return terms.every(t=>haystack.includes(t));});limit=6;render();});
  $('#recipe-more').addEventListener('click',()=>{limit+=6;render();});
  async function load(){
    try{
      const response=await fetch('/data/recipes.json',{cache:'no-cache',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error();const data=await response.json();if(!Array.isArray(data.items))throw Error();
      recipes=data.items.filter(r=>typeof r.name==='string'&&typeof r.instructions==='string'&&Array.isArray(r.ingredients));
      const ready=recipes.length>0;$('#recipe-state').textContent=ready?(data.status==='delayed'?'REFRESH DELAYED':'CONNECTED'):'SETUP IN PROGRESS';
      form.querySelector('button').disabled=!ready;
      $('#recipe-message').textContent=ready?`Search ${recipes.length} recipes by name or ingredients. Use commas to combine ingredients.`:'The production recipe connection is being prepared. Please check back soon.';
      const date=new Date(data.updatedAt);$('#recipe-updated').textContent=ready&&!Number.isNaN(date.getTime())?'Catalog refreshed '+date.toLocaleString()+'. Updated daily.':'';
    }catch{$('#recipe-state').textContent='UNAVAILABLE';$('#recipe-message').textContent='Recipe lookup could not load. Please refresh to try again.';}
  }
  load();
})();
