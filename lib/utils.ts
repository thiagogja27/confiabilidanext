
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Mantém a função original
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TIPOS ---

export interface BalanceReading {
  pontaMar: string | number;
  meio: string | number;
  pontaTerra: string | number;
}

export interface WeighingEntry {
  placa: string;
  placa2: string;
  motorista: string;
  nomeAssistente: string;
  turnoAssistente: string;
  nomeSeguranca: string;
  tipoVeiculo: string;
  tipoVeiculo2?: string;
  balancas?: Record<string, BalanceReading>;
  checklist?: any;
  testeEstatico?: any;
  afericaoBalancaDinamica?: any[];
  userId: string;
  timestamp: any; 
  dataHora: string;
}

// --- FUNÇÕES DE CÁLCULO E FORMATAÇÃO ---

/**
 * Calcula a maior diferença absoluta entre as leituras de uma balança.
 */
export const calculateDiferenca = (balanca: BalanceReading): number => {
  const pontaMar = parseFloat(String(balanca.pontaMar)) || 0;
  const meio = parseFloat(String(balanca.meio)) || 0;
  const pontaTerra = parseFloat(String(balanca.pontaTerra)) || 0;
  
  if (pontaMar === 0 && meio === 0 && pontaTerra === 0) {
      return 0;
  }
  
  const readings = [pontaMar, meio, pontaTerra].filter(v => v > 0);
  if (readings.length < 2) return 0;

  const maxVal = Math.max(...readings);
  const minVal = Math.min(...readings);
  return maxVal - minVal;
};

/**
 * Formata um único registro de pesagem como uma string de texto puro.
 */
export const formatWeighingEntryAsText = (entry: WeighingEntry): string => {
  let text = `Sistema de Pesagem - Relatório Individual\n`;
  text += `============================================\n\n`;
  text += `ID do Usuário: ${entry.userId}\n`;
  text += `Data e Hora: ${new Date(entry.dataHora).toLocaleString('pt-BR')}\n`;
  text += `Placa: ${entry.placa || 'N/A'}\n`;
  text += `Motorista: ${entry.motorista || 'N/A'}\n`;
  text += `Assistente: ${entry.nomeAssistente || 'N/A'} (Turno: ${entry.turnoAssistente})\n`;
  text += `Segurança: ${entry.nomeSeguranca || 'N/A'}\n\n`;
  text += `--------------------------------------------\n`;
  text += `          DADOS DAS BALANÇAS\n`;
  text += `--------------------------------------------\n`;
  text += `Balança | Ponta Mar | Meio      | Ponta Terra | Diferença\n`;
  text += `------------------------------------------------------------\n`;

  if (entry.balancas && Object.keys(entry.balancas).length > 0) {
    for (const [key, value] of Object.entries(entry.balancas)) {
      const diferenca = calculateDiferenca(value);
      const pontaMar = String(value.pontaMar || 0).padEnd(9, ' ');
      const meio = String(value.meio || 0).padEnd(9, ' ');
      const pontaTerra = String(value.pontaTerra || 0).padEnd(11, ' ');
      const balancaId = key.padEnd(7, ' ');
      text += `${balancaId} | ${pontaMar} | ${meio} | ${pontaTerra} | ${diferenca.toFixed(2)} kg\n`;
    }
  } else {
    text += `Nenhum dado de balança registrado.\n`;
  }

  text += `\n============================================\n`;

  return text;
};
