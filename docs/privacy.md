---
layout: page
title: Política de Privacidade — Orçamento Pro
permalink: /privacy.html
---

# Política de Privacidade — Orçamento Pro

Última atualização: 24/11/2026

O Orçamento Pro ("app") é oferecido por [NOME DA EMPRESA OU RESPONSÁVEL]. Esta política explica quais dados são coletados, como são usados e quais são os seus direitos nos termos da Lei nº 13.709/2018 (LGPD).

## Dados que coletamos

- **Conta**: e-mail, nome, telefone e identificador do usuário no Supabase Authentication.
- **Perfil e negócio**: nome do negócio, logo, chave Pix e ofício informado no onboarding.
- **Conteúdo criado por você**: orçamentos, itens do catálogo, clientes, valores, observações e status.
- **Assinatura**: identificador do usuário no RevenueCat, entitlement `pro`, produto assinado, estado da assinatura e identificador da transação original.
- **Diagnóstico e uso**: telas visitadas, eventos de navegação, erros e relatórios de falha enviados ao Sentry e ao PostHog. O Sentry pode incluir dados PII por padrão; revise essa configuração antes da publicação.
- **Rede e dispositivo**: informações técnicas necessárias para sincronização e segurança, como conectividade e versão do app.

Não coletamos áudio, localização, contatos ou fotos além da imagem escolhida para a logo. O app não exibe anúncios.

## Como usamos os dados

- Para criar, salvar, sincronizar e compartilhar orçamentos e PDFs.
- Para personalizar sugestões de serviços a partir do ofício informado.
- Para autenticar o usuário e sincronizar dados entre dispositivos via Supabase.
- Para gerenciar o plano Pro, validar o limite do plano gratuito e restaurar compras.
- Para corrigir erros, medir uso do app e melhorar a experiência.

## Armazenamento e sincronização

Os dados de orçamentos, catálogo e perfil são armazenados localmente no dispositivo com SQLite e sincronizados com o Supabase quando há conexão. Dados de assinatura são sincronizados pelo webhook `revenuecat-webhook` e pelo RevenueCat.

Ao desinstalar o app, os dados locais são removidos. Dados remotos permanecem nos serviços contratados até que a conta seja excluída.

## Compartilhamento com terceiros

Usamos apenas os serviços necessários para operar o app:

- **Supabase** — autenticação, banco de dados e Edge Functions.
- **RevenueCat** — compras, assinaturas e restauração.
- **Apple App Store e Google Play** — processamento de pagamentos.
- **Sentry** — monitoramento de erros.
- **PostHog** — análise de uso e telas visitadas.

Não vendemos dados pessoais.

## Permissões do dispositivo

- **Galeria de fotos**: usada apenas para escolher a logo do perfil.
- **Câmera**: usada apenas se o usuário optar por tirar uma foto da logo.
- **Internet**: necessária para autenticação, sincronização, compras e diagnóstico. O app continua funcional offline para criação local.

Não solicitamos permissão de microfone, localização, contatos ou notificações.

## Seus direitos

Você pode solicitar acesso, correção, exportação ou exclusão dos seus dados, além de revogar consentimentos, entrando em contato pelo e-mail informado abaixo. Também pode gerenciar ou cancelar a assinatura diretamente na App Store ou no Google Play.

## Contato

Responsável: [NOME DA EMPRESA OU RESPONSÁVEL]

E-mail: [EMAIL_DE_CONTATO@EXEMPLO.COM]

Alterações nesta política serão publicadas nesta página com nova data de atualização.
