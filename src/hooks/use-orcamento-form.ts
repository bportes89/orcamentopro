import { useCallback, useMemo, useState } from "react";

import { formatBRL } from "@/lib/currency";
import type { ValidadeOrcamento } from "@/lib/validators";
import type { LocalCatalogoItem } from "@/services/catalogo";

export type OrcamentoFormItem = {
  id: string;
  descricao: string;
  unidade: string | null;
  quantidade: number;
  precoUnitario: number;
};

export type OrcamentoFormItemChanges = Partial<Omit<OrcamentoFormItem, "id">>;

export type OrcamentoFormInitialValues = {
  clienteNome?: string;
  clienteTelefone?: string;
  validadeDias?: ValidadeOrcamento;
  observacoes?: string;
  itens?: OrcamentoFormItem[];
};

export function useOrcamentoForm(initial: OrcamentoFormInitialValues = {}) {
  const [clienteNome, setClienteNome] = useState(initial.clienteNome ?? "");
  const [clienteTelefone, setClienteTelefone] = useState(
    initial.clienteTelefone ?? "",
  );
  const [validadeDias, setValidadeDias] = useState<ValidadeOrcamento>(
    initial.validadeDias ?? 7,
  );
  const [observacoes, setObservacoes] = useState(initial.observacoes ?? "");
  const [itens, setItens] = useState<OrcamentoFormItem[]>(
    initial.itens ?? [],
  );

  const adicionarItem = useCallback((item: Omit<OrcamentoFormItem, "id">) => {
    setItens((current) => [...current, { ...item, id: crypto.randomUUID() }]);
  }, []);

  const adicionarDoCatalogo = useCallback(
    (item: LocalCatalogoItem) => {
      adicionarItem({
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade: 1,
        precoUnitario: item.precoUnitario,
      });
    },
    [adicionarItem],
  );

  const adicionarItemAvulso = useCallback(() => {
    adicionarItem({
      descricao: "",
      unidade: null,
      quantidade: 1,
      precoUnitario: 0,
    });
  }, [adicionarItem]);

  const removerItem = useCallback((id: string) => {
    setItens((current) => current.filter((item) => item.id !== id));
  }, []);

  const atualizarItem = useCallback(
    (id: string, changes: OrcamentoFormItemChanges) => {
      setItens((current) =>
        current.map((item) =>
          item.id === id ? { ...item, ...changes } : item,
        ),
      );
    },
    [],
  );

  const total = useMemo(
    () =>
      Math.round(
        itens.reduce(
          (soma, item) => soma + item.quantidade * item.precoUnitario,
          0,
        ) * 100,
      ) / 100,
    [itens],
  );

  const totalFormatado = useMemo(() => formatBRL(total), [total]);

  return {
    clienteNome,
    setClienteNome,
    clienteTelefone,
    setClienteTelefone,
    validadeDias,
    setValidadeDias,
    observacoes,
    setObservacoes,
    itens,
    total,
    totalFormatado,
    adicionarItem,
    adicionarDoCatalogo,
    adicionarItemAvulso,
    removerItem,
    atualizarItem,
  };
}
