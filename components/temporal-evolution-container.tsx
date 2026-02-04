"use client";

import { useState, useEffect } from "react";
import { TemporalEvolutionChart } from "@/components/temporal-evolution-chart";
import { WeighingEntry, BalanceReading } from "@/components/advanced-dashboard";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TemporalEvolutionContainerProps {
  entries: WeighingEntry[];
  calculateDiferenca: (balance: BalanceReading) => number;
}

export function TemporalEvolutionContainer({ entries, calculateDiferenca }: TemporalEvolutionContainerProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [availableScales, setAvailableScales] = useState<string[]>([]);
  // --- 1. NOVO ESTADO para controlar as balanças selecionadas ---
  const [selectedScales, setSelectedScales] = useState<Set<string>>(new Set());

  // --- 2. NOVA FUNÇÃO para lidar com a mudança nos checkboxes ---
  const handleScaleSelectionChange = (scale: string, isChecked: boolean) => {
    setSelectedScales(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(scale);
      } else {
        newSet.delete(scale);
      }
      return newSet;
    });
  };

  const processDataForTemporalChart = (allEntries: WeighingEntry[]) => {
    const allScales = new Set<string>();

    const processedData = allEntries.map(entry => {
      const chartPoint: { [key: string]: any } = {
        timestamp: entry.dataHora,
      };

      if (entry.balancas) {
        Object.entries(entry.balancas).forEach(([scaleName, balanceData]) => {
          const scaleKey = `Balança ${scaleName}`;
          chartPoint[scaleKey] = calculateDiferenca(balanceData);
          allScales.add(scaleName);
        });
      }
      return chartPoint;
    });

    processedData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const scalesArray = Array.from(allScales).sort((a, b) => parseInt(a) - parseInt(b));
    
    setChartData(processedData);
    setAvailableScales(scalesArray);
    // --- 3. MODIFICAÇÃO: Seleciona todas as balanças por padrão ---
    setSelectedScales(new Set(scalesArray));
  }

  useEffect(() => {
    if (entries && entries.length > 0) {
      processDataForTemporalChart(entries);
    } else {
      setChartData([]);
      setAvailableScales([]);
      setSelectedScales(new Set());
    }
  }, [entries]);

  // --- 4. MODIFICAÇÃO: Retorna os checkboxes e o gráfico ---
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-8">
      {/* Container para os checkboxes */}
      <div className="border-b pb-4 mb-4">
        <h4 className="font-semibold mb-3 text-center">Selecionar Balanças para Exibição</h4>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {availableScales.map(scale => (
            <div key={scale} className="flex items-center space-x-2">
              <Checkbox
                id={`scale-${scale}`}
                checked={selectedScales.has(scale)}
                onCheckedChange={(checked) => handleScaleSelectionChange(scale, checked as boolean)}
              />
              <Label htmlFor={`scale-${scale}`} className="cursor-pointer text-sm font-medium">
                Balança {scale}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* O gráfico agora recebe apenas as balanças selecionadas */}
      <TemporalEvolutionChart data={chartData} scales={Array.from(selectedScales)} />
    </div>
  );
}
