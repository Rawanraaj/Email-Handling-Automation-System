# Azlor

A professional, AI-powered email management system with intelligent categorization, smart replies, automation rules, and comprehensive analytics.

## 🎯 Features

**Intelligent Email Management**
- AI-powered automatic categorization (Work, Personal, Promotions, Urgent)
- One-click email summarization for long threads
- Smart reply suggestions (2-3 contextual drafts)
- Priority inbox with AI scoring

**Email Operations**
- Compose and send emails directly from dashboard
- Save drafts for later editing
- Search and filter by keyword, sender, date, category
- Star/flag important emails
- Mark as read/unread

**Automation & Rules**
- Create custom automation rules based on sender, subject, recipient
- Auto-label, archive, or star emails
- Rule management UI with create/edit/delete
- Automatic rule execution on incoming emails

**Analytics & Insights**
- Email volume trends and statistics
- Top senders analysis
- Category distribution charts
- Response time metrics
- Historical analytics data

**Enterprise Security**
- OAuth 2.0 authentication
- End-to-end encryption
- Rate limiting and DDoS protection
- GDPR compliant
- SOC 2 ready
- Audit logging and monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm package manager
- PostgreSQL database
- Gmail account

### Local Development

```bash
# Clone repository
git clone https://github.com/Rawanraaj/azlor.git
cd azlor

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

### Environment Variables

Create `.env.local` with:

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/email_automation

# Authentication
JWT_SECRET=your-secret-key-here
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# Manus Integration
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Owner Configuration
OWNER_EMAIL=niroulaaalok54@gmail.com
OWNER_NAME=Your Name
```

## 📦 Project Structure

```
azlor/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── lib/              # Utilities and hooks
│   │   └── App.tsx           # Main app component
│   └── index.html
├── server/                    # Express backend
│   ├── routers.ts            # tRPC routes
│   ├── db.ts                 # Database helpers
│   ├── gmail.ts              # Gmail integration
│   ├── emailSync.ts          # Email sync service
│   └── _core/                # Framework code
├── drizzle/                   # Database schema
│   └── schema.ts
├── shared/                    # Shared types
├── DEPLOYMENT.md             # Deployment guide
├── SECURITY.md               # Security documentation
└── package.json
```

## 🛠️ Technology Stack

**Frontend**
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui components
- Recharts for analytics
- Wouter for routing

**Backend**
- Express 4
- tRPC 11
- Drizzle ORM
- PostgreSQL
- Node.js

**Infrastructure**
- Render.com (hosting)
- PostgreSQL (database)
- Stripe (payments)
- Gmail API (email)
- OAuth 2.0 (authentication)

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide for Render
- **[SECURITY.md](./SECURITY.md)** - Security implementation and best practices
- **[API.md](./API.md)** - API documentation and endpoints

## 🔐 Security

Azlor implements enterprise-grade security:

- ✅ HTTPS/TLS encryption
- ✅ OAuth 2.0 authentication
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Audit logging
- ✅ GDPR compliance
- ✅ SOC 2 ready

See [SECURITY.md](./SECURITY.md) for detailed security information.

## 💰 Pricing

**Free Tier**
- 50 emails/day
- Basic categorization
- Limited analytics
- Community support

**Pro Plan** ($9.99/month)
- Unlimited emails
- Advanced AI features
- Full analytics
- Priority support
- Custom rules (up to 50)

**Enterprise** (Custom)
- Dedicated support
- Custom integrations
- SLA guarantee
- Advanced security

## 🚀 Deployment

### One-Click Deployment to Render

1. Fork the repository
2. Connect to Render.com
3. Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
4. Set environment variables
5. Deploy!

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions.

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## 📊 API Documentation

### Authentication

All API endpoints require authentication via OAuth 2.0.

```typescript
// Example: Get inbox
GET /api/trpc/emails.getInbox?input={"limit":50,"offset":0}
```

### Key Endpoints

- `emails.getInbox` - Get inbox emails
- `emails.getByCategory` - Filter by category
- `emails.getPriority` - Get priority inbox
- `ai.categorizeEmail` - Categorize email
- `ai.summarizeEmail` - Summarize email
- `ai.generateReplies` - Generate reply suggestions
- `rules.getAll` - Get automation rules
- `rules.create` - Create new rule
- `analytics.getCategoryDistribution` - Get analytics

See [API.md](./API.md) for complete API reference.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation:** See [DEPLOYMENT.md](./DEPLOYMENT.md) and [SECURITY.md](./SECURITY.md)
- **Issues:** Create an issue on GitHub
- **Email:** support@emailautomationpro.com
- **Security:** security@emailautomationpro.com

## 🙏 Acknowledgments

Built with:
- [React](https://react.dev)
- [Express](https://expressjs.com)
- [tRPC](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

## 📄 Changelog

### Version 1.0.0 (2026-04-29)
- Initial release
- Core email management features
- AI-powered categorization and suggestions
- Automation rules engine
- Analytics dashboard
- Enterprise security implementation

---

**Made with ❤️ by Azlor Team**

**Website:** https://emailautomationpro.com  
**GitHub:** https://github.com/Rawanraaj/azlor  
**Status:** Production Ready ✅
