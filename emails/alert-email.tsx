
import React from 'react';

interface AlertEmailProps {
  reportText: string;
  problematicBalanceId: string;
  diferenca: number;
}

export const AlertEmailTemplate: React.FC<AlertEmailProps> = ({ reportText, problematicBalanceId, diferenca }) => (
  <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.4', color: '#333' }}>
    <h1 style={{ color: '#d9534f', fontFamily: 'sans-serif' }}>ALERTA: Anomalia de Pesagem!</h1>
    <p style={{ fontFamily: 'sans-serif' }}>
      Uma anomalia significativa foi detectada em um dos registros de pesagem.
    </p>
    <div style={{ padding: '10px 15px', border: '1px solid #d9534f', backgroundColor: '#f2dede', borderRadius: '5px', margin: '20px 0' }}>
        <p style={{ fontFamily: 'sans-serif', margin: 0 }}><strong>Balança com Anomalia:</strong> ID {problematicBalanceId}</p>
        <p style={{ fontFamily: 'sans-serif', margin: 0 }}><strong>Diferença Registrada:</strong> {diferenca.toFixed(2)} kg (Limite: 40 kg)</p>
    </div>
    <hr />
    <h2 style={{ fontFamily: 'sans-serif' }}>Relatório Detalhado</h2>
    <code>
      {reportText}
    </code>
    <hr />
    <p style={{ fontSize: '0.8em', color: '#888', fontFamily: 'sans-serif' }}>
      Este é um e-mail automático do Sistema de Pesagem.
    </p>
  </div>
);

export default AlertEmailTemplate;
