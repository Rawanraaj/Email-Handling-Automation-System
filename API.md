# Azlor - API Documentation

## Overview

Azlor uses tRPC for type-safe API communication. All endpoints are accessed through `/api/trpc/` and require authentication via OAuth 2.0.

## Authentication

All API calls require a valid session cookie obtained through Manus OAuth. The session is automatically managed by the client.

```typescript
// Example: Authenticated request
const response = await fetch('/api/trpc/emails.getInbox?input={"limit":50}', {
  credentials: 'include', // Include cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Email Endpoints

### Get Inbox

Retrieve user's inbox emails with pagination and filtering.

**Endpoint:** `emails.getInbox`

**Input:**
```typescript
{
  limit?: number;        // Default: 50, Max: 100
  offset?: number;       // Default: 0
  category?: string;     // Filter by category
  unreadOnly?: boolean;  // Show only unread
}
```

**Response:**
```typescript
[
  {
    id: number;
    gmailId: string;
    from: string;
    senderName?: string;
    to: string[];
    subject: string;
    preview: string;
    receivedAt: Date;
    isRead: boolean;
    isStarred: boolean;
    category: "Work" | "Personal" | "Promotions" | "Urgent" | "Other";
    aiScore?: number;
    threadId?: string;
  }
]
```

### Get Email by ID

Retrieve full email details.

**Endpoint:** `emails.getById`

**Input:**
```typescript
{
  emailId: number;
}
```

**Response:**
```typescript
{
  id: number;
  gmailId: string;
  from: string;
  senderName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  htmlContent?: string;
  receivedAt: Date;
  isRead: boolean;
  isStarred: boolean;
  category: string;
  aiScore?: number;
  summary?: string;
  suggestedReplies?: string[];
}
```

### Update Read Status

Mark email as read or unread.

**Endpoint:** `emails.updateReadStatus`

**Input:**
```typescript
{
  emailId: number;
  isRead: boolean;
}
```

**Response:**
```typescript
{
  success: boolean;
}
```

### Update Starred Status

Star or unstar an email.

**Endpoint:** `emails.updateStarred`

**Input:**
```typescript
{
  emailId: number;
  isStarred: boolean;
}
```

**Response:**
```typescript
{
  success: boolean;
}
```

### Send Email

Send a new email or reply.

**Endpoint:** `emails.send`

**Input:**
```typescript
{
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  inReplyTo?: number;
  isDraft?: boolean;
}
```

**Response:**
```typescript
{
  success: boolean;
  messageId: string;
  draftId?: number;
}
```

## AI Endpoints

### Categorize Email

Automatically categorize an email using AI.

**Endpoint:** `ai.categorizeEmail`

**Input:**
```typescript
{
  emailId: number;
}
```

**Response:**
```typescript
{
  category: "Work" | "Personal" | "Promotions" | "Urgent" | "Other";
  confidence: number;
}
```

### Summarize Email

Generate AI summary of email content.

**Endpoint:** `ai.summarizeEmail`

**Input:**
```typescript
{
  emailId: number;
}
```

**Response:**
```typescript
{
  summary: string;
  keyPoints: string[];
  sentiment: "positive" | "neutral" | "negative";
}
```

### Generate Reply Suggestions

Generate 2-3 contextual reply suggestions.

**Endpoint:** `ai.generateReplies`

**Input:**
```typescript
{
  emailId: number;
  tone?: "professional" | "casual" | "formal";
}
```

**Response:**
```typescript
{
  suggestions: [
    {
      id: string;
      text: string;
      tone: string;
    }
  ];
}
```

## Rules Endpoints

### Get All Rules

Retrieve all automation rules for the user.

**Endpoint:** `rules.getAll`

**Input:**
```typescript
{}
```

**Response:**
```typescript
[
  {
    id: number;
    name: string;
    description?: string;
    conditions: object;
    actions: object;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
]
```

### Create Rule

Create a new automation rule.

**Endpoint:** `rules.create`

**Input:**
```typescript
{
  name: string;
  description?: string;
  conditions: object;
  actions: object;
  enabled?: boolean;
}
```

**Response:**
```typescript
{
  id: number;
  name: string;
  enabled: boolean;
}
```

### Delete Rule

Delete an automation rule.

**Endpoint:** `rules.delete`

**Input:**
```typescript
{
  ruleId: number;
}
```

**Response:**
```typescript
{
  success: boolean;
}
```

## Analytics Endpoints

### Get Category Distribution

Get email distribution by category.

**Endpoint:** `analytics.getCategoryDistribution`

**Input:**
```typescript
{
  days?: number;
}
```

**Response:**
```typescript
{
  Work: number;
  Personal: number;
  Promotions: number;
  Urgent: number;
  Other: number;
}
```

### Get Top Senders

Get list of top email senders.

**Endpoint:** `analytics.getTopSenders`

**Input:**
```typescript
{
  limit?: number;
  days?: number;
}
```

**Response:**
```typescript
[
  {
    email: string;
    name?: string;
    count: number;
    lastReceived: Date;
  }
]
```

## Error Handling

All endpoints return errors in the following format:

```typescript
{
  error: {
    code: string;
    message: string;
    details?: object;
  }
}
```

### Common Error Codes

| Code | Message | Status |
|------|---------|--------|
| `UNAUTHORIZED` | User not authenticated | 401 |
| `FORBIDDEN` | User lacks permission | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `INVALID_INPUT` | Input validation failed | 400 |
| `RATE_LIMITED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

## Rate Limiting

API calls are rate limited per user:

- **Free Tier:** 100 requests/minute
- **Pro Tier:** 1,000 requests/minute
- **Enterprise:** Unlimited

---

**Last Updated:** 2026-04-29  
**Version:** 1.0.0  
**Status:** Production Ready ✅
