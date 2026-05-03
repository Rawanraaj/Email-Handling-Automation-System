# ⚡ Azlor - Quick Start Deployment (30 minutes)

## 🎯 Your Deployment Path

```
Domain Registration (5 min)
        ↓
Render Setup (15 min)
        ↓
Stripe Configuration (5 min)
        ↓
DNS Propagation (24-48 hours)
        ↓
✅ LIVE at azlor.com
```

---

## 📝 Quick Checklist

### 1️⃣ Domain (5 min)
- [ ] Go to https://freenom.com
- [ ] Search `azlor.com` (or your choice)
- [ ] Register 12-month FREE
- [ ] Save nameservers for later

### 2️⃣ Render Database (5 min)
- [ ] Create account at https://render.com
- [ ] New → PostgreSQL
- [ ] Name: `azlor-db`
- [ ] Plan: FREE
- [ ] Copy Database URL

### 3️⃣ Render Deploy (10 min)
- [ ] New → Web Service
- [ ] Connect: `Email-Handling-Automation-System`
- [ ] Build: `pnpm install && pnpm build`
- [ ] Start: `pnpm start`
- [ ] Add environment variables (see below)
- [ ] Deploy

### 4️⃣ Environment Variables
```
NODE_ENV=production
DATABASE_URL=<from PostgreSQL>
JWT_SECRET=<generate random>
VITE_APP_ID=<>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
OWNER_OPEN_ID=<your ID>
OWNER_NAME=Rawan Raaj
OWNER_EMAIL=niroulaaalok54@gmail.com
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<>
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### 5️⃣ Database Migrations
- [ ] In Render Shell, run:
  ```bash
  pnpm drizzle-kit generate
  pnpm drizzle-kit migrate
  ```

### 6️⃣ Custom Domain
- [ ] In Render: Settings → Custom Domain
- [ ] Add: `azlor.com`
- [ ] Copy nameservers

### 7️⃣ Update DNS
- [ ] Go to Freenom domain settings
- [ ] Replace nameservers with Render's
- [ ] Save

### 8️⃣ Stripe Setup
- [ ] Create account at https://stripe.com
- [ ] Get API keys
- [ ] Add to Render environment
- [ ] Configure webhooks

### 9️⃣ Wait & Test
- [ ] Wait 24-48 hours for DNS
- [ ] Visit https://azlor.com
- [ ] Test login
- [ ] Test features

---

## 🔑 Key URLs

| Service | URL |
|---------|-----|
| Domain | https://freenom.com |
| Hosting | https://render.com |
| Payments | https://stripe.com |
| GitHub | https://github.com/Rawanraaj/Email-Handling-Automation-System |
| Your Site | https://azlor.com (after DNS) |

---

## 💡 Pro Tips

1. **Save all passwords/keys** in a secure location
2. **Keep DATABASE_URL safe** - don't share it
3. **Test with Stripe test cards** before going live
4. **Monitor Render logs** for errors
5. **Set up monitoring alerts** for downtime

---

## ❓ Need Help?

See **DEPLOYMENT_INSTRUCTIONS.md** for detailed steps and troubleshooting.

---

**Status:** Ready to Deploy ✅  
**Estimated Time:** 30 minutes + 24-48 hours DNS  
**Cost:** $0 (completely free!)
