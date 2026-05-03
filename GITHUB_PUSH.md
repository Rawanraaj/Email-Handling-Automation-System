# GitHub Push & Deployment Instructions

## Step 1: Push to GitHub

### Create GitHub Repository

```bash
# Using GitHub CLI
gh repo create email-automation-pro --private --source=. --remote=origin --push

# Or manually:
# 1. Go to github.com/new
# 2. Create repository "email-automation-pro"
# 3. Make it PRIVATE
# 4. Don't initialize with README
```

### Push Code

```bash
cd /home/ubuntu/email_automation_pro

# Add all files
git add .

# Commit
git commit -m "Initial commit: Email Automation Pro - Complete email management system with AI"

# Push to GitHub
git push -u origin main
```

### Verify Push

```bash
# Check remote
git remote -v

# Verify files on GitHub
# Visit: https://github.com/Rawanraaj/email-automation-pro
```

---

## Step 2: Deploy to Render

### Prerequisites

1. **Render Account** - Sign up at [render.com](https://render.com)
2. **GitHub Connected** - Authorize Render to access your repositories
3. **Stripe Keys** - Get from [stripe.com/dashboard](https://stripe.com/dashboard)

### Create PostgreSQL Database

1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name:** `email-automation-pro-db`
   - **Database:** `email_automation`
   - **User:** `postgres`
   - **Region:** Choose closest to you
   - **Plan:** Free
4. Click **Create Database**
5. Wait 5-10 minutes for initialization
6. Copy **Internal Database URL** (format: `postgresql://user:password@host:5432/email_automation`)

### Deploy Web Service

1. Click **New +** → **Web Service**
2. Select your GitHub repository
3. Configure:
   - **Name:** `email-automation-pro-api`
   - **Environment:** `Node`
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Plan:** Free
   - **Region:** Same as database

4. Add Environment Variables:

```
NODE_ENV=production
DATABASE_URL=<paste from database>
JWT_SECRET=<generate 32-char random string>
VITE_APP_ID=<>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
OWNER_OPEN_ID=<your OpenID>
OWNER_NAME=Rawan Raaj
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
7. Copy service URL (e.g., `https://email-automation-pro-api.onrender.com`)

### Initialize Database

1. In Render, click service → **Shell**
2. Run:
   ```bash
   pnpm drizzle-kit migrate
   ```

### Test Deployment

- Visit your Render URL
- Click "Login with Manus"
- Test email sync
- Verify all features work

---

## Step 3: Set Up GitHub Actions

### Add Secrets to GitHub

1. Go to GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Add:

```
RENDER_SERVICE_ID=srv_xxxxxxxxxxxxx
RENDER_API_KEY=rnd_xxxxxxxxxxxxx
```

### Get Render Credentials

1. Go to [render.com/account](https://render.com/account)
2. Click **API Keys**
3. Create new key
4. Copy key and add to GitHub

### Verify CI/CD

1. Go to **Actions** tab
2. Verify workflow runs on push
3. Check build logs

---

## Step 4: Configure Stripe Webhooks

1. Go to [stripe.com/dashboard](https://stripe.com/dashboard)
2. **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Configure:
   - **URL:** `https://your-render-url.onrender.com/api/webhooks/stripe`
   - **Events:** Select:
     - `payment_intent.succeeded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

5. Copy **Signing Secret** (whsec_...)
6. Add to Render: `STRIPE_WEBHOOK_SECRET`

---

## Step 5: Custom Domain (Optional)

1. In Render service → **Settings**
2. Click **Custom Domain**
3. Enter domain (e.g., `emailpro.yourdomain.com`)
4. Follow DNS setup instructions
5. Update Stripe webhook URL

---

## Deployment Checklist

- [ ] GitHub repository created and private
- [ ] Code pushed to GitHub
- [ ] Render PostgreSQL database created
- [ ] Render web service deployed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] GitHub Actions secrets added
- [ ] Stripe webhooks configured
- [ ] Login with Manus works
- [ ] Email sync works
- [ ] Analytics dashboard loads
- [ ] Custom domain configured (optional)

---

## Troubleshooting

### Build Fails

**Error:** `pnpm: command not found`

**Solution:** Update build command to:
```
npm install -g pnpm && pnpm install && pnpm build
```

### Database Connection Error

**Error:** `Error: connect ECONNREFUSED`

**Solution:**
1. Verify DATABASE_URL is correct
2. Check database is running
3. Test connection locally first

### OAuth Not Working

**Error:** `Invalid OAuth credentials`

**Solution:**
1. Verify VITE_APP_ID
2. Check OAUTH_SERVER_URL
3. Clear browser cookies
4. Retry login

### Stripe Not Working

**Error:** `Webhook signature verification failed`

**Solution:**
1. Verify STRIPE_WEBHOOK_SECRET
2. Check webhook endpoint URL
3. Test webhook in Stripe dashboard

---

## Production Checklist

Before going live:

- [ ] All environment variables set
- [ ] Database backups enabled
- [ ] HTTPS certificate installed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Audit logging active
- [ ] Error monitoring set up
- [ ] Incident response plan documented
- [ ] Team trained on operations
- [ ] Penetration test completed
- [ ] Privacy policy published
- [ ] Terms of service published

---

## Support

- **Documentation:** See DEPLOYMENT.md, SECURITY.md, SETUP_GUIDE.md
- **Issues:** Create issue on GitHub
- **Email:** support@emailautomationpro.com

---

**Status:** Ready for Deployment ✅  
**Last Updated:** 2026-04-30
