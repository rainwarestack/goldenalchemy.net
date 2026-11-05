(() => {
  'use strict';
  const C=window.GuildCore, $=s=>document.querySelector(s);
  const apps=[['time','◷','Time','Kitchen Clock','Make time for a little magic.'],['shop','♧','Shop','Market Basket','Gather something good.'],['prep','◇','Prep','Prep Station','Everything in its place.'],['cook','♨','Cook','On the Stove','Follow your own rhythm.'],['serve','✧','Serve','The Table','Made to be remembered.']];
  const reactions=[['🔥','Fire'],['🤤','Delicious'],['👏','Applause'],['💛','Love']];
  let root,db,state=C.fresh(),active=null,visitor=false,arrange=false,interval,opener,queue=Promise.resolve(),ready=false,generation=0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=()=>crypto.randomUUID();
  const iconFor=key=>`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({time:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',shop:'<path d="M3 9h18l-2 11H5L3 9Zm4 0 5-7 5 7M9 12v5m6-5v5"/>',prep:'<path d="m4 20 6-6m-3-3L17 1c5 5 2 10-3 14l-7-4Zm0 0 7 4"/>',cook:'<path d="M5 8h14v11H5V8ZM3 8h18M8 4h8m-4-2v2M2 11h3m14 0h3"/>',serve:'<path d="M2 20h20M4 17a8 8 0 0 1 16 0H4Zm8-10V5m-2 0h4"/>'})[key]}</svg>`;
  const notice=text=>{if($('#g-notice'))$('#g-notice').textContent=text;if($('#g-dialog')?.open&&$('#g-form-status'))$('#g-form-status').textContent=text;if($('#g-quick-plan-status'))$('#g-quick-plan-status').textContent=text;};
  function database(){return new Promise((resolve,reject)=>{const req=indexedDB.open('golden-alchemy-guild',1);req.onupgradeneeded=()=>req.result.createObjectStore('kitchen');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('Storage blocked'));});}
  function load(){return new Promise((resolve,reject)=>{const req=db.transaction('kitchen').objectStore('kitchen').get('preview-v1');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  function write(value){return new Promise((resolve,reject)=>{const tx=db.transaction('kitchen','readwrite');tx.objectStore('kitchen').put(value,'preview-v1');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
  function update(fn,message='',rerender=true){
    const task=queue.then(async()=>{const next=structuredClone(state);fn(next);try{if(db)await write(next);state=next;if(rerender&&root?.isConnected)render();if(message)notice(db?message:message+' Temporary only: browser storage is unavailable.');return true;}catch{notice('Could not save this change. Your previous saved version is intact. Try a smaller photo or download a backup.');return false;}});
    queue=task.catch(()=>{});return task;
  }
  const image=(src,alt,cls='')=>`<img src="${esc(src)}" alt="${esc(alt)}" class="${cls}" loading="lazy">`;
  function render(){
    const p=state.profile,m=state.meal;
    $('#g-name').textContent='Chef '+p.name;
    $('#g-bio').textContent=p.bio;
    $('#g-specialty').textContent=p.specialty||'A space for whatever you’re making.';
    $('#g-board-heading').textContent=visitor?'The moodboard.':'Your moodboard.';
    $('#g-session-label').textContent=visitor?'Kitchen activity is private':m.name||'Make something yours.';
    $('#g-avatar').innerHTML=p.avatar?image(p.avatar,'Your chosen profile picture'):'<span aria-hidden="true">✧</span>';
    const banner=$('#g-banner');banner.querySelector('img')?.remove();if(p.banner){const img=document.createElement('img');img.src=p.banner;img.alt='Your chosen profile banner';img.style.cssText='position:absolute;inset:0;z-index:0';banner.prepend(img);}
    banner.querySelector('.g-banner-word').style.cssText='position:relative;z-index:1';
    banner.querySelector('.g-banner-star').style.zIndex='1';
    root.classList.toggle('g-visitor',visitor);
    $('#g-apps').innerHTML=apps.map(([key,icon,short,title,desc],i)=>{
      let detail=desc;
      if(!visitor){
        if(key==='time')detail=m.name?'Serve at '+m.serveAt:'Plan your next meal';
        if(key==='shop')detail=m.ingredients.length?`${m.ingredients.filter(x=>x.checked).length} of ${m.ingredients.length} gathered`:desc;
        if(key==='prep')detail=m.prep.length?`${m.prep.filter(x=>x.checked).length} of ${m.prep.length} ready`:desc;
        if(key==='cook')detail=state.timer.end!==null?'Timer running · '+C.clock(C.remaining(state.timer)):m.steps.length?`Step ${m.step+1} of ${m.steps.length}`:desc;
        if(key==='serve'){const n=state.moments.filter(x=>x.kind==='dish').length;detail=n+' '+(n===1?'dish':'dishes')+' remembered';}
      }else detail='Kitchen activity is private';
      return `<button type="button" class="g-app" data-app="${key}" ${visitor?'disabled':''}><span class="g-app-icon" aria-hidden="true">${iconFor(key)}</span><span class="g-app-step">0${i+1} / ${short.toUpperCase()}</span><strong>${title}</strong><span class="g-app-detail">${esc(detail)}</span><span class="g-app-foot">${visitor?'Private tool':'Open '+short+' · +'}</span></button>`;
    }).join('');
    const visible=visitor?state.moments.filter(x=>!x.private):state.moments;
    $('#g-board').innerHTML=visible.length?visible.map(moment=>`<article class="g-moment" data-id="${esc(moment.id)}">${moment.photo?image(moment.photo,moment.title):''}<div class="g-moment-copy"><span class="g-badge">${moment.private?'Private draft':moment.kind==='dish'?'From the table':'A kitchen moment'}</span><h3>${esc(moment.title)}</h3>${moment.caption?`<p>${esc(moment.caption)}</p>`:''}<p><time datetime="${esc(moment.created)}">${new Date(moment.created).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</time></p><div class="g-reactions" role="group" aria-label="Emoji reactions (preview only)">${reactions.map(([emoji,label])=>`<button type="button" data-react="${emoji}" aria-label="${label} reaction, local preview" aria-pressed="${moment.reaction===emoji}" ${visitor?'disabled':''}>${emoji}${moment.reaction===emoji?' 1':''}</button>`).join('')}</div></div>${!visitor?`<div class="g-moment-tools">${arrange?`<button type="button" class="g-secondary" data-move="-1" aria-label="Move ${esc(moment.title)} earlier" ${state.moments[0].id===moment.id?'disabled':''}>Earlier</button><button type="button" class="g-secondary" data-move="1" aria-label="Move ${esc(moment.title)} later" ${state.moments.at(-1).id===moment.id?'disabled':''}>Later</button>`:''}<button type="button" class="g-secondary" data-edit-moment>Edit</button><button type="button" class="g-secondary" data-delete-moment>Remove</button></div>`:''}</article>`).join(''):`<div class="g-empty"><div class="g-empty-sigil" aria-hidden="true">✧</div><h3>A table waiting for your story.</h3><p>${visitor?'Your shared moments will appear here. Private drafts stay out of the visitor preview.':'A finished dish, a market find, a little inspiration. Start with your own photo or a note.'}</p>${visitor?'':'<button type="button" class="button" data-first-moment>Add your first moment</button>'}</div>`;
  }
  function open(key,title,html,kicker='YOUR KITCHEN'){
    active=key;opener=document.activeElement;
    $('#g-dialog-title').textContent=title;$('#g-dialog-kicker').textContent=kicker;
    $('#g-dialog-body').innerHTML=html;
    if(!$('#g-dialog').open)$('#g-dialog').showModal();
    $('#g-dialog').scrollTop=0;
  }
  function close(){const d=$('#g-dialog');if(d?.open)d.close();active=null;opener?.isConnected&&opener.focus();}
  const help='<p class="g-help">Saved on this browser only during the Guild preview.</p>';
  function fileField(id,label){return `<label for="${id}">${label}</label><input type="file" id="${id}" accept="image/jpeg,image/png,image/webp"><p class="g-help">JPG, PNG, or WebP · up to 15 MB. Images are resized for your board.</p>`;}
  function bindSubmit(id,handler){$(id).addEventListener('submit',async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{await handler(new FormData(e.currentTarget),b);}catch(error){const status=$('#g-form-status');if(status)status.textContent=error.message||'Could not save. Please try again.';}finally{if(b.isConnected)b.disabled=false;}});}
  async function readPhoto(file){
    if(!file||!file.size)return null;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG, or WebP image.');
    if(file.size>15*1024*1024)throw new Error('Choose a photo smaller than 15 MB.');
    const bitmap=await createImageBitmap(file);const ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    return canvas.toDataURL('image/jpeg',.84);
  }
  function editProfile(){
    const p=state.profile;
    open('profile','Make yourself at home.',`<form id="g-profile-form"><label for="g-profile-name">Chef name</label><div class="g-fixed-prefix"><span>Chef</span><input id="g-profile-name" name="name" value="${esc(p.name)}" required maxlength="40" pattern="[A-Za-z0-9_ ]{1,40}" autocomplete="nickname"></div><label for="g-profile-bio">About your kitchen</label><textarea id="g-profile-bio" name="bio" maxlength="500">${esc(p.bio)}</textarea><label for="g-profile-specialty">What do you love to cook?</label><input id="g-profile-specialty" name="specialty" maxlength="100" value="${esc(p.specialty)}">${fileField('g-avatar-file','Profile picture')}${p.avatar?'<label class="g-photo-label"><input type="checkbox" name="removeAvatar">Remove current profile picture</label>':''}${fileField('g-banner-file','Profile banner')}${p.banner?'<label class="g-photo-label"><input type="checkbox" name="removeBanner">Restore default banner</label>':''}${help}<p id="g-form-status" role="status"></p><button class="button" type="submit">Save my profile</button></form>`,'YOUR PROFILE / CHEF COMES FIRST');
    bindSubmit('#g-profile-form',async data=>{const name=data.get('name').trim().replace(/^chef\s*/i,'');if(!name)throw new Error('Add a name after Chef.');const avatar=await readPhoto($('#g-avatar-file').files[0]),banner=await readPhoto($('#g-banner-file').files[0]);if(await update(s=>{s.profile={name,bio:data.get('bio').trim(),specialty:data.get('specialty').trim(),avatar:avatar||(data.has('removeAvatar')?null:s.profile.avatar),banner:banner||(data.has('removeBanner')?null:s.profile.banner)};},'Your profile preview is saved.'))close();});
  }
  function timeApp(){
    const m=state.meal;
    open('time','Kitchen Clock',`<div class="g-clock" id="g-live-clock" aria-label="Your local time"></div><p>Your local kitchen time</p><form id="g-time-form"><label for="g-meal-name">What are you making?</label><input id="g-meal-name" name="name" value="${esc(m.name)}" placeholder="Give tonight’s meal a name" maxlength="100" required><div class="g-fields"><div><label for="g-available">Available time (minutes)</label><input id="g-available" name="available" type="number" min="1" max="1440" value="${m.available}" required></div><div><label for="g-serve-at">Serve at</label><input id="g-serve-at" name="serveAt" type="time" value="${m.serveAt}" required></div></div><div class="g-fields"><div><label for="g-prep-min">Prep (minutes)</label><input id="g-prep-min" name="prepMinutes" type="number" min="0" max="1440" value="${m.prepMinutes}" required></div><div><label for="g-cook-min">Cook (minutes)</label><input id="g-cook-min" name="cookMinutes" type="number" min="0" max="1440" value="${m.cookMinutes}" required></div><div><label for="g-plate-min">Plate (minutes)</label><input id="g-plate-min" name="plateMinutes" type="number" min="0" max="1440" value="${m.plateMinutes}" required></div></div><div class="g-plan-summary" id="g-plan-summary"></div>${help}<button class="button" type="submit">Save meal plan</button><p id="g-form-status" role="status"></p></form><button type="button" class="g-secondary" id="g-next-shop">Next: gather ingredients</button>`,'01 / TIME');
    function summary(){const form=$('#g-time-form');if(!form.checkValidity())return;const data=new FormData(form),meal={...m,serveAt:data.get('serveAt')};for(const k of ['available','prepMinutes','cookMinutes','plateMinutes'])meal[k]=Number(data.get(k));const p=C.plan(meal),f=d=>d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}),tomorrow=p.serve.toDateString()!==new Date().toDateString();$('#g-plan-summary').textContent=`${p.total} minutes total. Start at ${f(p.start)}${p.start.toDateString()!==new Date().toDateString()?' ('+p.start.toLocaleDateString()+')':''} to serve at ${f(p.serve)}${tomorrow?' tomorrow':''}.${p.start<new Date()?' That start time has passed; choose a later serving time.':''}${!p.fits?' This exceeds your available time.':''}`;}
    $('#g-time-form').addEventListener('input',summary);summary();tick();
    bindSubmit('#g-time-form',async data=>{const saved=await update(s=>{s.meal.name=data.get('name').trim();s.meal.serveAt=data.get('serveAt');for(const k of ['available','prepMinutes','cookMinutes','plateMinutes'])s.meal[k]=Number(data.get(k));},'Meal plan saved.');if(saved)$('#g-form-status').textContent='Meal plan saved.';});
    $('#g-next-shop').onclick=()=>shopApp();
    mobileTools('time');
  }
  function checklist(kind){const items=state.meal[kind];return `<ul class="g-checklist">${items.map(item=>`<li><label><input type="checkbox" data-check="${esc(item.id)}" ${item.checked?'checked':''}><span>${esc(item.text)}</span></label><button type="button" data-remove="${esc(item.id)}" aria-label="Remove ${esc(item.text)}">×</button></li>`).join('')}</ul>`;}
  function shopApp(){
    open('shop','Market Basket',`<p>${esc(state.meal.name||'A good meal starts here.')} · One checklist shared with your cooking session.</p><form id="g-servings-form"><label for="g-servings">Servings</label><div class="g-inline-add"><input id="g-servings" type="number" min="1" max="100" value="${state.meal.servings}" required><button type="submit" class="g-secondary">Save</button></div><p class="g-help">Quantities are your notes; changing servings does not scale them.</p></form><div id="g-list-area">${checklist('ingredients')}</div><form id="g-add-item" class="g-inline-add"><label class="skip-label" for="g-item-text">Ingredient and quantity</label><input id="g-item-text" placeholder="Tomatoes · 500 g" maxlength="150" required><button class="g-secondary" type="submit">+ Add</button></form><p class="g-help">Check off what’s in your pantry or basket.</p>${help}<p id="g-form-status" role="status"></p><button type="button" class="button" id="g-next-prep">Next: prep station</button>`,'02 / SHOP');
    bindList('ingredients');$('#g-next-prep').onclick=prepApp;
    $('#g-servings-form').onsubmit=async e=>{e.preventDefault();await update(s=>{s.meal.servings=Number($('#g-servings').value);},'Servings saved.');};
    mobileTools('shop');
  }
  function bindList(kind){
    $('#g-list-area').onchange=async e=>{if(!e.target.dataset.check)return;const id=e.target.dataset.check,checked=e.target.checked;const saved=await update(s=>{s.meal[kind].find(x=>x.id===id).checked=checked;});if(!saved)e.target.checked=!checked;refreshProgress();};
    $('#g-list-area').onclick=async e=>{const button=e.target.closest('[data-remove]');if(!button)return;if(await update(s=>{s.meal[kind]=s.meal[kind].filter(x=>x.id!==button.dataset.remove);})){$('#g-list-area').innerHTML=checklist(kind);refreshProgress();}};
    $('#g-add-item').onsubmit=async e=>{e.preventDefault();const input=$('#g-item-text'),text=input.value.trim();if(!text)return;const button=e.submitter;button.disabled=true;try{if(await update(s=>{s.meal[kind].push({id:uid(),text,checked:false});})){input.value='';$('#g-list-area').innerHTML=checklist(kind);refreshProgress();input.focus();}}finally{button.disabled=false;}};
  }
  function refreshProgress(){if(!$('#g-prep-progress'))return;const items=state.meal.prep,done=items.filter(x=>x.checked).length;$('#g-prep-progress').max=items.length||1;$('#g-prep-progress').value=done;$('#g-prep-count').textContent=items.length?`${done} of ${items.length} ready`:'Add your preparation tasks below.';}
  function prepApp(){
    open('prep','Prep Station',`<p>${esc(state.meal.name||'Everything in its place.')}</p><progress class="g-progress" id="g-prep-progress" aria-label="Preparation progress" max="1" value="0"></progress><p id="g-prep-count"></p><div id="g-list-area">${checklist('prep')}</div><form id="g-add-item" class="g-inline-add"><label class="skip-label" for="g-item-text">Preparation task</label><input id="g-item-text" placeholder="Rinse and chop the tomatoes" maxlength="150" required><button class="g-secondary" type="submit">+ Add</button></form><button type="button" class="g-secondary" id="g-from-basket">Add prep notes from basket</button><p class="g-help">This copies ingredient names into editable preparation notes. Choose the appropriate preparation for each ingredient.</p>${help}<p id="g-form-status" role="status"></p><button type="button" class="button" id="g-next-cook">Next: on the stove</button>`,'03 / PREP');
    bindList('prep');refreshProgress();$('#g-next-cook').onclick=cookApp;
    $('#g-from-basket').onclick=async()=>{if(!state.meal.ingredients.length){$('#g-form-status').textContent='Add ingredients to your Market Basket first.';return;}if(await update(s=>{const names=new Set(s.meal.prep.map(x=>x.text));s.meal.ingredients.forEach(x=>{const text='Prepare '+x.text;if(!names.has(text)){s.meal.prep.push({id:uid(),text,checked:false});names.add(text);}});})){prepApp();}};
    mobileTools('prep');
  }
  function cookApp(){
    const m=state.meal;
    open('cook','On the Stove',`<p>${esc(m.name||'Your kitchen, at your pace.')}</p><div class="g-timer" id="g-timer" role="timer" aria-label="Cooking timer">${C.clock(C.remaining(state.timer))}</div><p id="g-timer-status" class="g-help" style="text-align:center"></p><div class="g-controls"><button type="button" class="button" id="g-timer-toggle">${state.timer.end===null?'Start':'Pause'}</button><button type="button" class="g-secondary" id="g-timer-add">+ 1 min</button><button type="button" class="g-secondary" id="g-timer-reset">Reset</button></div><form id="g-duration-form"><label for="g-duration">Timer length (minutes)</label><div class="g-inline-add"><input id="g-duration" type="number" min="1" max="1440" value="${state.timer.duration/60}" step="1" required><button type="submit" class="g-secondary">Set timer</button></div></form><p class="g-help">The timer uses elapsed time while this page is open. Background tabs can delay alerts; keep a kitchen timer for anything critical.</p><hr><p id="g-step-count"></p><p class="g-step-text" id="g-step-text"></p><div class="g-controls"><button type="button" class="g-secondary" id="g-step-prev">Previous</button><button type="button" class="g-secondary" id="g-step-next">Next step</button></div><details><summary>Edit cooking steps</summary><form id="g-steps-form"><label for="g-steps">One step per line</label><textarea id="g-steps" rows="5" maxlength="10000">${esc(m.steps.join('\n'))}</textarea><button type="submit" class="g-secondary">Save steps</button></form></details>${help}<p id="g-form-status" role="status"></p><button type="button" class="button" id="g-next-serve">Ready for the table</button>`,'04 / COOK');
    const extra=document.createElement('section');extra.setAttribute('aria-label','Additional kitchen timers');extra.innerHTML='<div id="g-extra-timers"></div><details><summary>Add another timer</summary><form id="g-extra-timer-form"><label for="g-extra-name">Timer name</label><input id="g-extra-name" maxlength="60" placeholder="Pasta, rice, or a resting dish" required><label for="g-extra-duration">Minutes</label><input id="g-extra-duration" type="number" min="1" max="1440" value="8" required><button type="submit" class="g-secondary">Add timer</button></form></details>';
    $('#g-duration-form').after(extra);renderTimers();
    $('#g-extra-timer-form').onsubmit=async e=>{e.preventDefault();const name=$('#g-extra-name').value.trim(),duration=Number($('#g-extra-duration').value)*60;if(!name)return;if(state.timers.length>=8){notice('You can keep up to eight additional timers.');return;}if(await update(s=>{s.timers.push({id:uid(),name,duration,remaining:duration,end:null});},'Additional timer saved.')){$('#g-extra-name').value='';renderTimers();}};
    $('#g-extra-timers').onclick=async e=>{const b=e.target.closest('[data-timer-action]');if(!b)return;const id=b.closest('[data-timer-id]').dataset.timerId,action=b.dataset.timerAction;await update(s=>{if(action==='remove')s.timers=s.timers.filter(x=>x.id!==id);else s.timers=s.timers.map(x=>x.id===id?{...C.changeTimer(x,action==='toggle'?(x.end===null?'start':'pause'):action)}:x);});renderTimers();};
    renderStep();tick();
    const timer=async action=>{await update(s=>{s.timer=C.changeTimer(s.timer,action);});tick();};
    $('#g-timer-toggle').onclick=()=>timer(state.timer.end===null?'start':'pause');$('#g-timer-add').onclick=()=>timer('add');$('#g-timer-reset').onclick=()=>timer('reset');
    $('#g-duration-form').onsubmit=async e=>{e.preventDefault();const duration=Number($('#g-duration').value)*60;await update(s=>{s.timer={duration,remaining:duration,end:null};},'Timer length saved.');tick();};
    $('#g-steps-form').onsubmit=async e=>{e.preventDefault();const steps=$('#g-steps').value.split('\n').map(x=>x.trim()).filter(Boolean);await update(s=>{s.meal.steps=steps;s.meal.step=Math.min(s.meal.step,Math.max(0,steps.length-1));},'Cooking steps saved.');renderStep();};
    $('#g-step-prev').onclick=async()=>{await update(s=>{s.meal.step=Math.max(0,s.meal.step-1);});renderStep();};
    $('#g-step-next').onclick=async()=>{await update(s=>{s.meal.step=Math.min(Math.max(0,s.meal.steps.length-1),s.meal.step+1);});renderStep();};$('#g-next-serve').onclick=()=>momentForm(null,'dish');
    mobileTools('cook');
  }
  function renderStep(){const m=state.meal;$('#g-step-count').textContent=m.steps.length?`Step ${m.step+1} of ${m.steps.length}`:'Your own recipe, your own steps.';$('#g-step-text').textContent=m.steps[m.step]||'Add your cooking steps below to follow along.';$('#g-step-prev').disabled=m.step===0;$('#g-step-next').disabled=!m.steps.length||m.step>=m.steps.length-1;}
  function renderTimers(){if(!$('#g-extra-timers'))return;$('#g-extra-timers').innerHTML=state.timers.map(t=>`<div class="g-extra-timer" data-timer-id="${esc(t.id)}"><div class="g-row"><strong>${esc(t.name)}</strong><span role="timer" aria-label="${esc(t.name)} timer" data-timer-clock>${C.clock(C.remaining(t))}</span></div><div class="g-controls"><button type="button" class="g-secondary" data-timer-action="toggle" ${C.remaining(t)===0?'disabled':''}>${t.end===null?'Start':'Pause'}</button><button type="button" class="g-secondary" data-timer-action="add">+ 1 min</button><button type="button" class="g-secondary" data-timer-action="reset">Reset</button><button type="button" class="g-secondary" data-timer-action="remove">Remove</button></div></div>`).join('');}
  function momentForm(existing=null,kind='moment'){
    const m=existing||{title:kind==='dish'?state.meal.name:'',caption:'',photo:null,private:false};
    open('serve',kind==='dish'?'The Table':existing?'Edit your moment.':'A moment worth keeping.',`<form id="g-moment-form">${m.photo?image(m.photo,m.title,'g-photo-preview'):''}${fileField('g-moment-photo',kind==='dish'?'Your finished dish':'Photo (optional)')}${m.photo?'<label class="g-photo-label"><input type="checkbox" name="removePhoto">Remove photo</label>':''}<label for="g-moment-title">${kind==='dish'?'Dish name':'Title'}</label><input id="g-moment-title" name="title" value="${esc(m.title)}" maxlength="100" required><label for="g-moment-caption">A little story</label><textarea id="g-moment-caption" name="caption" maxlength="1000" placeholder="What made this moment yours?">${esc(m.caption)}</textarea><label for="g-moment-visibility">Include in visitor preview?</label><select id="g-moment-visibility" name="visibility"><option value="board" ${!m.private?'selected':''}>On my profile preview</option><option value="private" ${m.private?'selected':''}>Private draft</option></select><p class="g-help">Both choices stay on this browser. Public sharing isn’t connected yet.</p><p class="g-help">Reactions only: 🔥 🤤 👏 💛. No comments.</p><p id="g-form-status" role="status"></p><button class="button" type="submit">${existing?'Save moment':'Save to my moodboard'}</button></form>`,'05 / SERVE & REMEMBER');
    bindSubmit('#g-moment-form',async data=>{const photo=await readPhoto($('#g-moment-photo').files[0]);const next={...m,id:existing?.id||uid(),title:data.get('title').trim(),caption:data.get('caption').trim(),kind:existing?.kind||kind,photo:photo||(data.has('removePhoto')?null:m.photo),private:data.get('visibility')==='private',created:existing?.created||new Date().toISOString(),reaction:existing?.reaction||null};if(!next.title)throw new Error('Give this moment a title.');if(await update(s=>{if(existing)s.moments=s.moments.map(x=>x.id===existing.id?next:x);else s.moments.unshift(next);},'Moment saved to your local moodboard.'))close();});
    mobileTools('serve');
  }
  // Mobile progressively discloses the original controls, preserving their values
  // and event handlers. Desktop opens the original, full settings unchanged.
  function mobileTools(key){
    if(!matchMedia('(max-width: 600px)').matches)return;
    const body=$('#g-dialog-body');
    const panel=(label,html)=>{const el=document.createElement('section');el.className='g-quick-panel';el.setAttribute('aria-label',label);el.innerHTML=html;return el;};
    const chips=(values,attribute,selected)=>`<div class="g-quick-grid">${values.map(v=>`<button type="button" class="g-secondary" ${attribute}="${esc(v)}" aria-pressed="${v===selected}">${esc(v)}${/minutes|timer/.test(attribute)?' min':''}</button>`).join('')}</div>`;
    const more=(nodes,label)=>{const d=document.createElement('details');d.className='g-mobile-more';const summary=document.createElement('summary');summary.textContent=label;d.append(summary);nodes=nodes.filter(Boolean);nodes[0].before(d);nodes.forEach(n=>d.append(n));return d;};
    if(key==='time'){
      const details=more([$('#g-time-form')],'Custom meal & timing');
      const quick=panel('Quick meal plan','<p class="g-quick-heading">How much time do you have?</p>'+chips([15,30,45,60],'data-plan-minutes',state.meal.available)+'<p class="g-help">Minutes from now to the table. We’ll split the time between prep, cooking, and plating.</p><button type="button" class="button g-quick-primary" id="g-quick-plan">Plan this meal</button><p role="status" id="g-quick-plan-status"></p>');
      details.before(quick);let minutes=[15,30,45,60].includes(state.meal.available)?state.meal.available:30;
      const select=n=>{minutes=n;quick.querySelectorAll('[data-plan-minutes]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.planMinutes)===n)));};select(minutes);
      quick.onclick=async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.planMinutes)select(Number(b.dataset.planMinutes));if(b.id==='g-quick-plan'){b.disabled=true;try{const serve=new Date(Date.now()+minutes*60000),at=String(serve.getHours()).padStart(2,'0')+':'+String(serve.getMinutes()).padStart(2,'0');if(await update(s=>{s.meal.name=s.meal.name||'My next meal';s.meal.available=minutes;s.meal.serveAt=at;s.meal.prepMinutes=Math.round(minutes*.25);s.meal.plateMinutes=5;s.meal.cookMinutes=minutes-s.meal.prepMinutes-5;},'Quick meal plan saved.')){const m=state.meal;for(const field of ['name','available','serveAt','prepMinutes','cookMinutes','plateMinutes'])$('#g-time-form').elements.namedItem(field).value=m[field];$('#g-time-form').dispatchEvent(new Event('input'));$('#g-quick-plan-status').textContent='Ready for the table at '+serve.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'.';}}finally{b.disabled=false;}}};
    }
    if(key==='shop'||key==='prep'){
      const kind=key==='shop'?'ingredients':'prep',suggestions=key==='shop'?['Tomatoes','Pasta','Basil','Garlic','Rice','Onion']:['Gather tools','Rinse produce','Chop vegetables','Measure ingredients'];
      const details=more(key==='shop'?[$('#g-servings-form'),$('#g-add-item')]:[$('#g-add-item')],key==='shop'?'Custom ingredients & servings':'Write a custom prep task');
      const next=$(key==='shop'?'#g-next-prep':'#g-next-cook');next.before(details);
      const quick=panel('Quick '+key,`${key==='shop'?'<p class="g-quick-heading">Cooking for</p>'+chips([1,2,4,6],'data-quick-servings',state.meal.servings):''}<p class="g-quick-heading">${key==='shop'?'Tap to add to your basket':'Tap to add a prep task'}</p><div class="g-quick-grid" id="g-quick-items"></div>`);
      $('#g-list-area').before(quick);
      function refresh(){quick.querySelector('#g-quick-items').innerHTML=suggestions.map(text=>{const added=state.meal[kind].some(x=>x.text.toLowerCase()===text.toLowerCase());return `<button type="button" class="g-secondary" data-quick-item="${esc(text)}" ${added?'disabled':''}>${added?'✓ ':'+ '}${esc(text)}</button>`;}).join('');}
      refresh();
      quick.onclick=async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.quickServings){const value=Number(b.dataset.quickServings);if(await update(s=>{s.meal.servings=value;},'Servings saved.')){$('#g-servings').value=value;quick.querySelectorAll('[data-quick-servings]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.quickServings)===value)));}}if(b.dataset.quickItem){b.disabled=true;if(await update(s=>{if(!s.meal[kind].some(x=>x.text.toLowerCase()===b.dataset.quickItem.toLowerCase()))s.meal[kind].push({id:uid(),text:b.dataset.quickItem,checked:false});},key==='shop'?'Ingredient added.':'Prep task added.')){$('#g-list-area').innerHTML=checklist(kind);refreshProgress();}refresh();}};
      // Refresh suggestions after removing a row or adding a custom entry too.
      const observer=new MutationObserver(refresh);observer.observe($('#g-list-area'),{childList:true});
    }
    if(key==='cook'){
      const details=more([$('#g-duration-form'),$('#g-timer-reset')],'Custom timer & reset');
      const quick=panel('Quick timer lengths','<p class="g-quick-heading">Set a quick timer</p>'+chips([5,10,15,25],'data-quick-timer',state.timer.duration/60)+'<p class="g-help">Minutes · choosing a length resets this timer.</p>');details.before(quick);
      quick.onclick=async e=>{const b=e.target.closest('[data-quick-timer]');if(!b)return;const duration=Number(b.dataset.quickTimer)*60;if(await update(s=>{s.timer={duration,remaining:duration,end:null};},'Timer ready. Tap Start when you are.')){$('#g-duration').value=duration/60;quick.querySelectorAll('[data-quick-timer]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.quickTimer)*60===duration)));tick();}};
    }
    if(key==='serve'){
      const form=$('#g-moment-form'),title=$('#g-moment-title'),caption=$('#g-moment-caption'),file=$('#g-moment-photo'),visibility=$('#g-moment-visibility');
      if(!title.value)title.value=state.meal.name||'From my kitchen';
      more([form.querySelector('label[for="g-moment-title"]'),title,form.querySelector('label[for="g-moment-caption"]'),caption],'Add a title or story');
      const photoButton=document.createElement('button');photoButton.type='button';photoButton.className='g-secondary g-photo-pick';photoButton.textContent='＋ Choose a photo';file.before(photoButton);file.hidden=true;form.querySelector('label[for="g-moment-photo"]').classList.add('g-mobile-native');photoButton.onclick=()=>file.click();file.addEventListener('change',()=>{photoButton.textContent=file.files.length?'✓ Photo selected · change':'＋ Choose a photo';});
      const quick=panel('Moodboard visibility','<p class="g-quick-heading">Keep this moment</p><div class="g-quick-grid"><button type="button" class="g-secondary" data-quick-visibility="board">On my moodboard</button><button type="button" class="g-secondary" data-quick-visibility="private">As a private draft</button></div>');visibility.before(quick);visibility.classList.add('g-mobile-native');form.querySelector('label[for="g-moment-visibility"]').classList.add('g-mobile-native');
      const refresh=()=>quick.querySelectorAll('[data-quick-visibility]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.quickVisibility===visibility.value)));refresh();quick.onclick=e=>{const b=e.target.closest('[data-quick-visibility]');if(b){visibility.value=b.dataset.quickVisibility;refresh();}};
      const invalid=e=>{if(e.target.closest('details'))e.target.closest('details').open=true;};form.addEventListener('invalid',invalid,true);
    }
  }
  function tick(){
    if(!ready||!root?.isConnected)return;
    if(active==='time'&&$('#g-live-clock'))$('#g-live-clock').textContent=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
    const left=C.remaining(state.timer);
    if(active==='cook'&&$('#g-timer')){$('#g-timer').textContent=C.clock(left);$('#g-timer-toggle').textContent=state.timer.end===null?'Start':'Pause';$('#g-timer-toggle').disabled=left===0;$('#g-timer-status').textContent=left===0?'Timer finished.':state.timer.end===null?'Ready when you are.':'Timer running';}
    if(state.timer.end!==null&&left===0){update(s=>{s.timer.remaining=0;s.timer.end=null;},'Your cooking timer has finished.');}
    for(const timer of state.timers){const left=C.remaining(timer),el=$(`[data-timer-id="${timer.id}"] [data-timer-clock]`);if(el)el.textContent=C.clock(left);if(timer.end!==null&&left===0)update(s=>{const t=s.timers.find(x=>x.id===timer.id);if(t){t.remaining=0;t.end=null;}},timer.name+' timer has finished.').then(renderTimers);}
    const detail=$('[data-app="cook"] .g-app-detail');if(detail&&!visitor&&state.timer.end!==null)detail.textContent='Timer running · '+C.clock(left);
  }
  async function init(){
    if($('#guild-app')===root&&root?.isConnected)return;
    root=$('#guild-app');if(!root)return;const run=++generation;ready=false;
    try{if(!db)db=await database();const saved=await load();if(saved?.version===1)state={...C.fresh(),...saved};}catch{db=null;}
    if(run!==generation||!root?.isConnected)return;
    ready=true;visitor=false;arrange=false;
    if(!db)$('#g-local-note').textContent='Browser storage is unavailable. Changes are temporary; download a backup before leaving.';
    render();clearInterval(interval);interval=setInterval(tick,1000);
    root.onclick=async e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.app&&!visitor)({time:timeApp,shop:shopApp,prep:prepApp,cook:cookApp,serve:()=>momentForm(null,'dish')})[b.dataset.app]();
      if(b.id==='g-edit')editProfile();if(b.id==='g-add'||b.hasAttribute('data-first-moment'))momentForm();
      if(b.id==='g-view'){visitor=!visitor;arrange=false;b.textContent=visitor?'Back to my kitchen':'Preview visitor view';b.setAttribute('aria-pressed',String(visitor));$('#g-arrange').setAttribute('aria-pressed','false');$('#g-arrange').textContent='Arrange board';render();notice(visitor?'Visitor preview: drafts and private kitchen details are hidden. This is not a public link.':'Back in your kitchen.');}
      if(b.id==='g-arrange'){arrange=!arrange;b.setAttribute('aria-pressed',String(arrange));b.textContent=arrange?'Done arranging':'Arrange board';render();}
      const id=b.closest('[data-id]')?.dataset.id,moment=state.moments.find(x=>x.id===id);
      if(moment&&!visitor){
        if(b.dataset.react)await update(s=>{const item=s.moments.find(x=>x.id===id);item.reaction=item.reaction===b.dataset.react?null:b.dataset.react;},'Reaction saved locally for this preview.');
        if(b.dataset.move)await update(s=>{s.moments=C.moveMoment(s.moments,id,Number(b.dataset.move));});
        if(b.hasAttribute('data-edit-moment'))momentForm(moment,moment.kind);
        if(b.hasAttribute('data-delete-moment')){open('delete','Remove this moment?',`<p>Remove “${esc(moment.title)}” from this browser’s moodboard?</p><div class="g-controls"><button class="g-secondary" type="button" id="g-keep">Keep it</button><button class="button" type="button" id="g-remove-confirm">Remove moment</button></div>`);$('#g-keep').onclick=close;$('#g-remove-confirm').onclick=async()=>{if(await update(s=>{s.moments=s.moments.filter(x=>x.id!==id);},'Moment removed.'))close();};}
      }
      if(b.classList.contains('g-close'))close();
      if(b.id==='g-export'){await queue;const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='golden-alchemy-guild-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Backup downloaded. It contains your local profile, photos, and kitchen notes.');}
    };
    $('#g-dialog').addEventListener('close',()=>{active=null;opener?.isConnected&&opener.focus();});
  }
  document.addEventListener('ga:preview-open',init);
  document.addEventListener('ga:preview-lock',()=>{generation++;ready=false;clearInterval(interval);close();root=null;});
  init();
})();
