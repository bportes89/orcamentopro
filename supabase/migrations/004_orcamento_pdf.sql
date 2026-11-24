alter table public.orcamentos
  add column enviado_em timestamptz;

alter table public.orcamento_itens
  add column unidade text;
