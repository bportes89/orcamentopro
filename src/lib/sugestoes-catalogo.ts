export const OFICIOS = [
  { valor: "eletricista", label: "Eletricista" },
  { valor: "pintor", label: "Pintor" },
  { valor: "pedreiro", label: "Pedreiro" },
  { valor: "técnico", label: "Técnico" },
  { valor: "outro", label: "Outro" },
] as const;

export type Oficio = (typeof OFICIOS)[number]["valor"];

const SUGESTOES: Record<Oficio, string[]> = {
  eletricista: [
    "Instalação de tomada",
    "Troca de disjuntor",
    "Instalação de luminária",
  ],
  pintor: ["Pintura de parede", "Pintura de porta", "Tratamento de superfície"],
  pedreiro: ["Assentamento de azulejo", "Construção de muro", "Reboco"],
  técnico: ["Visita técnica", "Manutenção preventiva", "Instalação de equipamento"],
  outro: ["Serviço geral", "Visita técnica", "Reparo"],
};

export function sugestoesParaOficio(oficio: string | null): string[] {
  if (oficio && oficio in SUGESTOES) {
    return SUGESTOES[oficio as Oficio];
  }

  return SUGESTOES.outro;
}
