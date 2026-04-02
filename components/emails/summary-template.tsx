import * as React from 'react';
import { type WeighingEntry } from '@/lib/utils';

interface SummaryEmailTemplateProps {
  entry: WeighingEntry;
}

// Função auxiliar para garantir que os valores de peso sejam números
const parseWeight = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

export const SummaryEmailTemplate: React.FC<Readonly<SummaryEmailTemplateProps>> = ({ entry }) => (
  <div style={{ fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#f4f4f4' }}>
    <div style={{ maxWidth: '600px', margin: 'auto', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ backgroundColor: '#007bff', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Novo Registro de Pesagem</h1>
      </div>
      <div style={{ padding: '20px' }}>
        <p style={{ fontSize: '16px' }}>Um novo registro de pesagem foi salvo no sistema.</p>
        
        <div style={{ marginTop: '25px' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', fontSize: '16px' }}>Detalhes do Registro</h3>
            <p style={{ margin: '10px 0 5px 0' }}><strong>Data e Hora:</strong> {new Date(entry.dataHora).toLocaleString('pt-BR')}</p>
            <p style={{ margin: '5px 0' }}><strong>Placa do Veículo:</strong> {entry.placa}</p>
            <p style={{ margin: '5px 0' }}><strong>Motorista:</strong> {entry.motorista || 'N/A'}</p>
            <p style={{ margin: '5px 0' }}><strong>Assistente:</strong> {entry.nomeAssistente} (Turno: {entry.turnoAssistente})</p>
        </div>

        <div style={{ marginTop: '25px' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', fontSize: '16px' }}>Resumo das Balanças</h3>
            <table style={{ width: '100%', marginTop: '15px', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Balança</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Ponta Mar</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Meio</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Ponta Terra</th>
                        <th style={{ padding: '8px', textAlign: 'right', color: '#555' }}>Diferença</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(entry.balancas).sort(([keyA], [keyB]) => parseInt(keyA) - parseInt(keyB)).map(([id, data]) => {
                        const finalData = data.ajuste || data;
                        const values = [parseWeight(finalData.pontaMar), parseWeight(finalData.meio), parseWeight(finalData.pontaTerra)];
                        const diferenca = Math.max(...values) - Math.min(...values);
                        return (
                            <tr key={id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>{id}</td>
                                <td style={{ padding: '8px' }}>{values[0].toFixed(1)} kg</td>
                                <td style={{ padding: '8px' }}>{values[1].toFixed(1)} kg</td>
                                <td style={{ padding: '8px' }}>{values[2].toFixed(1)} kg</td>
                                <td style={{ padding: '8px', textAlign: 'right', color: diferenca > 40 ? '#dc2626' : '#333' }}>{diferenca.toFixed(1)} kg</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        <p style={{ marginTop: '25px', fontSize: '14px', color: '#555' }}>O relatório completo em Excel com todos os dados da pesagem está anexado a este e-mail.</p>
      </div>
      <div style={{ backgroundColor: '#f8f8f8', padding: '15px', textAlign: 'center', fontSize: '12px', color: '#777', borderTop: '1px solid #ddd' }}>
        <p>Este é um e-mail automático enviado pelo Sistema de Monitoramento de Balanças.</p>
      </div>
    </div>
  </div>
);
