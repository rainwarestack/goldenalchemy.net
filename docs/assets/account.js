(() => {
  'use strict';
  const $=s=>document.querySelector(s), status=$('#account-status'); if(!status) return;
  let client, config, mode='signin', currentUser=null, profileExists=false, recovering=false;
  const origin='https://www.goldenalchemy.net';
  const notify=(text,error=false)=>{status.textContent=text;status.classList.toggle('error',error);};
  const views=(name)=>['auth','profile','recovery'].forEach(v=>{$(`#${v}-view`).hidden=v!==name;});
  const busy=(form,on)=>form.querySelectorAll('button').forEach(b=>{b.disabled=on;});
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
    $('#chef-username').value=profile.data?.username||'';$('#chef-name').value=profile.data?.display_name||'';
    $('#chef-specialty').value=profile.data?.specialty||'';$('#chef-biography').value=profile.data?.biography||'';
    $('#membership-status').textContent=membership.data===true?'Your membership is active. Community features are still being prepared.':'No active Guild membership. Membership plans and community features are coming later.';
    if(!profileExists)notify('Your account is ready. Choose a chef username to create your private profile.');
  }
  document.querySelectorAll('[data-auth-mode]').forEach(button=>button.addEventListener('click',()=>{
    if(button.dataset.authMode==='signup'&&!config?.signupEnabled){notify('New account registration is not open yet. Email delivery is being verified.');return;}
    modeView(button.dataset.authMode);notify(mode==='signup'?'Choose a password of at least 8 characters.':'Sign in to your Golden Alchemy account.');
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
    const username=$('#chef-username').value.trim();if(!/^chef[a-z0-9_]{1,20}$/i.test(username)){notify('Use chef followed by letters, numbers, or underscores; 5–24 characters total.',true);return;}
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
      if(!window.supabase?.createClient)throw new Error('SDK unavailable');
      client=window.supabase.createClient(config.supabaseUrl,config.publishableKey,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      recovering=new URLSearchParams(location.search).get('mode')==='recovery';
      client.auth.onAuthStateChange((event,session)=>{
        if(event==='PASSWORD_RECOVERY'){recovering=true;views('recovery');notify('Enter a new password for your account.');}
        else if(event==='SIGNED_OUT'){currentUser=null;profileExists=false;modeView('signin');}
        else if(event==='SIGNED_IN'&&!recovering){setTimeout(()=>refreshProfile(session).catch(()=>notify('Your profile could not be loaded.',true)),0);}
      });
      const {data,error}=await client.auth.getSession();if(error)throw error;
      if(recovering){if(data.session){currentUser=data.session.user;views('recovery');notify('Enter a new password for your account.');}else{views('auth');notify('This recovery link is invalid or has expired. Request another reset email.',true);}}
      else{await refreshProfile(data.session);if(!data.session)notify('Sign in to your Golden Alchemy account.');}
      if(location.search.includes('code=')||location.hash.includes('access_token'))history.replaceState(null,'','/account/'+(recovering?'?mode=recovery':''));
    }catch{notify('Account services are temporarily unavailable. Please try again later.',true);}
  }
  init();
})();
