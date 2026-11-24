import { z } from "zod";

import { parseBRLInput } from "@/lib/currency";
import { onlyDigits } from "@/lib/masks";
import { STATUS_ORCAMENTO } from "@/types";

export const perfilSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.email("E-mail inválido"),
  telefone: z.string().nullish(),
  empresa: z.string().nullish(),
});

export const orcamentoSchema = z.object({
  cliente_nome: z.string().min(2, "Nome do cliente deve ter no mínimo 2 caracteres"),
  cliente_email: z.email("E-mail inválido").nullish(),
  cliente_telefone: z.string().nullish(),
  validade_dias: z
    .number()
    .int("Validade deve ser um número inteiro")
    .min(1, "Validade mínima de 1 dia")
    .max(90, "Validade máxima de 90 dias"),
  status: z.enum(STATUS_ORCAMENTO).optional(),
  observacoes: z.string().nullish(),
});

export const itemSchema = z.object({
  descricao: z.string().min(2, "Descrição deve ter no mínimo 2 caracteres"),
  quantidade: z.number().positive("Quantidade deve ser maior que 0"),
  preco_unitario: z.number().min(0, "Preço não pode ser negativo"),
});

export const cadastroSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo"),
  email: z.email("Informe um e-mail válido"),
  telefone: z
    .string()
    .trim()
    .min(10, "Informe um telefone válido com DDD")
    .max(20, "Telefone inválido"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  senha: z.string().min(1, "Informe sua senha"),
});

export const recuperarSenhaSchema = z.object({
  email: z.email("Informe um e-mail válido"),
});

export const UNIDADES_CATALOGO = ["un", "h", "m", "m2", "m3"] as const;

export type UnidadeCatalogo = (typeof UNIDADES_CATALOGO)[number];

export const itemCatalogoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do item"),
  unidade: z.enum(UNIDADES_CATALOGO),
  preco: z
    .string()
    .trim()
    .min(1, "Informe o preço")
    .refine(
      (value) => parseBRLInput(value) > 0,
      "Informe um preço válido",
    ),
});

export const VALIDADES_ORCAMENTO = [7, 15, 30] as const;

export type ValidadeOrcamento = (typeof VALIDADES_ORCAMENTO)[number];

export const novoOrcamentoItemSchema = z.object({
  descricao: z.string().trim().min(2, "Descreva o item"),
  quantidade: z.number().positive("Quantidade deve ser maior que 0"),
  preco_unitario: z.number().min(0, "Preço não pode ser negativo"),
});

export const novoOrcamentoSchema = z.object({
  cliente_nome: z.string().trim().min(2, "Informe o nome do cliente"),
  cliente_telefone: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || onlyDigits(value).length >= 10,
      "Informe um telefone válido com DDD",
    ),
  validade_dias: z.union([z.literal(7), z.literal(15), z.literal(30)]),
  observacoes: z
    .string()
    .trim()
    .max(500, "Use no máximo 500 caracteres nas observações"),
  itens: z
    .array(novoOrcamentoItemSchema)
    .min(1, "Adicione pelo menos 1 item ao orçamento"),
});

export const perfilDadosSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome"),
  telefone: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || onlyDigits(value).length >= 10,
      "Informe um telefone válido com DDD",
    ),
  chave_pix: z
    .string()
    .trim()
    .max(140, "Chave Pix deve ter no máximo 140 caracteres"),
});

export type PerfilInput = z.infer<typeof perfilSchema>;
export type OrcamentoInput = z.infer<typeof orcamentoSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type CadastroInput = z.infer<typeof cadastroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RecuperarSenhaInput = z.infer<typeof recuperarSenhaSchema>;
export type PerfilDadosInput = z.infer<typeof perfilDadosSchema>;
export type ItemCatalogoInput = z.infer<typeof itemCatalogoSchema>;
export type NovoOrcamentoInput = z.infer<typeof novoOrcamentoSchema>;
export type NovoOrcamentoItemInput = z.infer<typeof novoOrcamentoItemSchema>;
