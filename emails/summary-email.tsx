
import React from 'react';

interface SummaryEmailProps {
  reportText: string;
}

export const SummaryEmailTemplate: React.FC<SummaryEmailProps> = ({ reportText }) => (
  <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.4', color: '#333' }}>
    <h1 style={{ color: '#5cb85c', fontFamily: 'sans-serif' }}>Novo Registro de Pesagem</h1>
    <p style={{ fontFamily: 'sans-serif' }}>
      Um novo registro de pesagem foi salvo com sucesso e não apresentou anomalias.
    </p>
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

export default SummaryEmailTemplate;
