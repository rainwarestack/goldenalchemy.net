(() => {
  'use strict';
  const $=s=>document.querySelector(s), status=$('#account-status'); if(!status) return;
  let client, config, mode='signin', currentUser=null, profileExists=false, recovering=false;
  const origin='https://www.goldenalchemy.net';
  const notify=(text,error=false)=>{status.textContent=text;status.classList.toggle('error',error);};
  const views=(name)=>['auth','profile','recovery'].forEach(v=>{$(`#${v}-view`).hidden=v!==name;});
  const busy=(form,on)=>form.querySelectorAll('button').forEach(b=>{b.disabled=on;});
  function usernamePreview(){const name=$('#chef-username').value.trim();$('#username-preview').textContent=name?'Your username: @chef'+name:'Your username will start with @chef.';}
  $('#chef-username').addEventListener('input',usernamePreview);
  let magicRetryAt=0,magicPending=false;
  function magicCooldown(){const left=Math.max(0,Math.ceil((magicRetryAt-Date.now())/1000)),button=$('#magic-submit');button.disabled=magicPending||left>0;button.textContent=magicPending?'Requesting your link…':left>0?`Send another link in ${left}s`:'Email me a sign-in link';}
  $('#magic-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!client||magicPending||Date.now()<magicRetryAt)return;
    magicPending=true;magicCooldown();$('#magic-result').textContent='Requesting your sign-in link…';
    try{
      const {error}=await client.auth.signInWithOtp({email:$('#magic-email').value.trim(),options:{emailRedirectTo:origin+'/account/',shouldCreateUser:config.signupEnabled===true}});
      if(error){$('#magic-result').textContent=error.status===429?'Please wait before requesting another link.':'We could not request a sign-in link. Check the address and try again.';if(error.status===429)magicRetryAt=Date.now()+60000;return;}
      magicRetryAt=Date.now()+60000;
      $('#magic-result').textContent='If this address can sign in, an email is on its way. Open the newest link in this browser. Check your spam folder too.';
    }catch{$('#magic-result').textContent='The email service could not be reached. Please try again.';}finally{magicPending=false;magicCooldown();}
  });
  setInterval(()=>{if(magicRetryAt)magicCooldown();},1000);
  $('#google-signin').addEventListener('click',async()=>{
    if(!client)return;const button=$('#google-signin');button.disabled=true;notify('Opening Google sign-in…');
    try{const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:origin+'/account/'}});if(error){notify('Google sign-in could not start. Use an email sign-in link or try again later.',true);button.disabled=false;}}catch{notify('Google sign-in could not be reached. Use an email sign-in link instead.',true);button.disabled=false;}
  });
  async function checkGoogleProvider(){
    try{const response=await fetch(config.supabaseUrl+'/auth/v1/settings',{headers:{apikey:config.publishableKey},signal:AbortSignal.timeout(6000)});if(!response.ok)return;const settings=await response.json();$('#google-signin').hidden=settings.external?.google!==true;}catch{/* Email sign-in remains available if provider discovery is unavailable. */}
  }
  function modeView(next){
    mode=next; views('auth'); $('#account-password').value='';
    document.querySelectorAll('[data-auth-mode]').forEach(b=>{const active=b.dataset.authMode===next;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    $('#auth-title').textContent=next==='signup'?'Start your chef account.':'Welcome to the kitchen.';
    $('#auth-submit').textContent=next==='signup'?'Create account →':'Sign in →';
    $('#account-password').autocomplete=next==='signup'?'new-password':'current-password';
    $('#auth-help').textContent=next==='signup'?'Confirm your email before signing in. Creating an account does not activate a Guild membership.':'Use your Golden Alchemy account email and password.';
    $('#forgot-password').hidden=next==='signup';
  }
  async function refreshProfile(session){
    currentUser=session?.user||null;
    if(!currentUser){profileExists=false;modeView('signin');return;}
    views('profile'); notify('Signed in. Your chef profile is private to your account.');
    const [profile,membership]=await Promise.all([
      client.from('ga_profiles').select('username,display_name,biography,specialty').eq('user_id',currentUser.id).maybeSingle(),
      client.rpc('ga_is_guild_member')
    ]);
    if(profile.error||membership.error){notify('We could not load your profile. Try signing in again; no changes have been saved.',true);return;}
    profileExists=!!profile.data;
    $('#chef-username').value=(profile.data?.username||'').replace(/^chef/i,'');usernamePreview();$('#chef-name').value=profile.data?.display_name||'';
    $('#chef-specialty').value=profile.data?.specialty||'';$('#chef-biography').value=profile.data?.biography||'';
    $('#membership-status').textContent=membership.data===true?'Your membership is active. Community features are still being prepared.':'No active Guild membership. Membership plans and community features are coming later.';
    if(!profileExists)notify('Your account is ready. Choose a chef username to create your private profile.');
  }
  document.querySelectorAll('[data-auth-mode]').forEach(button=>button.addEventListener('click',()=>{
    if(button.dataset.authMode==='signup'&&!config?.signupEnabled){notify('New account registration is not open yet. Email delivery is being verified.');return;}
    modeView(button.dataset.authMode);notify(mode==='signup'?'Choose a password of at least 8 characters, or use an email link above.':'Sign in with your password, or use an email link above.');
  }));
  $('#auth-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!client)return; const form=e.currentTarget;busy(form,true);
    const email=$('#account-email').value.trim(),password=$('#account-password').value;
    try{
      const result=mode==='signup'&&config.signupEnabled
        ?await client.auth.signUp({email,password,options:{emailRedirectTo:origin+'/account/'}})
        :await client.auth.signInWithPassword({email,password});
      $('#account-password').value='';
      if(result.error){notify(mode==='signup'?'We could not create this account. Check your details or try signing in if you already registered.':'Sign-in failed. Check your email and password, and confirm your email if needed.',true);return;}
      if(mode==='signup'&&!result.data.session){notify('Check your inbox for a confirmation email. After confirming, return here to sign in.');return;}
      await refreshProfile(result.data.session);
    }catch{notify('The account service could not be reached. Please try again.',true);}finally{busy(form,false);}
  });
  $('#forgot-password').addEventListener('click',async()=>{
    const input=$('#account-email');if(!input.reportValidity())return;
    if(!config?.signupEnabled){notify('Password-recovery email is not open until email delivery is verified.');return;}
    const button=$('#forgot-password');button.disabled=true;
    try{const {error}=await client.auth.resetPasswordForEmail(input.value.trim(),{redirectTo:origin+'/account/?mode=recovery'});notify(error?'We could not request a reset. Please try later.':'If an account matches this email, you will receive password-reset instructions.',!!error);}catch{notify('The email service could not be reached. Please try later.',true);}finally{button.disabled=false;}
  });
  $('#recovery-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!client)return; const form=e.currentTarget;busy(form,true);
    try{const {error}=await client.auth.updateUser({password:$('#new-password').value});$('#new-password').value='';if(error){notify('The password could not be updated. Request a new recovery link and try again.',true);return;}recovering=false;history.replaceState(null,'','/account/');const {data}=await client.auth.getSession();await refreshProfile(data.session);notify('Your password has been updated.');}catch{notify('The password could not be updated. Please try again.',true);}finally{busy(form,false);}
  });
  $('#profile-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!client||!currentUser)return;
    const name=$('#chef-username').value.trim();if(!/^[a-z0-9_]{1,20}$/i.test(name)){notify('Enter 1–20 letters, numbers, or underscores. We add chef automatically.',true);return;}
    const username='chef'+name;
    const form=e.currentTarget;busy(form,true);
    const values={username,display_name:$('#chef-name').value.trim(),specialty:$('#chef-specialty').value.trim(),biography:$('#chef-biography').value.trim()};
    try{
      const query=profileExists?client.from('ga_profiles').update(values).eq('user_id',currentUser.id):client.from('ga_profiles').insert({...values,user_id:currentUser.id});
      const {error,data}=await query.select('user_id').single();
      if(error||!data){notify(error?.code==='23505'?'That chef username is already taken. Choose another.':'Your profile could not be saved. Check the fields and try again.',true);return;}
      profileExists=true;notify('Your chef profile is saved. It remains private to your account.');
    }catch{notify('The profile service could not be reached. Please try again.',true);}finally{busy(form,false);}
  });
  $('#signout').addEventListener('click',async()=>{
    if(!client)return;try{const {error}=await client.auth.signOut();if(error){notify('Sign-out could not finish. Please try again.',true);return;}
    currentUser=null;profileExists=false;$('#profile-form').reset();modeView('signin');notify('You are signed out.');}catch{notify('Sign-out could not finish. Please try again.',true);}
  });
  async function init(){
    try{
      const response=await fetch('/data/backend.json',{cache:'no-cache'});if(!response.ok)throw new Error('No config');config=await response.json();
      if(config.project!=='golden-alchemy'||config.projectRef!=='fnjsbsoavsjnftbmmbtr'||config.supabaseUrl!=='https://fnjsbsoavsjnftbmmbtr.supabase.co'||!config.publishableKey?.startsWith('sb_publishable_'))throw new Error('Unexpected project');
      if(!config.authEnabled){notify('Account connection is being prepared. Registration will open after email delivery is verified.');return;}
      $('#magic-help').textContent=config.signupEnabled===true?'New here? Your first sign-in creates your account. Open the email link in the same browser.':'For existing accounts. Open the email link in the same browser.';
      if(!window.supabase?.createClient)throw new Error('SDK unavailable');
      client=window.supabase.createClient(config.supabaseUrl,config.publishableKey,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      recovering=new URLSearchParams(location.search).get('mode')==='recovery';
      client.auth.onAuthStateChange((event,session)=>{
        if(event==='PASSWORD_RECOVERY'){recovering=true;views('recovery');notify('Enter a new password for your account.');}
        else if(event==='SIGNED_OUT'){currentUser=null;profileExists=false;modeView('signin');}
        else if(event==='SIGNED_IN'&&!recovering){setTimeout(()=>refreshProfile(session).catch(()=>notify('Your profile could not be loaded.',true)),0);}
      });
      const callbackQuery=new URLSearchParams(location.search),callbackHash=new URLSearchParams(location.hash.slice(1));
      const callbackError=callbackQuery.has('error')||callbackQuery.has('error_code')||callbackHash.has('error')||callbackHash.has('error_code');
      const hasCallback=callbackQuery.has('code')||callbackHash.has('access_token')||callbackError;
      const {data,error}=await client.auth.getSession();if(error)throw error;
      if(recovering){if(data.session){currentUser=data.session.user;views('recovery');notify('Enter a new password for your account.');}else{views('auth');notify('This recovery link is invalid or has expired. Request another reset email.',true);}}
      else{await refreshProfile(data.session);if(!data.session)notify(hasCallback?'This sign-in link could not be used. It may have expired or been opened in another browser. Request a new link below.':'Enter your email for a password-free sign-in link.',hasCallback);}
      if(hasCallback)history.replaceState(null,'','/account/'+(recovering?'?mode=recovery':''));
      checkGoogleProvider();
    }catch{notify('Account services are temporarily unavailable. Please try again later.',true);}
  }
  init();
})();
