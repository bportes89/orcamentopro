insert into public.profiles (id, nome, email, telefone, empresa)
values (
  '11111111-1111-4111-8111-111111111111',
  'Eletricista Demo',
  'demo@orcamentopro.app',
  '(11) 99999-0000',
  'Demo Elétrica'
)
on conflict (id) do nothing;

insert into public.catalogo_itens (id, user_id, descricao, preco_unitario, unidade)
values
  (
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111111',
    'Ponto de tomada',
    85.00,
    'un'
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111111',
    'Troca de disjuntor',
    120.00,
    'un'
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    '11111111-1111-4111-8111-111111111111',
    'Metro de fio 2,5mm',
    4.50,
    'm'
  ),
  (
    '22222222-2222-4222-8222-222222222204',
    '11111111-1111-4111-8111-111111111111',
    'Instalação de luminária',
    90.00,
    'un'
  ),
  (
    '22222222-2222-4222-8222-222222222205',
    '11111111-1111-4111-8111-111111111111',
    'Quadro de distribuição monofásico',
    350.00,
    'un'
  )
on conflict (id) do nothing;
