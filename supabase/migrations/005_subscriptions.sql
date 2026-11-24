create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'inactive'
    check (status in ('inactive', 'active', 'trialing', 'canceled', 'expired')),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  expires_at timestamptz,
  platform text,
  original_transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
alter table public.subscriptions force row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.subscriptions to authenticated;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create index if not exists orcamentos_user_created_idx
  on public.orcamentos (user_id, created_at desc)
  where deleted_at is null;

create or replace function public.pode_criar_orcamento(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assinatura_ativa boolean;
  v_criados_no_mes integer;
begin
  if (select auth.uid()) is null or (select auth.uid()) <> p_user_id then
    return false;
  end if;

  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = p_user_id
      and s.plan = 'pro'
      and s.status in ('active', 'trialing')
      and (s.expires_at is null or s.expires_at > now())
  ) into v_assinatura_ativa;

  if v_assinatura_ativa then
    return true;
  end if;

  select count(*)::integer
  into v_criados_no_mes
  from public.orcamentos o
  where o.user_id = p_user_id
    and o.deleted_at is null
    and o.created_at >= date_trunc('month', now())
    and o.created_at < date_trunc('month', now()) + interval '1 month';

  return v_criados_no_mes < 5;
end;
$$;

revoke all on function public.pode_criar_orcamento(uuid) from public;
grant execute on function public.pode_criar_orcamento(uuid) to authenticated, service_role;
