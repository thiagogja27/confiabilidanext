'use server';

import { Resend } from 'resend';
import { AlertEmailTemplate } from '@/emails/alert-email';
import type { WeighingEntry } from '@/lib/utils';
import { formatWeighingEntryAsText } from '@/lib/utils';

interface SendAlertEmailParams {
  toEmail: string;
  entry: WeighingEntry;
  problematicBalance: { id: string; diferenca: number };
}

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL;

export async function sendAlertEmail(params: SendAlertEmailParams) {
  try {
    if (!fromEmail) {
      console.error('[Resend Action] ERRO: Variável de ambiente RESEND_FROM_EMAIL não definida!');
      return { success: false, message: "Servidor de e-mail não configurado (remetente)" };
    }

    const reportAsText = formatWeighingEntryAsText(params.entry);

    await resend.emails.send({
      from: fromEmail,
      to: params.toEmail,
      subject: `[ALERTA] Anomalia na Balança ${params.problematicBalance.id}`,
      react: AlertEmailTemplate({
        reportText: reportAsText,
        problematicBalanceId: params.problematicBalance.id,
        diferenca: params.problematicBalance.diferenca,
      }),
      // Anexos removidos
    });

    return { success: true, message: "E-mail de alerta enviado com sucesso" };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Resend Action - Erro no Envio de Alerta]", errorMessage);
    return { success: false, message: `Falha no envio do e-mail: ${errorMessage}` };
  }
}
