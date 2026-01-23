/**
 * Definição da estrutura de um ajuste de pesagem.
 */
export interface Adjustment {
  ajustadoPor: string;
  pontaMar: number;
  meio: number;
  pontaTerra: number;
  observacoes: string;
  dataAjuste: string;
}

/**
 * Definição da leitura de uma única balança, incluindo um possível ajuste.
 */
export interface BalanceReading {
  pontaMar: number;
  meio: number;
  pontaTerra: number;
  diferenca?: number; // Calculado dinamicamente
  ajuste?: Adjustment; // Ajuste é opcional
}

/**
 * Definição dos dados do checklist.
 */
export interface ChecklistData {
  drenagemBalanca: { sim?: boolean; nao?: boolean };
  plataformaLivre: { sim?: boolean; nao?: boolean };
  modulosZerados: { sim?: boolean; nao?: boolean };
  portasTrancadas: { sim?: boolean; nao?: boolean };
  fossosCadeados: { sim?: boolean; nao?: boolean };
  caixasJuncaoLacradas: { sim?: boolean; nao?: boolean };
  atuacaoCancela: { sim?: boolean; nao?: boolean };
  observacoes?: string;
}

/**
 * Definição de um teste estático.
 */
export interface StaticTest {
  pesoPadrao: number;
  resultado: number;
  variacaoPeso: number;
  variacaoPercentual: string;
}

/**
 * Definição de uma entrada na aferição da balança dinâmica.
 */
export interface DynamicScaleEntry {
  id: string;
  prefixo: string;
  placaVagoes: string;
  pesoOrigem: string;
  bitola: "Estreita" | "Larga";
  primeiraPassagemR300B: string;
  segundaPassagemR300C: string;
  terceiraPassagemR300B: string;
  origemXPrimeira: number;
  origemXSegunda: number;
  origemXTerceira: number;
}

/**
 * A definição completa de um registro de pesagem, unindo todas as outras.
 */
export interface WeighingEntry {
  key: string; // Chave do Firebase
  dataHora: string;
  tipoVeiculo: string;
  tipoVeiculo2?: string;
  placa: string;
  placa2?: string;
  motorista?: string;
  nomeAssistente: string;
  turnoAssistente: string;
  nomeSeguranca: string;
  balancas: Record<string, BalanceReading>;
  checklist: ChecklistData;
  testeEstatico?: Record<string, StaticTest>;
  afericaoBalancaDinamica?: DynamicScaleEntry[];
}
