-- Golden Alchemy database-only security test. All fixture rows are rolled back.
-- Run as the SQL Editor's postgres role in the verified Golden Alchemy project.
begin;
insert into auth.users (id, email) values
  ('01a10000-0000-4000-8000-000000000001', 'ga-security-a@example.invalid'),
  ('01a10000-0000-4000-8000-000000000002', 'ga-security-b@example.invalid');
insert into public.ga_profiles (user_id, username) values
  ('01a10000-0000-4000-8000-000000000001', 'chefSecurityA'),
  ('01a10000-0000-4000-8000-000000000002', 'chefSecurityB');

set local role authenticated;
select set_config('request.jwt.claim.sub', '01a10000-0000-4000-8000-000000000001', true);
do $$
begin
  if (select count(*) from public.ga_profiles) <> 1 then
    raise exception 'FAIL: profile isolation';
  end if;
  update public.ga_profiles set biography = 'ROLLBACK TEST' where user_id = auth.uid();
  if not exists (select 1 from public.ga_profiles where biography = 'ROLLBACK TEST') then
    raise exception 'FAIL: owner profile update';
  end if;
  update public.ga_profiles set biography = 'NOT ALLOWED'
    where user_id = '01a10000-0000-4000-8000-000000000002';
  if found then raise exception 'FAIL: edited another profile'; end if;
  if public.ga_is_guild_member() then raise exception 'FAIL: signup granted membership'; end if;
  begin
    insert into public.ga_memberships (user_id, status) values (auth.uid(), 'active');
    raise exception 'FAIL: member self-grant';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.ga_profiles set user_id = '01a10000-0000-4000-8000-000000000002';
    raise exception 'FAIL: mutable account ID';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.ga_profiles set username = 'CHEFsecurityb' where user_id = auth.uid();
    raise exception 'FAIL: case-insensitive username uniqueness';
  exception when unique_violation then null;
  end;
  begin
    update public.ga_profiles set username = 'not_a_chef' where user_id = auth.uid();
    raise exception 'FAIL: username prefix';
  exception when check_violation then null;
  end;
end;
$$;

reset role;
insert into public.ga_memberships (user_id, status) values
  ('01a10000-0000-4000-8000-000000000001', 'active');
set local role authenticated;
do $$
begin
  if not public.ga_is_guild_member() then raise exception 'FAIL: admin-granted membership'; end if;
  begin
    update public.ga_memberships set status = 'active', tier = 'owner' where user_id = auth.uid();
    raise exception 'FAIL: membership edit privilege';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role anon;
do $$
begin
  begin
    perform * from public.ga_profiles;
    raise exception 'FAIL: anonymous profile access';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.ga_is_guild_member();
    raise exception 'FAIL: anonymous membership access';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
select 'PASS: profile isolation, owner edit, immutable account ID, unique chef handles, admin-only membership, anonymous denial; fixtures rolled back' as security_checks;
