# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Assinaturas (RevenueCat)

A entitlement do plano Pro chama `pro` e o produto mensal é `orcamento_pro_mensal`. O `appUserID` do RevenueCat é o `user.id` do Supabase, o que permite restaurar a assinatura em outro dispositivo com a mesma conta.

### Configuração local

Preencha no `.env`:

```properties
EXPO_PUBLIC_REVENUECAT_IOS_KEY=<chave pública do projeto no RevenueCat>
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=<chave pública do projeto no RevenueCat>
```

As chaves acima são públicas e pode ser incluídas no bundle. Nunca coloque chaves de servidor ou segredos com prefixo `EXPO_PUBLIC_`.

Compre/prague em sandbox nas lojas, com um usuário de teste cadastrado no App Store Connect/Google Play Console e no RevenueCat. O estado da entitlement é lido primeiro do RevenueCat e espelhado no SQLite para uso offline.

### Webhook

A Edge Function `revenuecat-webhook` recebe os eventos do RevenueCat e atualiza a tabela `public.subscriptions`. Configure no RevenueCat:

- URL: `https://<projeto>.supabase.co/functions/v1/revenuecat-webhook`
- Authorization header: o mesmo valor de `REVENUECAT_WEBHOOK_SECRET`
- Eventos: ciclo de vida de assinaturas, pelo menos `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION` e `BILLING_ISSUE`

Segredos da função (somente no Supabase, nunca no app):

```bash
supabase secrets set REVENUECAT_WEBHOOK_SECRET=<valor-do-header>
supabase secrets set REVENUECAT_WEBHOOK_SIGNING_SECRET=<opcional>
```

Opcionalmente, habilite HMAC no RevenueCat e defina `REVENUECAT_WEBHOOK_SIGNING_SECRET`. A função valida o header `Authorization` e, quando configurado, a assinatura `X-RevenueCat-Webhook-Signature`.

Aplique também a migration `supabase/migrations/006_revenuecat.sql`, que ajusta os status de tolerância/problema de cobrança e cria a tabela de idempotência dos eventos.

### IAP x checkout externo no Brasil

Em 2025, o CADE homologou um acordo com a Apple (processo 08700.006953/2025-62) sobre distribuição, pagamentos alternativos e links externos no iOS. Em 2026, a Apple passou a implementar essas mudanças no Brasil: a partir do iOS 26.5, apps distribuídos na App Store brasileira podem usar processadores alternativos e/ou links para pagamento externo, mediante o entitlement `StoreKit External Purchases or Offers`, com IAP obrigatoriamente oferecido junto e regras de divulgação/comissões.

Fontes oficiais consultadas em 24/11/2026:

- Apple — Payment options on the App Store in Brazil: https://developer.apple.com/support/payment-options-on-the-app-store-in-brazil/
- Apple — Changes to iOS in Brazil: https://developer.apple.com/support/app-distribution-in-brazil/
- CADE — Termo de compromisso (tradução informativa): https://cdn.cade.gov.br/portal-ingles/Publica%C3%A7%C3%B5es%20institucionais/Guias/Application%20No.%2008700.006953202562%20%20%28Apple%29%20-%20Opinion%20%28EN%29.pdf
- Google Play — Billing choice program: https://support.google.com/googleplay/android-developer/answer/17161464

O programa de escolha de faturamento do Google Play tem disponibilidade por mercado e pode mudar; a página oficial acima não listava o Brasil na tabela de mercados disponíveis consultada. Antes de trocar IAP por checkout externo, valide novamente as políticas atuais da Apple e do Google, as versões mínimas de iOS/Android exigidas, as taxas aplicáveis e a elegibilidade do app. Esta implementação usa IAP via RevenueCat por padrão por ser o caminho compatível com as duas lojas sem exigir programas especiais.

Para testar compras reais é necessário um development build (EAS ou `expo run:ios|android`); Expo Go suporta apenas o modo de pré-visualização sem compras reais.

## Checklist de release

Antes de gerar uma versão para as lojas:

