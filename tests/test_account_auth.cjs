// Exercise auth events against a fake SDK. Never creates users or sends email.
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../docs/assets/account.js'),'utf8');

async function setup({signup=true,google=false,query='',otpError=null,otpResponse=null}={}){
  const nodes=new Map(),requests=[],ticks=[];
  const element=id=>{if(!nodes.has(id))nodes.set(id,{value:'',hidden:id==='#google-signin',disabled:false,textContent:'',dataset:{},classList:{toggle(){}},events:{},addEventListener(name,fn){this.events[name]=fn;},querySelectorAll(){return [];},setAttribute(){},reset(){},reportValidity(){return true;}});return nodes.get(id);};
  const modes=['signin','signup'].map(mode=>Object.assign(element(mode),{dataset:{authMode:mode}}));
  const config={project:'golden-alchemy',projectRef:'fnjsbsoavsjnftbmmbtr',supabaseUrl:'https://fnjsbsoavsjnftbmmbtr.supabase.co',publishableKey:'sb_publishable_test',authEnabled:true,signupEnabled:signup};
  const auth={onAuthStateChange(){},getSession:async()=>({data:{session:null},error:null}),signInWithOtp:async data=>{requests.push({type:'email',data:JSON.parse(JSON.stringify(data))});return otpResponse||{error:otpError};},signInWithOAuth:async data=>{requests.push({type:'google',data:JSON.parse(JSON.stringify(data))});return {error:null};}};
  const env={document:{querySelector:element,querySelectorAll:()=>modes},window:{supabase:{createClient:()=>({auth})}},location:{search:query,hash:''},history:{replaceState(){}},URLSearchParams,AbortSignal,setInterval:fn=>{ticks.push(fn);return 1;},setTimeout,fetch:async url=>({ok:true,json:async()=>url==='/data/backend.json'?config:{external:{google}}})};
  vm.runInNewContext(source,env);await new Promise(setImmediate);
  return {element,requests,ticks,submit:()=>element('#magic-form').events.submit({preventDefault(){},currentTarget:element('#magic-form')})};
}

test('email sign-in uses the verified callback, no password, and prevents rapid duplicate sends',async()=>{
  const app=await setup();app.element('#magic-email').value=' chef@example.com ';
  await app.submit();await app.submit();assert.equal(app.requests.length,1);
  assert.deepEqual(app.requests[0],{type:'email',data:{email:'chef@example.com',options:{emailRedirectTo:'https://www.goldenalchemy.net/account/',shouldCreateUser:true}}});
  assert.equal(app.element('#magic-submit').disabled,true);
  assert.match(app.element('#magic-result').textContent,/If this address can sign in/);
});
test('existing-account-only mode cannot silently create a new account',async()=>{
  const app=await setup({signup:false});app.element('#magic-email').value='chef@example.com';await app.submit();
  assert.equal(app.requests[0].data.options.shouldCreateUser,false);
  assert.match(app.element('#magic-help').textContent,/existing accounts/);
});
test('a slow email request cannot be duplicated before it completes',async()=>{
  let complete;const response=new Promise(resolve=>{complete=resolve;});
  const app=await setup({otpResponse:response}),first=app.submit();await app.submit();
  assert.equal(app.requests.length,1);assert.equal(app.element('#magic-submit').disabled,true);
  complete({error:null});await first;
});
test('Google is hidden until enabled and never starts OAuth during page load',async()=>{
  const off=await setup();assert.equal(off.element('#google-signin').hidden,true);assert.equal(off.requests.length,0);
  const on=await setup({google:true});assert.equal(on.element('#google-signin').hidden,false);assert.equal(on.requests.length,0);
  await on.element('#google-signin').events.click();
  assert.deepEqual(on.requests[0],{type:'google',data:{provider:'google',options:{redirectTo:'https://www.goldenalchemy.net/account/'}}});
});
test('email failures restore the form; rate limits hold retries',async()=>{
  const failed=await setup({otpError:{status:500}});await failed.submit();assert.equal(failed.element('#magic-submit').disabled,false);
  const limited=await setup({otpError:{status:429}});await limited.submit();await limited.submit();assert.equal(limited.requests.length,1);assert.equal(limited.element('#magic-submit').disabled,true);
});
test('expired callback gives a retry path without reflecting provider error text',async()=>{
  const app=await setup({query:'?error=access_denied&error_description=untrusted_message'});
  assert.match(app.element('#account-status').textContent,/Request a new link/);
  assert.doesNotMatch(app.element('#account-status').textContent,/untrusted_message/);
});

