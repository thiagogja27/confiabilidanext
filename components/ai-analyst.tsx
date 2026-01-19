'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAnalystProps {
  dataContext: any[];
}

export function AIAnalyst({ dataContext }: AIAnalystProps) {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setError('');
    setResponse('');

    if (!dataContext || dataContext.length === 0) {
      setError("Não há nenhum registro no banco de dados para analisar.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/analyze-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, dataContext }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `O servidor retornou um erro (Status: ${res.status}) mas sem uma mensagem específica.`);
        } catch (jsonParseError) {
          throw new Error(`O servidor retornou uma resposta inesperada (Status: ${res.status}). Detalhes: ${errorText.slice(0, 300)}...`);
        }
      }

      const data = await res.json();
      setResponse(data.response);

    } catch (err: any) {
      console.error('Falha ao obter resposta da IA:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-primary" />
          Analista de Dados IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="Pergunte sobre todos os registros..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Analisando...' : 'Perguntar'}
          </Button>
        </form>
        
        {isLoading && (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="ml-2 text-muted-foreground">Pensando...</p>
            </div>
        )}

        {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md whitespace-pre-wrap">
                <h3 className="font-bold mb-2">Ocorreu um erro:</h3>
                <p>{error}</p>
            </div>
        )}

        {response && (
            <div className="mt-4 prose prose-sm max-w-full bg-gray-50 p-4 rounded-md">
                 <ReactMarkdown>{response}</ReactMarkdown>
            </div>
        )}

        {!isLoading && !response && !error && (
            <div className="text-center text-sm text-muted-foreground mt-4">
                <p>Faça uma pergunta para iniciar a análise de <strong>todos os {dataContext.length}</strong> registros do banco de dados.</p>
                <p className="mt-2 text-xs">Ex: "Qual a média de variação para a balança 10?", "Quantos registros não confiáveis existem no total?".</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
