# Azlor Environment Configuration Guide

## Quick Setup

1. Copy `.env.example` to `.env.local`
2. Fill in all required variables below
3. Run `pnpm dev`

## Required Environment Variables

### Core Application
- `NODE_ENV` - Set to `development` or `production`
- `VITE_APP_ID` - Your Manus OAuth app ID
- `VITE_APP_TITLE` - Application title (default: Azlor)
- `VITE_APP_LOGO` - Logo URL

### Database
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Example: `postgresql://azlor:password@localhost:5432/azlor`

### Redis Cache
- `REDIS_URL` - Redis connection string
  - Format: `redis://host:port`
  - Example: `redis://localhost:6379`

### Authentication
- `JWT_SECRET` - Session signing secret (min 32 characters)
- `OAUTH_SERVER_URL` - OAuth server base URL
- `VITE_OAUTH_PORTAL_URL` - OAuth login portal URL
- `OWNER_OPEN_ID` - Owner's OAuth ID
- `OWNER_NAME` - Owner's display name

### Gmail Integration
- `GMAIL_CLIENT_ID` - Google OAuth client ID
- `GMAIL_CLIENT_SECRET` - Google OAuth client secret
- `GMAIL_REDIRECT_URI` - OAuth redirect URL

### Stripe Payment
- `STRIPE_PUBLIC_KEY` - Stripe publishable key (pk_test_...)
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_test_...)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `STRIPE_PRO_PRICE_ID` - Pro plan price ID
- `STRIPE_BUSINESS_PRICE_ID` - Business plan price ID

### Error Tracking
- `SENTRY_DSN` - Sentry project DSN
- `SENTRY_ENVIRONMENT` - Environment name

### Built-in APIs
- `BUILT_IN_FORGE_API_URL` - Manus Forge API URL
- `BUILT_IN_FORGE_API_KEY` - Forge API key
- `VITE_FRONTEND_FORGE_API_URL` - Frontend Forge API URL
- `VITE_FRONTEND_FORGE_API_KEY` - Frontend Forge API key

### Email Service
- `SENDGRID_API_KEY` - SendGrid API key
- `SENDGRID_FROM_EMAIL` - From email address

### Analytics
- `VITE_ANALYTICS_WEBSITE_ID` - Analytics website ID
- `VITE_ANALYTICS_ENDPOINT` - Analytics endpoint URL

### Feature Flags
- `ENABLE_2FA` - Enable two-factor authentication
- `ENABLE_AUDIT_LOGGING` - Enable audit logs
- `ENABLE_RATE_LIMITING` - Enable rate limiting
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000 = 15 min)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

### Security
- `SESSION_TIMEOUT_MS` - Session timeout in milliseconds (default: 1800000 = 30 min)
- `CORS_ORIGIN` - CORS allowed origin
- `CORS_CREDENTIALS` - Allow credentials in CORS

### Logging
- `LOG_LEVEL` - Log level (debug, info, warn, error)
- `LOG_FORMAT` - Log format (json or text)

## Development Setup

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Production Deployment

See `DEPLOYMENT.md` for production setup instructions.
