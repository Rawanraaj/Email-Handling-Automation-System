# Azlor - Complete Setup & Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [GitHub Repository Setup](#github-repository-setup)
4. [Render Deployment](#render-deployment)
5. [Stripe Integration](#stripe-integration)
6. [Production Configuration](#production-configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org)
- **pnpm** - Install with `npm install -g pnpm`
- **Git** - Download from [git-scm.com](https://git-scm.com)
- **GitHub Account** - Sign up at [github.com](https://github.com)
- **Render Account** - Sign up at [render.com](https://render.com) (free)
- **Stripe Account** - Sign up at [stripe.com](https://stripe.com) (free)
- **Gmail Account** - Required for email integration

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Rawanraaj/azlor.git
cd azlor
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Set Up Local Database

**Option A: Using PostgreSQL locally**

```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
# Windows: Download from postgresql.org

# Start PostgreSQL service
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql
# Windows: Start PostgreSQL service

# Create database
createdb email_automation

# Get connection string
# postgresql://localhost:5432/email_automation
```

**Option B: Using Docker**

```bash
docker run --name postgres-email \
  -e POSTGRES_DB=email_automation \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

### Step 4: Configure Environment Variables

Request secrets using the Azlor platform:

```bash
# The system will prompt you for:
# - JWT_SECRET (auto-generated)
# - VITE_APP_ID (from OAuth 2.0)
# - STRIPE_SECRET_KEY (from Stripe)
# - STRIPE_PUBLISHABLE_KEY (from Stripe)
# - Database connection string
```

### Step 5: Run Database Migrations

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### Step 6: Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### Step 7: Test the Application

- Visit `http://localhost:3000`
- Click "Login with Manus"
- Authorize the application
- Test email sync and features

---

## GitHub Repository Setup

### Step 1: Create GitHub Repository

```bash
# Option 1: Using GitHub CLI
gh repo create azlor --private --source=. --remote=origin --push

# Option 2: Manual setup
# 1. Go to github.com/new
# 2. Create repository "azlor"
# 3. Make it PRIVATE
# 4. Don't initialize with README
```

### Step 2: Add Repository Secrets

Go to **Settings → Secrets and variables → Actions** and add:

```
RENDER_SERVICE_ID=srv_xxxxxxxxxxxxx
RENDER_API_KEY=rnd_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
```

### Step 3: Push Code to GitHub

```bash
git add .
git commit -m "Initial commit: Azlor"
git branch -M main
git push -u origin main
```

### Step 4: Verify GitHub Actions

- Go to **Actions** tab
- Verify workflow runs successfully
- Check build logs for any errors

---

## Render Deployment

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

### Step 2: Create PostgreSQL Database

1. Click **New +** → **PostgreSQL**
2. Configure:
   - **Name:** `azlor-db`
   - **Database:** `email_automation`
   - **User:** `postgres`
   - **Region:** Choose closest to your users
   - **Plan:** Free (512 MB)
3. Click **Create Database**
4. Wait 5-10 minutes for initialization
5. Copy the **Internal Database URL**

### Step 3: Deploy Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `azlor-api`
   - **Environment:** `Node`
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Plan:** Free
   - **Region:** Same as database

4. Add Environment Variables:

```
NODE_ENV=production
DATABASE_URL=<paste from database step>
JWT_SECRET=<generate random 32-char string>
VITE_APP_ID=<>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
OWNER_OPEN_ID=<your OpenID>
OWNER_NAME=Your Name
OWNER_EMAIL=niroulaaalok54@gmail.com
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<>
STRIPE_SECRET_KEY=<from Stripe>
STRIPE_PUBLISHABLE_KEY=<from Stripe>
```

5. Click **Create Web Service**
6. Wait for deployment (5-10 minutes)
7. Copy the service URL

### Step 4: Initialize Production Database

1. Click service → **Shell**
2. Run:
   ```bash
   pnpm drizzle-kit migrate
   ```

### Step 5: Verify Deployment

- Visit your Render URL
- Test login with OAuth 2.0
- Verify email sync works
- Check analytics dashboard

---

## Stripe Integration

### Step 1: Get Stripe API Keys

1. Go to [stripe.com/dashboard](https://stripe.com/dashboard)
2. Navigate to **Developers → API Keys**
3. Copy:
   - **Secret Key** (sk_test_...)
   - **Publishable Key** (pk_test_...)

### Step 2: Add Keys to Render

1. Go to Render dashboard
2. Click your service → **Environment**
3. Add:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`

### Step 3: Set Up Webhooks

1. In Stripe dashboard: **Developers → Webhooks**
2. Click **Add endpoint**
3. Configure:
   - **URL:** `https://your-app.onrender.com/api/webhooks/stripe`
   - **Events:** Select:
     - `payment_intent.succeeded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

4. Copy **Signing Secret** (whsec_...)
5. Add to Render: `STRIPE_WEBHOOK_SECRET`

### Step 4: Test Payments

Use Stripe test cards:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Expiry:** Any future date
- **CVC:** Any 3 digits

---

## Production Configuration

### Step 1: Set Up Custom Domain (Optional)

1. Go to Render service → **Settings**
2. Click **Custom Domain**
3. Enter your domain (e.g., `emailpro.yourdomain.com`)
4. Follow DNS setup instructions
5. Update Stripe webhook URL with new domain

### Step 2: Enable HTTPS

- Automatic on Render (free SSL certificate)
- Verify in browser address bar

### Step 3: Configure Email Sending

For production email sending, configure SMTP:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=noreply@emailpro.yourdomain.com
```

### Step 4: Set Up Monitoring

1. In Render: **Settings → Notifications**
2. Enable email alerts for:
   - Deployment failures
   - Service crashes
   - High memory usage

### Step 5: Configure Backups

1. In Render PostgreSQL: **Settings**
2. Enable automated backups
3. Set retention to 30 days

---

## Monitoring & Maintenance

### Daily Tasks

- Check Render logs for errors
- Monitor Stripe transactions
- Review failed email sends

### Weekly Tasks

- Review analytics dashboard
- Check user feedback
- Monitor database size

### Monthly Tasks

- Update dependencies: `pnpm update`
- Security audit: `npm audit`
- Review and optimize slow queries
- Backup verification

### Quarterly Tasks

- Security penetration test
- Performance optimization
- User survey and feedback
- Plan new features

---

## Troubleshooting

### Build Fails on Render

**Error:** `pnpm: command not found`

**Solution:**
```bash
# Add to Render build command:
npm install -g pnpm && pnpm install && pnpm build
```

### Database Connection Error

**Error:** `Error: connect ECONNREFUSED`

**Solution:**
1. Verify DATABASE_URL is correct
2. Check database is running
3. Ensure IP is whitelisted
4. Test connection locally first

### OAuth Not Working

**Error:** `Invalid OAuth credentials`

**Solution:**
1. Verify VITE_APP_ID is correct
2. Check OAUTH_SERVER_URL
3. Ensure redirect URL is registered
4. Clear browser cookies and retry

### Stripe Webhook Not Firing

**Error:** `Webhook signature verification failed`

**Solution:**
1. Verify STRIPE_WEBHOOK_SECRET is correct
2. Check webhook endpoint URL
3. Test webhook in Stripe dashboard
4. Review Render logs for errors

### Email Sync Not Working

**Error:** `Gmail sync error: Command failed`

**Solution:**
1. Verify Gmail MCP is enabled
2. Check OAuth scopes
3. Ensure user is authenticated
4. Review server logs

### Out of Memory on Free Tier

**Error:** `Process killed due to memory limit`

**Solution:**
1. Upgrade to paid Render plan
2. Optimize database queries
3. Implement caching
4. Reduce email batch size

---

## Support & Resources

- **Documentation:** See README.md, DEPLOYMENT.md, SECURITY.md
- **GitHub Issues:** Report bugs and request features
- **Email:** support@emailautomationpro.com
- **Security:** security@emailautomationpro.com

---

## Next Steps

After successful deployment:

1. ✅ Set up custom domain
2. ✅ Configure email sending
3. ✅ Enable payment processing
4. ✅ Set up monitoring alerts
5. ✅ Create backup schedule
6. ✅ Document runbook
7. ✅ Train team on operations
8. ✅ Plan scaling strategy

---

**Deployment Status:** ✅ Ready for Production  
**Last Updated:** 2026-04-29  
**Version:** 1.0.0
