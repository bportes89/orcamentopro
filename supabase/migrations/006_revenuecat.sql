alter table public.subscriptions drop constraint if exists subscriptions_status_check;

alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('inactive', 'active', 'trialing', 'grace_period', 'billing_issue', 'canceled', 'expired'));

create table if not exists public.revenuecat_webhook_events (
  id text primary key,
  processed_at timestamptz not null default now()
);

alter table public.revenuecat_webhook_events enable row level security;
alter table public.revenuecat_webhook_events force row level security;

revoke all on table public.revenuecat_webhook_events from public, anon, authenticated;
grant all on table public.revenuecat_webhook_events to service_role;

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
      and s.status in ('active', 'trialing', 'grace_period', 'canceled')
      and (
        s.expires_at is null
        or s.expires_at > now()
      )
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
