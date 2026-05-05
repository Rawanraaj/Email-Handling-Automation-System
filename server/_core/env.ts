export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Anthropic Claude API (replaces Manus Forge)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  // Encryption key for Gmail/Outlook tokens (32 bytes hex = 64 chars)
  encryptionKey: process.env.ENCRYPTION_KEY ?? "",
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripeFreePriceId: process.env.STRIPE_FREE_PRICE_ID ?? "price_free",
  stripeProPriceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
  stripeEnterprisePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "",
  // Gmail OAuth
  gmailClientId: process.env.GMAIL_CLIENT_ID ?? "",
  gmailClientSecret: process.env.GMAIL_CLIENT_SECRET ?? "",
  gmailRedirectUrl: process.env.GMAIL_REDIRECT_URL ?? "",
};
