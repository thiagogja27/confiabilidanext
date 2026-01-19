"use server"

import emailjs from "@emailjs/browser"

interface EmailData {
  toEmail: string
  dataHora: string
  confiabilidadePercentual: string
  confiavelTotal: string
  detalhesBalancas: string
}

export async function sendReliabilityEmail(data: EmailData) {
  const serviceId = process.env.EMAILJS_SERVICE_ID || ""
  const templateId = process.env.EMAILJS_TEMPLATE_ID || ""
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || ""

  if (!serviceId || !templateId || !publicKey) {
    return {
      success: false,
      error: "config",
      message: "As variáveis de ambiente do EmailJS não estão configuradas corretamente.",
    }
  }

  try {
    await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: data.toEmail,
        data_hora: data.dataHora,
        confiabilidade_percentual: data.confiabilidadePercentual,
        confiavel_total: data.confiavelTotal,
        detalhes_balancas: data.detalhesBalancas,
      },
      publicKey,
    )

    return { success: true }
  } catch (error: any) {
    let errorMessage = "Verifique a configuração do EmailJS."

    if (error.status === 412) {
      return {
        success: false,
        error: "oauth",
        message:
          "O serviço de email no EmailJS precisa ser reconectado. Acesse dashboard.emailjs.com → Services → Reconecte sua conta de email.",
      }
    } else if (error.status === 400) {
      errorMessage = "Dados inválidos ou template incorreto. Verifique a configuração do template no EmailJS."
    } else if (error.status === 401) {
      errorMessage = "Chave pública inválida. Verifique as variáveis de ambiente do EmailJS."
    } else if (error.text) {
      errorMessage = error.text
    }

    return {
      success: false,
      error: "send",
      message: errorMessage,
    }
  }
}
