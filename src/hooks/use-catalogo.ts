import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import {
  atualizarItem,
  criarItem,
  deletarItem,
  listarItens,
  type CatalogoItemInput,
  type LocalCatalogoItem,
} from "@/services/catalogo";

const CATALOGO_QUERY_KEY = ["catalogo"] as const;

type UpdateItemVariables = {
  id: string;
  input: CatalogoItemInput;
};

export function useCatalogo() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CATALOGO_QUERY_KEY,
    queryFn: () => (userId ? listarItens(userId) : []),
    enabled: Boolean(userId),
  });

  const criar = useMutation({
    mutationFn: async (input: CatalogoItemInput) => {
      if (!userId) {
        throw new Error("Sua sessão expirou. Entre novamente.");
      }

      return criarItem(userId, input);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: CATALOGO_QUERY_KEY });
      const previous =
        queryClient.getQueryData<LocalCatalogoItem[]>(CATALOGO_QUERY_KEY);
      const now = new Date().toISOString();
      const optimisticItem: LocalCatalogoItem = {
        id: crypto.randomUUID(),
        userId: userId ?? "",
        descricao: input.descricao,
        precoUnitario: input.precoUnitario,
        unidade: input.unidade,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      queryClient.setQueryData<LocalCatalogoItem[]>(
        CATALOGO_QUERY_KEY,
        (current) => [...(current ?? []), optimisticItem],
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CATALOGO_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CATALOGO_QUERY_KEY });
    },
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, input }: UpdateItemVariables) => {
      if (!userId) {
        throw new Error("Sua sessão expirou. Entre novamente.");
      }

      atualizarItem(userId, id, input);
    },
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: CATALOGO_QUERY_KEY });
      const previous =
        queryClient.getQueryData<LocalCatalogoItem[]>(CATALOGO_QUERY_KEY);
      const now = new Date().toISOString();

      queryClient.setQueryData<LocalCatalogoItem[]>(
        CATALOGO_QUERY_KEY,
        (current) =>
          current?.map((item) =>
            item.id === id
              ? {
                  ...item,
                  descricao: input.descricao,
                  precoUnitario: input.precoUnitario,
                  unidade: input.unidade,
                  updatedAt: now,
                }
              : item,
          ),
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CATALOGO_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CATALOGO_QUERY_KEY });
    },
  });

  const deletar = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) {
        throw new Error("Sua sessão expirou. Entre novamente.");
      }

      deletarItem(userId, id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: CATALOGO_QUERY_KEY });
      const previous =
        queryClient.getQueryData<LocalCatalogoItem[]>(CATALOGO_QUERY_KEY);

      queryClient.setQueryData<LocalCatalogoItem[]>(
        CATALOGO_QUERY_KEY,
        (current) => current?.filter((item) => item.id !== id),
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CATALOGO_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CATALOGO_QUERY_KEY });
    },
  });

  return {
    itens: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    retry: () => query.refetch(),
    criar,
    atualizar,
    deletar,
  };
}
