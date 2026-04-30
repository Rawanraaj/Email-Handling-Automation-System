# Email Automation Pro - Deployment Guide

## Overview

This guide covers deploying Email Automation Pro to **Render.com** with a free PostgreSQL database. The application is production-ready with enterprise-grade security.

## Prerequisites

- GitHub account with the repository pushed
- Render.com account (free)
- Stripe account (for payments)
- Gmail API credentials (already configured via Manus OAuth)

## Step 1: Create Render PostgreSQL Database

1. Go to [render.com](https://render.com)
2. Sign in or create account
3. Click **New +** → **PostgreSQL**
4. Configure:
   - **Name:** `email-automation-pro-db`
   - **Database:** `email_automation`
   - **User:** `postgres`
   - **Region:** Choose closest to you
   - **Plan:** Free (512 MB storage)
5. Click **Create Database**
6. Wait for database to initialize (5-10 minutes)
7. Copy the **Internal Database URL** (you'll need this)

## Step 2: Deploy Backend to Render

1. Go to Render dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `email-automation-pro-api`
   - **Environment:** `Node`
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Plan:** Free
   - **Region:** Same as database

5. Add Environment Variables:
   ```
   NODE_ENV=production
   DATABASE_URL=<paste Internal Database URL from step 1>
   JWT_SECRET=<generate random 32-char string>
   VITE_APP_ID=<from Manus OAuth>
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://auth.manus.im
   OWNER_OPEN_ID=<your Manus OpenID>
   OWNER_NAME=<your name>
   BUILT_IN_FORGE_API_URL=https://api.manus.im
   BUILT_IN_FORGE_API_KEY=<from Manus>
   VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
   VITE_FRONTEND_FORGE_API_KEY=<from Manus>
   STRIPE_SECRET_KEY=<from Stripe dashboard>
   STRIPE_PUBLISHABLE_KEY=<from Stripe dashboard>
   OWNER_EMAIL=niroulaaalok54@gmail.com
   ```

6. Click **Create Web Service**
7. Wait for deployment (5-10 minutes)
8. Copy the service URL (e.g., `https://email-automation-pro-api.onrender.com`)

## Step 3: Update Frontend Configuration

1. In your GitHub repository, update `client/src/const.ts`:
   ```typescript
   export const API_URL = "https://email-automation-pro-api.onrender.com";
   ```

2. Update environment variables in Render for frontend:
   ```
   VITE_API_URL=https://email-automation-pro-api.onrender.com
   ```

## Step 4: Deploy Frontend to Render

1. Create another Web Service for frontend
2. Configure:
   - **Name:** `email-automation-pro`
   - **Environment:** `Node`
   - **Build Command:** `cd client && pnpm install && pnpm build`
   - **Start Command:** `cd server && pnpm start`
   - **Plan:** Free

3. Add same environment variables as backend
4. Click **Create Web Service**

## Step 5: Set Up Custom Domain (Optional)

1. In Render dashboard, go to your web service
2. Click **Settings** → **Custom Domain**
3. Add your domain (e.g., `emailpro.yourdomain.com`)
4. Update DNS records as instructed

## Step 6: Configure Stripe for Payments

1. Go to [stripe.com](https://stripe.com)
2. Create account or sign in
3. Get API keys from Dashboard → Developers → API Keys
4. Add to Render environment variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`

5. Set up webhook:
   - Endpoint URL: `https://your-app.onrender.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `customer.subscription.updated`

## Step 7: Initialize Database

1. SSH into Render service or use Render's built-in terminal
2. Run migrations:
   ```bash
   pnpm drizzle-kit migrate
   ```

## Step 8: Verify Deployment

1. Visit your app URL
2. Test login with Manus OAuth
3. Test email sync
4. Verify analytics dashboard loads
5. Test compose and send

## Security Checklist

- ✅ HTTPS/TLS enabled (automatic on Render)
- ✅ Environment variables encrypted
- ✅ Database connection encrypted
- ✅ Rate limiting enabled
- ✅ CSRF protection active
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ Input validation on all endpoints
- ✅ OAuth 2.0 authentication
- ✅ Secure session cookies (HttpOnly, Secure, SameSite)
- ✅ API key rotation support

## Monitoring & Logs

1. View logs in Render dashboard:
   - Click service → **Logs**
   - Real-time streaming
   - Search and filter capabilities

2. Set up alerts:
   - Click service → **Settings** → **Notifications**
   - Enable email alerts for deployment failures

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution:** Verify DATABASE_URL is correct and database is running

### Build Fails
```
Error: pnpm not found
```
**Solution:** Ensure `pnpm` is in package.json engines

### OAuth Not Working
```
Error: Invalid OAuth credentials
```
**Solution:** Verify VITE_APP_ID and OAUTH_SERVER_URL are correct

## Free Tier Limits

- **Render Web Service:** 750 hours/month (enough for 1 service)
- **PostgreSQL:** 256 MB storage, 1 connection
- **Stripe:** Free for testing, then 2.9% + $0.30 per transaction

## Scaling to Paid

When ready to scale:
1. Upgrade Render plan ($7+/month)
2. Upgrade PostgreSQL (starts at $15/month)
3. Add Redis for caching
4. Enable CDN for static assets

## Support

- Render Docs: https://render.com/docs
- Stripe Docs: https://stripe.com/docs
- GitHub Issues: Create issue in repository

---

**Deployed by:** Email Automation Pro Team  
**Last Updated:** 2026-04-29  
**Version:** 1.0.0
