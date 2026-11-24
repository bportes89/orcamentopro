import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import { File, Paths } from "expo-file-system";

import { formatBRL } from "@/lib/currency";
import { calculateDueDate, formatDateBR } from "@/lib/date";
import type {
  LocalOrcamento,
  LocalOrcamentoItem,
} from "@/services/orcamentos";
import type { LocalProfile } from "@/services/profiles";
import { getProfileLogoDataUri } from "@/services/storage";

const APP_NAME_FALLBACK = "OrçamentoPro";
const APP_NAME = Constants.expoConfig?.name ?? APP_NAME_FALLBACK;

type ModuloPdf = typeof import("@flitzinteractive/react-native-nitro-html-pdf");

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (caractere) => ESCAPES[caractere]);
}

function formatQuantidade(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(2).replace(".", ",");
}

function textoLinhas(value: string): string {
  return escapeHtml(value).replace(/\r\n/g, "<br />").replace(/\r/g, "<br />").replace(/\n/g, "<br />");
}

function calcularSubtotal(item: LocalOrcamentoItem): number {
  return item.subtotal ?? item.quantidade * item.precoUnitario;
}

function pdfHeaderHtml(perfil: LocalProfile, logo: string | null): string {
  const nome = escapeHtml(perfil.nome.trim());
  const telefone = perfil.telefone?.trim() ?? "";
  const empresa = perfil.empresa?.trim() ?? "";

  return `<header class="pdf-header">
    <style>
      .pdf-header { display: flex; align-items: center; gap: 12px; height: 100%; padding: 0 32px; }
      .pdf-header img { width: 56px; height: 56px; border-radius: 14px; object-fit: contain; }
      .pdf-header-info { flex: 1; }
      .pdf-header-doc { font-size: 9px; font-weight: 700; letter-spacing: .08em; color: #94a3b8; text-transform: uppercase; }
      .pdf-header-nome { margin-top: 3px; font-size: 16px; font-weight: 700; color: #0f172a; }
      .pdf-header-telefone { margin-top: 3px; font-size: 11px; color: #475569; }
      .pdf-header-empresa { margin-top: 2px; font-size: 10px; color: #94a3b8; }
    </style>
    ${logo ? `<img src="${logo}" alt="" />` : ""}
    <div class="pdf-header-info">
      <div class="pdf-header-doc">Orçamento</div>
      <div class="pdf-header-nome">${nome}</div>
      ${telefone ? `<div class="pdf-header-telefone">${escapeHtml(telefone)}</div>` : ""}
      ${empresa ? `<div class="pdf-header-empresa">${escapeHtml(empresa)}</div>` : ""}
    </div>
  </header>`;
}

function pdfFooterHtml(perfil: LocalProfile): string {
  const pix = perfil.chavePix?.trim() || "Chave Pix não informada";

  return `<footer class="pdf-footer">
    <style>
      .pdf-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; height: 100%; padding: 0 32px; font-size: 10px; color: #475569; }
      .pdf-footer strong { display: block; font-size: 13px; color: #0f172a; }
      .pdf-footer-pix { overflow-wrap: anywhere; }
    </style>
    <div class="pdf-footer-item">
      <strong>PIX</strong>
      <div class="pdf-footer-pix">${escapeHtml(pix)}</div>
    </div>
    <div class="pdf-footer-item"><strong>${escapeHtml(APP_NAME)}</strong></div>
  </footer>`;
}

function nomeArquivoPdfOrcamento(
  orcamento: LocalOrcamento,
  perfil: LocalProfile,
): string {
  const criadoEm = new Date(orcamento.createdAt);
  const data = Number.isNaN(criadoEm.getTime())
    ? new Date()
    : criadoEm;
  const partes = [
    `Orcamento`,
    perfil.nome.trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 50) || "Orcamento",
    `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`,
  ];

  return `${partes.join("_")}.pdf`;
}

