export const STATUS_ORCAMENTO = [
  "rascunho",
  "enviado",
  "aprovado",
  "recusado",
] as const;

export type StatusOrcamento = (typeof STATUS_ORCAMENTO)[number];

export type Profile = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  empresa: string | null;
  chave_pix: string | null;
  logo_url: string | null;
  onboarding_done: boolean;
  oficio: string | null;
  created_at: string;
  updated_at: string;
};

export type CatalogoItem = {
  id: string;
  user_id: string;
  descricao: string;
  preco_unitario: number;
  unidade: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Orcamento = {
  id: string;
  user_id: string;
  cliente_nome: string;
  cliente_email: string | null;
  cliente_telefone: string | null;
  status: StatusOrcamento;
  validade_dias: number;
  observacoes: string | null;
  total: number;
  created_at: string;
  updated_at: string;
  respondido_em: string | null;
  enviado_em: string | null;
  deleted_at: string | null;
};

export type OrcamentoItem = {
  id: string;
  orcamento_id: string;
  descricao: string;
  unidade: string | null;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  created_at: string;
};
