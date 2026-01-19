# Configuração do EmailJS

Este guia explica como configurar o EmailJS para enviar emails com os dados de confiabilidade.

## Passo 1: Criar Conta no EmailJS

1. Acesse [EmailJS](https://www.emailjs.com/)
2. Crie uma conta gratuita
3. Confirme seu email

## Passo 2: Adicionar Serviço de Email

1. No dashboard do EmailJS, vá para **Email Services**
2. Clique em **Add New Service**
3. Escolha seu provedor de email (Gmail, Outlook, etc.)
4. Siga as instruções para conectar sua conta
5. Anote o **Service ID** gerado

## Passo 3: Criar Template de Email

1. Vá para **Email Templates**
2. Clique em **Create New Template**
3. Use o seguinte template:

```html
Relatório de Confiabilidade

Data/Hora: {{data_hora}}

Confiabilidade: {{confiabilidade_percentual}}%
Registros Confiáveis: {{confiavel_total}}

Detalhes das Balanças:
{{detalhes_balancas}}

---
Este é um email automático do Sistema de Confiabilidade
```

4. Anote o **Template ID** gerado

## Passo 4: Obter Public Key

1. Vá para **Account** > **General**
2. Encontre sua **Public Key**
3. Copie o valor

## Passo 5: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente na seção **Vars** da barra lateral do chat:

```
EMAILJS_SERVICE_ID=seu_service_id_aqui
EMAILJS_TEMPLATE_ID=seu_template_id_aqui
EMAILJS_PUBLIC_KEY=sua_public_key_aqui
```

**Nota:** Estas variáveis são usadas apenas no servidor para segurança.

## Como Usar

1. No dashboard, selecione um registro no dropdown "Selecione o Registro"
2. Digite o email de destino no campo "Email de Destino"
3. Clique no botão "Enviar Email"
4. O sistema enviará um email com os dados de confiabilidade do registro selecionado

## Solução de Problemas

### Erro 412: "Invalid grant"

Se você receber este erro:

1. Acesse [dashboard.emailjs.com](https://dashboard.emailjs.com)
2. Vá em **Email Services**
3. Clique no seu serviço (Gmail, Outlook, etc.)
4. Clique em **Reconnect** para renovar o token OAuth
5. Siga as instruções para reconectar sua conta
6. Tente enviar o email novamente

Este erro ocorre quando o token de autenticação OAuth expira e precisa ser renovado.

### Email não está sendo enviado

- Verifique se as variáveis de ambiente estão configuradas corretamente
- Confirme que o Service ID, Template ID e Public Key estão corretos
- Verifique se você não excedeu o limite de 200 emails/mês da conta gratuita
- Confirme que o email de destino é válido

## Estrutura do Email

O email enviado conterá:
- Data/Hora do registro
- Percentual de confiabilidade geral
- Quantidade de registros confiáveis vs total
- Detalhes de cada balança:
  - Ponta Mar (kg)
  - Meio (kg)
  - Ponta Terra (kg)
  - Diferença calculada (kg)
  - Status (Confiável/Não Confiável)

## Limite de Emails

A conta gratuita do EmailJS permite:
- 200 emails por mês
- 1 serviço de email
- 2 templates

Para mais emails, considere fazer upgrade do plano.
