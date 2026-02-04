'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  timestamp: string;
  [key: string]: any; // To accommodate Balança 1, Balança 2, etc.
}

interface TemporalEvolutionChartProps {
  data: ChartDataPoint[];
  scales: string[];
}

// Função para gerar cores aleatórias e vibrantes
const generateColor = (index: number) => {
    const colors = [
      '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A422E3',
      '#E32254', '#22E3A4', '#E3A422', '#8884d8', '#82ca9d'
    ];
    return colors[index % colors.length];
};

export function TemporalEvolutionChart({ data, scales }: TemporalEvolutionChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 p-8">Não há dados suficientes para exibir o gráfico de evolução.</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-8">
        <h3 className="text-xl font-semibold mb-4 text-center">Evolução Temporal das Diferenças de Peso</h3>
        <ResponsiveContainer width="100%" height={400}>
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="timestamp"
                    tickFormatter={(timeStr) => new Date(timeStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit'}) + ' ' + new Date(timeStr).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                />
                <YAxis label={{ value: 'Diferença de Peso (kg)', angle: -90, position: 'insideLeft' }}/>
                <Tooltip 
                  labelFormatter={(label) => new Date(label).toLocaleString('pt-BR')} 
                  formatter={(value: any, name: string) => {
                    // **CORREÇÃO APLICADA AQUI**
                    // Verifica se o valor é um número antes de formatar
                    if (typeof value === 'number') {
                      return [`${value.toFixed(2)} kg`, name];
                    }
                    // Se não for um número (ex: undefined), mostra um texto alternativo
                    return ['Dado ausente', name];
                  }}
                />
                <Legend />
                {scales.map((scale, index) => (
                    <Line 
                        key={scale} 
                        type="monotone" 
                        dataKey={`Balança ${scale}`} 
                        stroke={generateColor(index)} 
                        activeDot={{ r: 8 }} 
                        connectNulls // Conecta pontos mesmo que haja dados faltando no meio
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
}
