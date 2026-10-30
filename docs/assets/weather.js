(() => {
  'use strict';
  const citySelect = document.querySelector('#weather-city'); if (!citySelect) return;
  const mount = document.querySelector('#weather-results'), state = document.querySelector('#weather-state'), dates = document.querySelector('#weather-dates');
  let cities = [], unit = 'F';
  const allowedCities = ['new-york','albany','buffalo'];
  function node(tag,text,className) { const el=document.createElement(tag); if(text) el.textContent=text; if(className) el.className=className; return el; }
  function date(raw) { const d=new Date(raw||''); return Number.isNaN(d.getTime())?'Not supplied':d.toLocaleString([],{dateStyle:'medium',timeStyle:'short'}); }
  function message(title,text,retry=false) {
    mount.replaceChildren(); const box=node('div','','empty-state'); box.append(node('h3',title),node('p',text));
    if(retry) { const button=node('button','Try again','retry'); button.addEventListener('click',load); box.append(button); } mount.append(box);
  }
  function render() {
    const city=cities.find(c=>c.id===citySelect.value);
    mount.replaceChildren(); dates.textContent='';
    const periods=city?.periods?.filter(p=>Number.isFinite(p.temperature)&&p.temperatureUnit==='F'&&Date.parse(p.endTime)>Date.now()).slice(0,3)||[];
    if(!city||city.status==='unavailable'||!periods.length) { state.textContent='FORECAST UNAVAILABLE'; message('A pause in the forecast.','The latest forecast for this city is unavailable. Check the National Weather Service using the source link below.',true); return; }
    const stale=city.status==='stale'||!Number.isFinite(Date.parse(city.updatedAt))||Date.now()-Date.parse(city.updatedAt)>21600000;
    state.textContent=stale?'UPDATES DELAYED':'NWS FORECAST'; state.classList.toggle('feed-warning',stale);
    const list=node('ol','','weather-periods');
    periods.forEach(p=>{
      const li=node('li');
      const temp=unit==='F'?p.temperature:Math.round((p.temperature-32)*5/9);
      li.append(node('span',p.name||'Forecast period','weather-period-name'),node('strong',`${temp}°${unit}`,'weather-temp'),node('span',p.shortForecast||'See NWS forecast','weather-condition'));
      if(p.windSpeed) li.append(node('span',`Wind ${p.windSpeed} ${p.windDirection||''}`,'weather-wind'));
      const details=node('details'),summary=node('summary','Forecast details'); details.append(summary,node('p',p.detailedForecast||p.shortForecast||'No further details supplied.'));
      const start=new Date(p.startTime); if(!Number.isNaN(start.getTime())) details.append(node('p',`Period starts ${date(p.startTime)}`));
      li.append(details); list.append(li);
    });
    mount.append(list); dates.textContent=`NWS issued: ${date(city.sourceUpdatedAt)} · Retrieved: ${date(city.updatedAt)}${stale?' · Showing the last available forecast.':''}`;
    const link=document.querySelector('#weather-source');
    try { const u=new URL(city.sourceUrl); if(u.protocol==='https:'&&u.hostname==='forecast.weather.gov') link.href=u.href; } catch {}
  }
  async function load() {
    state.textContent='LOADING'; state.classList.remove('feed-warning'); dates.textContent='';
    mount.replaceChildren(node('div','','skeleton'));
    try {
      const response=await fetch('/data/weather.json',{cache:'no-cache',signal:AbortSignal.timeout(12000)});
      if(!response.ok) throw new Error('Unavailable'); const feed=await response.json();
      if(feed.source!=='NWS'||!Array.isArray(feed.cities)) throw new Error('Invalid feed');
      cities=feed.cities.filter(c=>allowedCities.includes(c.id)&&Array.isArray(c.periods)); render();
    } catch { cities=[]; state.textContent='FORECAST UNAVAILABLE'; message('The weather feed is taking a moment.','Check the National Weather Service using the source link below.',true); }
  }
  citySelect.addEventListener('change',render);
  document.querySelectorAll('[data-weather-unit]').forEach(button=>button.addEventListener('click',()=>{
    unit=button.dataset.weatherUnit; document.querySelectorAll('[data-weather-unit]').forEach(b=>{b.setAttribute('aria-pressed',String(b===button)); b.classList.toggle('active',b===button);}); render();
  }));
  load();
})();
