import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Usar um nome de modelo válido e recomendado
const MODEL_NAME = "gemini-2.5-flash-lite";

// Função auxiliar para obter a chave da API com segurança
function getApiKey(): string {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    // Este erro será capturado e enviado como uma resposta JSON adequada
    throw new Error(
      "Por favor, configure sua chave API do Google Gemini gratuita nas variáveis de ambiente (GOOGLE_GENERATIVE_AI_API_KEY). Obtenha em: https://aistudio.google.com/apikey",
    );
  }
  return apiKey;
}

// Garantir que a função seja exportada corretamente para ser reconhecida pelo Next.js
export async function POST(req: Request) {
  try {
    const { message, dataContext } = await req.json();

    const entries = dataContext;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      // Retornar uma resposta JSON adequada para requisições inválidas
      return Response.json(
          { error: "Não há dados para analisar. Por favor, filtre alguns registros na tabela." },
          { status: 400 }
      );
    }

    const originalRecordCount = entries.length;
    const MAX_RECORDS_FOR_ANALYSIS = 150;
    let isTruncated = false;

    let dataForPrompt = entries;
    if (entries.length > MAX_RECORDS_FOR_ANALYSIS) {
      dataForPrompt = entries.slice(0, MAX_RECORDS_FOR_ANALYSIS);
      isTruncated = true;
    }

    const dataContextForPrompt = JSON.stringify(dataForPrompt, null, 2);

    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Usando uma template literal sem erros de sintaxe
    let prompt = `Você é um analista de dados especialista em registros de pesagem, aferição e confiabilidade de balanças rodoviárias e ferroviárias.\nSua tarefa é analisar o conjunto de dados JSON fornecido e responder à pergunta do usuário.\nBaseie suas respostas estritamente nas informações presentes no contexto de dados.\n\nContexto dos Dados (JSON):\n\`\`\`json\n${dataContextForPrompt}\n\`\`\`\n`;


    if (isTruncated) {
        prompt += `\n**Aviso Importante:** Sua análise foi realizada sobre uma amostra dos ${MAX_RECORDS_FOR_ANALYSIS} primeiros registros de um total de ${originalRecordCount}.\n`;
    }

    prompt += `\n**Pergunta do Usuário:**\n"${message}"\n\nAnalise os dados e forneça uma resposta completa.`;

    const generationConfig = {
      temperature: 0.5,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2000,
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });

    const response = result.response;
    const text = response.text();

    // Verificação crucial: garantir que há texto antes de enviar. Captura respostas bloqueadas.
    if (!text) {
      const reason = response.promptFeedback?.blockReason || "Desconhecido";
      console.error(`[AI Analyst Server] A API do Gemini retornou uma resposta vazia ou bloqueada. Motivo: ${reason}`);
      return Response.json(
          { error: `A IA não pôde gerar uma resposta. Motivo: ${reason}. Tente refazer sua pergunta.` },
          { status: 500 }
      );
    }
    
    // Sucesso: Retorna a resposta JSON válida
    return Response.json({ response: text });

  } catch (error: any) {
    // Tratador de erro geral para toda a função
    console.error("[AI Analyst Server] Erro geral na rota da API:", error);

    // Tratamento de erro específico para diferentes cenários
    if (error.message?.includes("API key")) {
        return Response.json({ error: error.message }, { status: 401 });
    }

    if (error.message?.includes("429") || error.message?.includes("quota")) {
      return Response.json({ error: "Cota da API do Gemini excedida. Por favor, aguarde e tente novamente." }, { status: 429 });
    }
    
    // Fallback para qualquer outro erro do lado do servidor
    return Response.json(
        { error: error.message || "Falha interna no servidor da API." },
        { status: 500 }
    );
  }
}
