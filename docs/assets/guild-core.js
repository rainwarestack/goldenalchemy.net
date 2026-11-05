/* Pure cooking-session operations shared by the browser and regression checks. */
(() => {
  'use strict';
  const fresh = () => ({version:1,profile:{name:'Rain',bio:'Your kitchen. Your rhythm. Your little alchemy.',specialty:'',avatar:null,banner:null},meal:{name:'',servings:2,available:45,serveAt:'19:00',prepMinutes:10,cookMinutes:25,plateMinutes:10,ingredients:[],prep:[],steps:[],step:0},timer:{duration:1500,remaining:1500,end:null},timers:[],moments:[]});
  const remaining = (timer,now=Date.now()) => timer.end===null ? timer.remaining : Math.max(0,Math.ceil((timer.end-now)/1000));
  const clock = seconds => {const n=Math.max(0,Math.floor(seconds));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
  function changeTimer(timer,action,now=Date.now()) {
    const t={...timer},left=remaining(t,now);
    if(action==='start'&&left>0)t.end=now+left*1000;
    if(action==='pause'){t.remaining=left;t.end=null;}
    if(action==='reset'){t.remaining=t.duration;t.end=null;}
    if(action==='add'){t.remaining=left+60;t.end=t.end===null?null:now+t.remaining*1000;}
    return t;
  }
  function moveMoment(items,id,direction) {const result=[...items],from=result.findIndex(x=>x.id===id),to=from+direction;if(from>=0&&to>=0&&to<result.length)[result[from],result[to]]=[result[to],result[from]];return result;}
  function plan(meal,now=new Date()) {const [h,m]=meal.serveAt.split(':').map(Number),serve=new Date(now);serve.setHours(h,m,0,0);if(serve<=now)serve.setDate(serve.getDate()+1);const total=meal.prepMinutes+meal.cookMinutes+meal.plateMinutes;return {total,start:new Date(serve.getTime()-total*60000),serve,fits:total<=meal.available};}
  const api={fresh,remaining,clock,changeTimer,moveMoment,plan};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else window.GuildCore=api;
})();