function montarHtmlOrcamento(
  orcamento: LocalOrcamento,
  itens: LocalOrcamentoItem[],
  perfil: LocalProfile,
  logo: string | null,
): string {
  const validadeDate = calculateDueDate(
    new Date(orcamento.createdAt),
    orcamento.validadeDias,
  );
  const validadeTexto = Number.isNaN(validadeDate.getTime())
    ? "Validade selecionada"
    : `Até ${formatDateBR(validadeDate)}`;

  const rows = itens
    .map(
      (item) => `<tr>
        <td class="pdf-item-desc">${escapeHtml(item.descricao)}</td>
        <td class="pdf-item-unidade">${escapeHtml(item.unidade || "-")}</td>
        <td class="pdf-num">${formatQuantidade(item.quantidade)}</td>
        <td class="pdf-num">${formatBRL(item.precoUnitario)}</td>
        <td class="pdf-num"><strong>${formatBRL(calcularSubtotal(item))}</strong></td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
    .pdf-body { padding: 8px 32px 48px 32px; }
    .pdf-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .pdf-meta-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; }
    .pdf-meta-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: .06em; }
    .pdf-meta-value { font-size: 13px; font-weight: 600; margin-top: 4px; }
    .pdf-table { width: 100%; border-collapse: separate; border-spacing: 0 12px; }
    .pdf-table thead > tr { background: #eef2f7; }
    .pdf-table th { padding: 0 8px 8px 8px; text-align: left; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .pdf-table th:first-child { border-radius: 8px 0 0 8px; }
    .pdf-table th:last-child { border-radius: 0 8px 8px 0; text-align: right; }
    .pdf-table td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; vertical-align: middle; }
    .pdf-table tbody > tr { page-break-inside: avoid; }
    .pdf-item-desc { font-weight: 600; max-width: 42vw; }
    .pdf-item-unidade { color: #64748b; font-weight: 500; }
    .pdf-num { text-align: right; font-variant-numeric: tabular-nums; }
    .pdf-table tbody tr:last-child td { border-bottom: 0; }
    .pdf-total-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 12px; background: #ffffff; border: 2px solid #0f172a; border-radius: 16px; padding: 16px 18px; }
    .pdf-observacoes { margin-top: 18px; background: #ffffff; border: 1px dashed #94a3b8; border-radius: 14px; padding: 14px 16px; }
    .pdf-observacoes-titulo { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .pdf-observacoes-texto { margin-top: 4px; font-size: 11px; color: #334155; white-space: pre-line; }
    @media print { body { background: #ffffff; } }
  </style>
</head>
<body>
  <div class="pdf-body">
    <section class="pdf-meta">
      <div class="pdf-meta-card">
        <div class="pdf-meta-label">Cliente</div>
        <strong class="pdf-meta-value">${escapeHtml(orcamento.clienteNome)}</strong>
        ${orcamento.clienteTelefone ? `<div class="pdf-meta-value" style="font-weight:400; color:#64748b;">${escapeHtml(orcamento.clienteTelefone)}</div>` : ""}
        ${orcamento.clienteEmail ? `<div class="pdf-meta-value" style="font-weight:400; color:#64748b;">${escapeHtml(orcamento.clienteEmail)}</div>` : ""}
      </div>
      <div class="pdf-meta-card">
        <div class="pdf-meta-label">Validade</div>
        <strong class="pdf-meta-value">${orcamento.validadeDias} dias</strong>
        <div class="pdf-meta-value" style="font-weight:400; color:#64748b;">${validadeTexto}</div>
      </div>
    </section>
    <table class="pdf-table">
      <thead>
        <tr>
          <th>Item</th><th>Unidade</th><th>Qtd</th><th>Preço unit.</th><th>Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="pdf-total-card">
      <div><span style="font-size:10px; color:#64748b;">Total</span><br /><strong style="font-size:22px; color:#2563eb;">${formatBRL(orcamento.total)}</strong></div>
    </div>
    ${orcamento.observacoes ? `<div class="pdf-observacoes"><div class="pdf-observacoes-titulo">Observações</div><div class="pdf-observacoes-texto">${textoLinhas(orcamento.observacoes)}</div></div>` : ""}
  </div>
</body>
</html>`;
}

export async function gerarPdfOrcamento(
  orcamento: LocalOrcamento,
  itens: LocalOrcamentoItem[],
  perfil: LocalProfile,
): Promise<string> {
  const logoDataUri = await getProfileLogoDataUri(
    perfil.id,
    perfil.logoUrl,
  );
  const html = montarHtmlOrcamento(orcamento, itens, perfil, logoDataUri);
  const fileName = nomeArquivoPdfOrcamento(orcamento, perfil);
  const cacheDirectory = FileSystem.cacheDirectory?.replace(/^file:\/\//, "");
  const pdfFile = new File(Paths.cache, fileName);

  if (pdfFile.exists) {
    pdfFile.delete();
  }

  let modulo: ModuloPdf;

  try {
    modulo = await import("@flitzinteractive/react-native-nitro-html-pdf");
  } catch {
    throw new Error(
      "Geração de PDF não está disponível nesta versão. Use um development build ou atualize o app.",
    );
  }

  const result = await modulo.generatePdf({
    html,
    fileName,
    directory: cacheDirectory || undefined,
    pageSize: "A4",
    header: pdfHeaderHtml(perfil, logoDataUri),
    footer: pdfFooterHtml(perfil),
    headerHeight: 104,
    footerHeight: 72,
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 32,
    marginRight: 32,
  });

  if (!result.success) {
    throw new Error(result.error || "Falha ao gerar o PDF");
  }

  return result.filePath;
}
