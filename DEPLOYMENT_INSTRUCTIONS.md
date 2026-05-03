# 🚀 Azlor - Complete Deployment Guide

**Your Professional Email Automation Platform**

Deploy Azlor with a FREE .com domain and FREE hosting. Everything you need is here.

---

## ⏱️ Total Time: ~30 minutes

---

## 📋 PART 1: Get Your Free .com Domain (5 minutes)

### Option A: Freenom (Completely Free - Recommended)

1. **Go to:** https://www.freenom.com
2. **Search for domain:**
   - Try: `azlor.com`, `azlor.io`, `azlor.co`
   - Pick whichever is available
3. **Select 12-month FREE option**
4. **Complete checkout** (no payment needed)
5. **Go to Services → My Domains**
6. **Click your domain → Manage Domain**
7. **Find Nameservers section** - you'll need these in Step 2

### Option B: Namecheap (First year ~$0.88)

1. Go to https://www.namecheap.com
2. Search for your domain
3. Add coupon: `FIRSTYEAR` or similar
4. Complete registration
5. Get nameservers from domain settings

**✅ Domain registered!**

---

## 🔧 PART 2: Deploy to Render (15 minutes)

### Step 2.1: Create Render Account

1. Go to https://render.com
2. Click **Sign up**
3. **Sign up with GitHub** (recommended)
4. Authorize Render to access your GitHub account
5. Complete signup

### Step 2.2: Create PostgreSQL Database

1. In Render dashboard, click **New +**
2. Select **PostgreSQL**
3. Configure:
   - **Name:** `azlor-db`
   - **Database:** `azlor`
   - **User:** `postgres`
   - **Password:** (auto-generated, copy it)
   - **Region:** Choose closest to you
   - **Plan:** FREE
4. Click **Create Database**
5. **Wait 5-10 minutes** for database to initialize
6. Once ready, copy the **Internal Database URL**
   - Format: `postgresql://postgres:PASSWORD@HOST:5432/azlor`
   - **Save this - you'll need it!**

### Step 2.3: Deploy Web Service

1. In Render, click **New +**
2. Select **Web Service**
3. **Connect GitHub Repository:**
   - Search: `Email-Handling-Automation-System`
   - Click **Connect**
4. **Configure:**
   - **Name:** `azlor`
   - **Environment:** `Node`
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Plan:** FREE
   - **Region:** Same as your database
5. **Scroll down to Environment**
6. **Add these environment variables:**

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/azlor
JWT_SECRET=<generate: openssl rand -hex 16>
VITE_APP_ID=<contact-support>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
OWNER_OPEN_ID=<your OpenID>
OWNER_NAME=Rawan Raaj
OWNER_EMAIL=niroulaaalok54@gmail.com
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<>
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

7. Click **Create Web Service**
8. **Wait for deployment** (5-10 minutes)
9. Once deployed, copy your Render URL:
   - Format: `https://azlor-xxxxx.onrender.com`
   - **Save this!**

### Step 2.4: Initialize Database

1. In Render dashboard, go to your service
2. Click **Shell** tab
3. Run these commands:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

4. Wait for migrations to complete
5. ✅ Database is ready!

---

## 🌐 PART 3: Connect Your Custom Domain (5 minutes)

### Step 3.1: Add Domain to Render

1. In Render service dashboard
2. Click **Settings** (top right)
3. Scroll to **Custom Domain**
4. Enter your domain: `azlor.com` (or your chosen domain)
5. Click **Add Custom Domain**
6. Render will show you **4 nameservers**
7. **Copy these nameservers** - you'll need them next

### Step 3.2: Update Domain Nameservers

**In Freenom:**
1. Go to Services → My Domains
2. Click your domain
3. Click **Manage Domain**
4. Find **Nameservers** section
5. Select **Use custom nameservers**
6. **Paste the 4 nameservers from Render**
7. Click **Save**

**In Namecheap:**
1. Go to your domain
2. Click **Manage**
3. Find **Nameservers**
4. Replace with Render's nameservers
5. Save

### Step 3.3: Wait for DNS Propagation

- DNS updates take **24-48 hours**
- You can check status at: https://www.whatsmydns.net
- Enter your domain name
- When all green ✅ - your domain is live!

---

## 💳 PART 4: Configure Stripe (5 minutes)

### Step 4.1: Create Stripe Account

1. Go to https://stripe.com
2. Click **Sign up**
3. Complete registration
4. Verify email

### Step 4.2: Get API Keys

1. In Stripe dashboard, click **Developers**
2. Click **API Keys**
3. You'll see:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)
4. Copy both keys

### Step 4.3: Add Keys to Render

1. Go to Render service
2. Click **Environment**
3. Add new variables:
   - `STRIPE_SECRET_KEY=sk_test_xxxxx`
   - `STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx`
4. Click **Save**
5. Render will auto-redeploy

