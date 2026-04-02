import * as React from 'react';

interface AlertEmailTemplateProps {
  balancaId: string;
  diferenca: string;
  pontaMar: string;
  meio: string;
  pontaTerra: string;
  dataHora: string;
  placa: string;
  motorista: string;
  assistente: string;
  turno: string;
}

export const AlertEmailTemplate: React.FC<Readonly<AlertEmailTemplateProps>> = ({ 
    balancaId, 
    diferenca, 
    pontaMar, 
    meio, 
    pontaTerra, 
    dataHora, 
    placa, 
    motorista, 
    assistente, 
    turno 
}) => (
  <div style={{ fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#f4f4f4' }}>
    <div style={{ maxWidth: '600px', margin: 'auto', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ backgroundColor: '#dc2626', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Alerta de Anomalia em Balança</h1>
      </div>
      <div style={{ padding: '20px' }}>
        <p style={{ fontSize: '16px' }}>Uma anomalia significativa foi detectada em uma das balanças durante um registro de pesagem.</p>
        
        <div style={{ padding: '15px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '4px', marginTop: '20px' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#b91c1c' }}>Balança {balancaId}</h2>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#991b1b' }}>Diferença: {diferenca} kg</p>
          <table style={{ width: '100%', marginTop: '10px', fontSize: '14px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #fca5a5' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Ponta Mar</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Meio</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Ponta Terra</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px' }}>{pontaMar} kg</td>
                <td style={{ padding: '8px' }}>{meio} kg</td>
                <td style={{ padding: '8px' }}>{pontaTerra} kg</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '25px' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', fontSize: '16px' }}>Detalhes do Registro</h3>
            <p style={{ margin: '10px 0 5px 0' }}><strong>Data e Hora:</strong> {dataHora}</p>
            <p style={{ margin: '5px 0' }}><strong>Placa do Veículo:</strong> {placa}</p>
            <p style={{ margin: '5px 0' }}><strong>Motorista:</strong> {motorista}</p>
            <p style={{ margin: '5px 0' }}><strong>Assistente:</strong> {assistente} (Turno: {turno})</p>
        </div>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#555' }}>O relatório completo em Excel com todos os dados da pesagem está anexado a este e-mail.</p>
      </div>
      <div style={{ backgroundColor: '#f8f8f8', padding: '15px', textAlign: 'center', fontSize: '12px', color: '#777', borderTop: '1px solid #ddd' }}>
        <p>Este é um e-mail automático enviado pelo Sistema de Monitoramento de Balanças.</p>
      </div>
    </div>
  </div>
);
