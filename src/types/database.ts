import type {
  CatalogoItem,
  Orcamento,
  OrcamentoItem,
  Profile,
  StatusOrcamento,
} from "./index";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id?: string;
          nome: string;
          email: string;
          telefone?: string | null;
          empresa?: string | null;
          chave_pix?: string | null;
          logo_url?: string | null;
          onboarding_done?: boolean;
          oficio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Profile>;
        Relationships: [];
      };
      catalogo_itens: {
        Row: CatalogoItem;
        Insert: {
          id?: string;
          user_id: string;
          descricao: string;
          preco_unitario: number;
          unidade?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<CatalogoItem>;
        Relationships: [
          {
            foreignKeyName: "catalogo_itens_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      orcamentos: {
        Row: Orcamento;
        Insert: {
          id?: string;
          user_id: string;
          cliente_nome: string;
          cliente_email?: string | null;
          cliente_telefone?: string | null;
          status?: StatusOrcamento;
          validade_dias: number;
          observacoes?: string | null;
          total?: number;
          created_at?: string;
          updated_at?: string;
          respondido_em?: string | null;
          enviado_em?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Orcamento>;
        Relationships: [
          {
            foreignKeyName: "orcamentos_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      orcamento_itens: {
        Row: OrcamentoItem;
        Insert: {
          id?: string;
          orcamento_id: string;
          descricao: string;
          unidade?: string | null;
          quantidade: number;
          preco_unitario: number;
          subtotal?: number;
          created_at?: string;
        };
        Update: Partial<OrcamentoItem>;
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey";
            columns: ["orcamento_id"];
            referencedRelation: "orcamentos";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      status_orcamento: StatusOrcamento;
    };
    CompositeTypes: Record<string, never>;
  };
};
