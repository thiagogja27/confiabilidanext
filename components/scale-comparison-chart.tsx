'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import type { BalanceReading } from './advanced-dashboard';
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ScaleComparisonChartProps {
  balances: Record<string, BalanceReading>;
  calculateDiferenca: (balance: BalanceReading) => number;
  onOpenAdjustmentModal: (balancaId: string) => void;
}

// GRUPOS DE BALANÇAS
const RODOVIARIAS = ['3', '6', '7', '8'];
const FERROVIARIAS = ['1', '2', '9', '10', '5'];

const columnColors: { [key: string]: string } = {
  pontaMar: '#3b82f6',
  meio: '#f59e0b',
  pontaTerra: '#10b981',
};

export function ScaleComparisonChart({ balances, calculateDiferenca, onOpenAdjustmentModal }: ScaleComparisonChartProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [lines, setLines] = useState<any[]>([]);

  const calculateLines = useCallback(() => {
    if (!tableRef.current) return;

    const newLines: any[] = [];
    const rows = Array.from(tableRef.current.rows);
    const sortedBalances = Object.entries(balances).sort(([keyA], [keyB]) => parseInt(keyA) - parseInt(keyB));

    if (rows.length < 2) { 
        setLines([]);
        return;
    }

    const headerCells = Array.from(rows[0].cells);
    const columnIndex: { [key: string]: number } = {
      pontaMar: headerCells.findIndex(cell => cell.getAttribute('data-key') === 'pontaMar'),
      meio: headerCells.findIndex(cell => cell.getAttribute('data-key') === 'meio'),
      pontaTerra: headerCells.findIndex(cell => cell.getAttribute('data-key') === 'pontaTerra'),
    };

    for (let i = 1; i < sortedBalances.length; i++) {
      const [prevKey] = sortedBalances[i - 1];
      const [currentKey] = sortedBalances[i];

      const isSameGroup = 
        (RODOVIARIAS.includes(prevKey) && RODOVIARIAS.includes(currentKey)) ||
        (FERROVIARIAS.includes(prevKey) && FERROVIARIAS.includes(currentKey));

      if (!isSameGroup) {
        continue; 
      }
      
      const prevRow = Array.from(rows).find(row => row.getAttribute('data-row-key') === prevKey);
      const currentRow = Array.from(rows).find(row => row.getAttribute('data-row-key') === currentKey);

      if (!prevRow || !currentRow) continue;

      for (const key of ['pontaMar', 'meio', 'pontaTerra']) {
        const colIdx = columnIndex[key];
        if (colIdx === -1) continue;

        const prevCell = prevRow.cells[colIdx];
        const currentCell = currentRow.cells[colIdx];

        if (prevCell && currentCell) {
          const tableRect = tableRef.current.getBoundingClientRect();
          const prevRect = prevCell.getBoundingClientRect();
          const currentRect = currentCell.getBoundingClientRect();

          if (prevRect.width === 0 || currentRect.width === 0) continue;

          const x1 = prevRect.left + prevRect.width / 2 - tableRect.left;
          const y1 = prevRect.top + prevRect.height / 2 - tableRect.top;
          const x2 = currentRect.left + currentRect.width / 2 - tableRect.left;
          const y2 = currentRect.top + currentRect.height / 2 - tableRect.top;
          
          const diff = Math.abs(parseFloat(prevCell.textContent || '0') - parseFloat(currentCell.textContent || '0'));
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          newLines.push({
            key: `${prevKey}-${currentKey}-${key}`,
            x1, y1, x2, y2,
            color: columnColors[key],
            isAlert: diff > 40,
            difference: diff.toFixed(0),
            midX,
            midY,
          });
        }
      }
    }
    setLines(newLines);
  }, [balances]);

  useEffect(() => {
    const animationFrameId = requestAnimationFrame(calculateLines);
    const resizeObserver = new ResizeObserver(calculateLines);
    if (tableRef.current) {
        resizeObserver.observe(tableRef.current);
    }
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [calculateLines]);

  return (
    <div className="relative">
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
        {lines.map(line => (
          <g key={line.key}>
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.color}
              strokeWidth={line.isAlert ? 2.5 : 1.5}
              strokeDasharray={line.isAlert ? "5 5" : "none"}
              opacity={0.9}
            />
            <text
              x={line.midX}
              y={line.midY}
              dy="-5"
              textAnchor="middle"
              style={{
                fontSize: '11px',
                fontWeight: 'bold',
                fill: line.isAlert ? '#dc2626' : '#1f2937',
                paintOrder: 'stroke',
                stroke: 'white',
                strokeWidth: '3px',
                strokeLinejoin: 'round',
              }}
            >
              {line.difference}
            </text>
          </g>
        ))}
      </svg>

      <div className="overflow-x-auto relative">
        <table ref={tableRef} className="w-full text-sm border-collapse bg-transparent">
            <thead>
                <tr className="bg-muted/50">
                    <th className="border p-2 text-left">Balança</th>
                    <th data-key="pontaMar" className="border p-2 text-center">Ponta Mar</th>
                    <th data-key="meio" className="border p-2 text-center">Meio</th>
                    <th data-key="pontaTerra" className="border p-2 text-center">Ponta Terra</th>
                    <th className="border p-2 text-center">Diferença</th>
                    <th className="border p-2 text-center">Status</th>
                    <th className="border p-2 text-center">Ações</th>
                </tr>
            </thead>
            <tbody>
            {Object.entries(balances).sort(([keyA], [keyB]) => parseInt(keyA) - parseInt(keyB)).map(([key, bal]) => {
                const valuesToUse = bal.ajuste || bal;
                const diff = calculateDiferenca(bal);
                const isConfiavel = diff <= 40;
                return (
                <tr key={key} data-row-key={key} className="hover:bg-muted/60">
                    <td className="border p-2">
                        <div className="flex items-center gap-2 justify-start">
                            <span className='font-medium'>{key}</span>
                            {bal.ajuste && (
                            <TooltipProvider>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className='flex items-center'><Wrench className="h-4 w-4 text-blue-500" /></button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-background border p-2 rounded-md shadow-lg">
                                    <div className="space-y-2 text-foreground">
                                        <p className="font-semibold border-b pb-1">Detalhes do Ajuste</p>
                                        <p><span className="font-medium">Ajustado por:</span> {bal.ajuste.ajustadoPor}</p>
                                        <p><span className="font-medium">Data:</span> {new Date(bal.ajuste.dataAjuste).toLocaleString('pt-BR')}</p>
                                        {bal.ajuste.observacoes && <p><span className="font-medium">Obs:</span> {bal.ajuste.observacoes}</p>}
                                        <div className="pt-2 border-t mt-2 text-xs">
                                            <p>Ponta Mar: <span className="line-through text-muted-foreground">{Math.round(bal.pontaMar)}kg</span> → <span className="font-bold text-primary">{Math.round(bal.ajuste.pontaMar)}kg</span></p>
                                            <p>Meio: <span className="line-through text-muted-foreground">{Math.round(bal.meio)}kg</span> → <span className="font-bold text-primary">{Math.round(bal.ajuste.meio)}kg</span></p>
                                            <p>Ponta Terra: <span className="line-through text-muted-foreground">{Math.round(bal.pontaTerra)}kg</span> → <span className="font-bold text-primary">{Math.round(bal.ajuste.pontaTerra)}kg</span></p>
                                        </div>
                                    </div>
                                </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            )}
                        </div>
                    </td>
                    <td data-key="pontaMar" className="border p-2 text-center">{Math.round(valuesToUse.pontaMar) || 0}</td>
                    <td data-key="meio" className="border p-2 text-center">{Math.round(valuesToUse.meio) || 0}</td>
                    <td data-key="pontaTerra" className="border p-2 text-center">{Math.round(valuesToUse.pontaTerra) || 0}</td>
                    <td className={`border p-2 text-center font-medium ${isConfiavel ? 'text-green-600' : 'text-red-600'}`}>
                        {diff.toFixed(0)} kg
                    </td>
                    <td className="border p-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${isConfiavel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {isConfiavel ? "Confiável" : "Diferença > 40kg"}
                        </span>
                    </td>
                    <td className="border p-2 text-center">
                    <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        onOpenAdjustmentModal(key);
                    }}>
                        <Wrench className="mr-2 h-3 w-3" />
                        Ajuste
                    </Button>
                    </td>
                </tr>
                )
            })}
            </tbody>
        </table>
      </div>
    </div>
  );
}
