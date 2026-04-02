'use server';

import { Resend } from 'resend';
import { SummaryEmailTemplate } from '@/emails/summary-email';
import type { WeighingEntry } from '@/lib/utils';
import { formatWeighingEntryAsText } from '@/lib/utils';

interface SendSummaryEmailParams {
  toEmail: string;
  entry: WeighingEntry;
}

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL;

export async function sendSummaryEmail(params: SendSummaryEmailParams) {
  try {
    if (!fromEmail) {
      console.error('[Resend Action] ERRO: Variável de ambiente RESEND_FROM_EMAIL não definida!');
      return { success: false, message: "Servidor de e-mail não configurado (remetente)" };
    }

    const reportAsText = formatWeighingEntryAsText(params.entry);

    await resend.emails.send({
      from: fromEmail,
      to: params.toEmail,
      subject: `Relatório de Pesagem - ${params.entry.placa || 'Sem Placa'}`,
      react: SummaryEmailTemplate({ reportText: reportAsText }),
      // Anexos removidos
    });
    
    return { success: true, message: "E-mail de relatório enviado com sucesso" };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Resend Action - Erro no Envio de Relatório]", errorMessage);
    return { success: false, message: `Falha no envio do e-mail: ${errorMessage}` };
  }
}
