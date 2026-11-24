create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  telefone text,
  empresa text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catalogo_itens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  descricao text not null,
  preco_unitario numeric(12, 2) not null check (preco_unitario >= 0),
  unidade text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  cliente_nome text not null,
  cliente_email text,
  cliente_telefone text,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'enviado', 'aprovado', 'recusado')),
  validade_dias integer not null default 15
    check (validade_dias between 1 and 90),
  observacoes text,
  total numeric(12, 2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.orcamento_itens (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos (id) on delete cascade,
  descricao text not null,
  quantidade numeric(12, 2) not null check (quantidade > 0),
  preco_unitario numeric(12, 2) not null check (preco_unitario >= 0),
  subtotal numeric(12, 2) generated always as (quantidade * preco_unitario) stored,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.catalogo_itens enable row level security;
alter table public.catalogo_itens force row level security;
alter table public.orcamentos enable row level security;
alter table public.orcamentos force row level security;
alter table public.orcamento_itens enable row level security;
alter table public.orcamento_itens force row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

create policy "catalogo_itens_select_own"
  on public.catalogo_itens for select
  to authenticated
  using ((select auth.uid()) = user_id and deleted_at is null);

create policy "catalogo_itens_insert_own"
  on public.catalogo_itens for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "catalogo_itens_update_own"
  on public.catalogo_itens for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "catalogo_itens_delete_own"
  on public.catalogo_itens for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "orcamentos_select_own"
  on public.orcamentos for select
  to authenticated
  using ((select auth.uid()) = user_id and deleted_at is null);

create policy "orcamentos_insert_own"
  on public.orcamentos for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "orcamentos_update_own"
  on public.orcamentos for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "orcamentos_delete_own"
  on public.orcamentos for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "orcamento_itens_select_own"
  on public.orcamento_itens for select
  to authenticated
  using (
    exists (
      select 1
      from public.orcamentos o
      where o.id = orcamento_id
        and o.user_id = (select auth.uid())
        and o.deleted_at is null
    )
  );

create policy "orcamento_itens_insert_own"
  on public.orcamento_itens for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.orcamentos o
      where o.id = orcamento_id
        and o.user_id = (select auth.uid())
    )
  );

create policy "orcamento_itens_update_own"
  on public.orcamento_itens for update
  to authenticated
  using (
    exists (
      select 1
      from public.orcamentos o
      where o.id = orcamento_id
        and o.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.orcamentos o
      where o.id = orcamento_id
        and o.user_id = (select auth.uid())
    )
  );

create policy "orcamento_itens_delete_own"
  on public.orcamento_itens for delete
  to authenticated
  using (
    exists (
      select 1
      from public.orcamentos o
      where o.id = orcamento_id
        and o.user_id = (select auth.uid())
    )
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create trigger catalogo_itens_set_updated_at
  before update on public.catalogo_itens
  for each row
  execute function public.set_updated_at();

create trigger orcamentos_set_updated_at
  before update on public.orcamentos
  for each row
  execute function public.set_updated_at();

create or replace function public.soft_delete_catalogo_item(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.catalogo_itens
  set deleted_at = coalesce(deleted_at, now())
  where id = p_id
    and user_id = (select auth.uid());

  if not found then
    raise exception 'Item de catalogo nao encontrado' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.soft_delete_orcamento(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orcamentos
  set deleted_at = coalesce(deleted_at, now())
  where id = p_id
    and user_id = (select auth.uid());

  if not found then
    raise exception 'Orcamento nao encontrado' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.soft_delete_catalogo_item(uuid) from public;
revoke all on function public.soft_delete_orcamento(uuid) from public;
grant execute on function public.soft_delete_catalogo_item(uuid) to authenticated, service_role;
grant execute on function public.soft_delete_orcamento(uuid) to authenticated, service_role;