### Step 4.4: Set Up Webhooks

1. In Stripe: **Developers → Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL:** `https://azlor.com/api/webhooks/stripe`
4. **Events to send:**
   - `payment_intent.succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy **Signing Secret** (whsec_...)
7. Add to Render: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

---

## ✅ PART 5: Test Your Deployment (5 minutes)

### Test 1: Access Your Site

1. Once DNS is live (24-48 hours), visit: **https://azlor.com**
2. You should see the Azlor homepage
3. ✅ Site is live!

### Test 2: Login

1. Click **Sign In**
2. Login with OAuth 2.0
3. ✅ Authentication works!

### Test 3: Test Features

- [ ] Go to Inbox
- [ ] Check email sync
- [ ] Test Analytics
- [ ] Check Settings
- [ ] View Pricing page

### Test 4: Test Payments (Optional)

1. Go to Pricing page
2. Click **Upgrade to Pro**
3. Use Stripe test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. ✅ Payment processing works!

---

## 🎯 Deployment Checklist

**Domain Setup:**
- [ ] Domain registered at Freenom/Namecheap
- [ ] Domain nameservers updated
- [ ] DNS propagated (check at whatsmydns.net)

**Render Setup:**
- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Web service deployed
- [ ] Environment variables added
- [ ] Database migrations run

**Stripe Setup:**
- [ ] Stripe account created
- [ ] API keys added to Render
- [ ] Webhooks configured

**Testing:**
- [ ] Site accessible at azlor.com
- [ ] Login works
- [ ] Email features work
- [ ] Analytics loads
- [ ] Payments work (test card)

---

## 🚨 Troubleshooting

### "Site not found" or "DNS error"

**Solution:**
1. Wait 24-48 hours for DNS propagation
2. Check at: https://www.whatsmydns.net
3. If still not working, verify nameservers in Freenom match Render

### "Database connection error"

**Solution:**
1. Verify DATABASE_URL in Render environment
2. Check PostgreSQL is running
3. Run migrations again: `pnpm drizzle-kit migrate`

### "Login not working"

**Solution:**
1. Verify VITE_APP_ID is correct
2. Check OAUTH_SERVER_URL is set
3. Clear browser cookies and retry

### "Stripe webhook not firing"

**Solution:**
1. Verify webhook URL is correct: `https://azlor.com/api/webhooks/stripe`
2. Check STRIPE_WEBHOOK_SECRET is set
3. Test webhook in Stripe dashboard

### "Render service keeps crashing"

**Solution:**
1. Check logs: Render → Logs tab
2. Verify all environment variables are set
3. Check database is running
4. Restart service: Settings → Restart

---

## 📊 Monitoring & Maintenance

### Daily
- Check Render logs for errors
- Monitor database size

### Weekly
- Review analytics
- Check for failed payments
- Monitor user feedback

### Monthly
- Update dependencies: `pnpm update`
- Security audit: `npm audit`
- Backup verification
- Performance optimization

---

## 💰 Cost Summary

| Service | Cost | Notes |
|---------|------|-------|
| Domain | FREE | Freenom 12-month free |
| Hosting | FREE | Render free tier |
| Database | FREE | 256MB PostgreSQL |
| SSL | FREE | Auto-generated |
| Email | FREE | Gmail MCP |
| **Total** | **$0** | Completely free! |

---

## 🎓 What You Now Have

✅ **Professional Email Automation Platform**
- AI-powered categorization
- Smart reply suggestions
- Automation rules engine
- Advanced analytics
- Stripe payment processing

✅ **Production-Ready Infrastructure**
- Free .com domain
- Free hosting on Render
- PostgreSQL database
- SSL/HTTPS encryption
- Automatic backups
- Scalable architecture

✅ **Business Model**
- Free tier for users
- Pro tier at $9.99/month
- You get free Pro access forever
- Recurring revenue stream

---

## 🚀 Next Steps

1. **Register domain** (Freenom)
2. **Create Render account**
3. **Deploy service**
4. **Update nameservers**
5. **Wait 24-48 hours**
6. **Test at azlor.com**
7. **Start inviting users!**

---

## 📞 Support

If you encounter issues:

1. **Check logs:** Render → Logs tab
2. **Review docs:** See README.md, SECURITY.md, API.md
3. **GitHub issues:** https://github.com/Rawanraaj/Email-Handling-Automation-System/issues

---

## 🎉 Congratulations!

You now have a **production-ready SaaS platform** that:
- ✅ Works for personal use
- ✅ Can serve paying customers
- ✅ Costs $0 to run
- ✅ Scales automatically
- ✅ Is fully secure
- ✅ Has professional branding

**Your Azlor platform is ready to launch! 🚀**

---

**Status:** Ready for Deployment ✅  
**Last Updated:** 2026-04-30  
**Version:** 1.0.0