1. Aplicar todas as migrations do Supabase, inclusive `007_onboarding.sql`.
2. Conferir `app.json`: nome `Orçamento Pro`, `version`, `ios.bundleIdentifier`, `android.package`, ícone 1024x1024, splash e permissões.
3. Confirmar que as únicas permissões são galeria e câmera (microfone foi desabilitado no plugin `expo-image-picker`).
4. Substituir os placeholders em `docs/privacy.md`, publicar em GitHub Pages e usar a URL pública nos metadados das lojas e no `store/store-listing.md`.
5. Substituir as capturas em `store/screenshots/ios/` e `store/screenshots/android/` por capturas reais, mantendo 6 por plataforma.
6. Preencher `store/store-listing.md` com descrição curta, longa, palavras-chave, e-mail de suporte e URL da política de privacidade.
7. Rodar `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor@latest` e `CI=1 npx expo export --platform android`.
8. Testar: cadastro → onboarding → primeiro orçamento salvo → PDF → WhatsApp → assinatura em sandbox → restauração.
9. Aumentar `version` em `app.json` para cada nova versão de loja.
10. Para habilitar upload de source maps nativas, configure o plugin `@sentry/react-native/expo` com `organization`, `project` e `SENTRY_AUTH_TOKEN`. O plugin foi removido do `app.json` porque esses valores ainda não foram fornecidos; o `Sentry.init` JavaScript continua ativo via `EXPO_PUBLIC_SENTRY_DSN`.

### Configuração do EAS

O projeto possui `eas.json` com os perfis `development`, `preview` e `production`. Antes do primeiro build:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
```

Configure as variáveis públicas de build no EAS (ou use `.env` local para desenvolvimento):

```bash
npx eas-cli@latest env:set --name EXPO_PUBLIC_SUPABASE_URL --value <url> --environment production
npx eas-cli@latest env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon-key> --environment production
npx eas-cli@latest env:set --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value <chave> --environment production
npx eas-cli@latest env:set --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value <chave> --environment production
npx eas-cli@latest env:set --name EXPO_PUBLIC_SENTRY_DSN --value <dsn> --environment production
npx eas-cli@latest env:set --name EXPO_PUBLIC_POSTHOG_API_KEY --value <key> --environment production
npx eas-cli@latest env:set --name EXPO_PUBLIC_POSTHOG_HOST --value https://us.i.posthog.com --environment production
```

Para submissão iOS, defina também `EXPO_APPLE_ID`, `EXPO_ASC_APP_ID` e `EXPO_APPLE_TEAM_ID` como variáveis de ambiente locais ou segredos do EAS. Para Google Play, configure a service account no Expo ou `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`.

### Builds

```bash
npx eas-cli@latest build --platform android --profile development
npx eas-cli@latest build --platform ios --profile development
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform ios --profile preview
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest build --platform ios --profile production
```

O perfil `production` gera `.aab` para Android e `.ipa` para iOS. O perfil `preview` gera `.apk` para distribuição interna Android e build ad-hoc para iOS.

### TestFlight e Play Internal Testing

```bash
npx eas-cli@latest submit --platform ios --profile production --latest
npx eas-cli@latest submit --platform android --profile production --latest
```

O perfil de submissão Android usa a faixa `internal` com release status `draft`. O perfil iOS usa o grupo `Internos` do TestFlight. Ajuste `groups`, `appleId`, `ascAppId` e `appleTeamId` em `eas.json` conforme a conta da Apple.

### Publicar a política de privacidade

O arquivo `docs/privacy.md` está publicado via GitHub Pages na pasta `/docs` do repositório `bportes89/orcamentopro`. Substitua os placeholders de responsável/e-mail antes da submissão e acesse:

```text
https://bportes89.github.io/orcamentopro/privacy.html
```

Use essa URL nos campos de política de privacidade da App Store Connect e do Google Play Console.

### Estado atual deste workspace

Repositório: `https://github.com/bportes89/orcamentopro`. Projeto EAS: `@bportes89/orcamentopro`. Política publicada em `https://bportes89.github.io/orcamentopro/privacy.html`. Ainda são necessárias credenciais de assinatura da Apple/Google e contas de TestFlight/Play Console para submeter; dispositivos de teste são necessários para validar a instalação.
