const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../docs/assets/guild-core.js');

test('timer uses wall time across delayed callbacks and reloads',()=>{
  const started=C.changeTimer({duration:120,remaining:120,end:null},'start',1000);
  assert.equal(C.remaining(JSON.parse(JSON.stringify(started)),61000),60);
  assert.equal(C.remaining(started,999999),0);
  const paused=C.changeTimer(started,'pause',31000);
  assert.equal(C.remaining(paused,999999),90);
  assert.equal(paused.end,null);
  assert.equal(C.changeTimer(paused,'reset').remaining,120);
});
test('adding time preserves running versus paused status',()=>{
  const running={duration:120,remaining:120,end:121000};
  assert.equal(C.remaining(C.changeTimer(running,'add',31000),31000),150);
  const paused=C.changeTimer({duration:120,remaining:12,end:null},'add',31000);
  assert.equal(paused.end,null);assert.equal(paused.remaining,72);
});
test('reorder cannot wrap or change the original board',()=>{
  const items=[{id:'a'},{id:'b'},{id:'c'}];
  assert.deepEqual(C.moveMoment(items,'a',-1),items);
  assert.deepEqual(C.moveMoment(items,'c',1),items);
  assert.deepEqual(C.moveMoment(items,'b',-1).map(x=>x.id),['b','a','c']);
  assert.deepEqual(items.map(x=>x.id),['a','b','c']);
});
test('meal plan rolls a past serving time into tomorrow and flags excess duration',()=>{
  const meal={...C.fresh().meal,serveAt:'19:00',available:30};
  const p=C.plan(meal,new Date(2026,10,5,20,0));
  assert.equal(p.serve.getDate(),6);assert.equal(p.start.getHours(),18);
  assert.equal(p.start.getMinutes(),15);assert.equal(p.fits,false);
  assert.equal(p.total,45);
});
