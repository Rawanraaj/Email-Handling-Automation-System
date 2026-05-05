import Stripe from 'stripe';
import { ENV } from './_core/env';
import { getDb } from './db';
import { subscriptions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(ENV.stripeSecretKey || process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface PricingPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  currency: string;
  billingPeriod: 'month' | 'year';
  features: string[];
  limits: {
    emailsPerDay: number;
    rulesLimit: number;
    storageGB: number;
    apiCallsPerMinute: number;
  };
}

export const PRICING_PLANS: Record<SubscriptionTier, PricingPlan> = {
  free: {
    id: ENV.stripeFreePriceId,
    name: 'Free',
    tier: 'free',
    price: 0,
    currency: 'USD',
    billingPeriod: 'month',
    features: ['Basic email management', 'AI categorization', 'Email summarization (10/month)', 'Smart replies (5/month)', 'Basic analytics', 'Up to 5 automation rules'],
    limits: { emailsPerDay: 50, rulesLimit: 5, storageGB: 1, apiCallsPerMinute: 100 },
  },
  pro: {
    id: ENV.stripeProPriceId,
    name: 'Pro',
    tier: 'pro',
    price: 9.99,
    currency: 'USD',
    billingPeriod: 'month',
    features: ['Unlimited email management', 'Advanced AI features', 'Unlimited summarization', 'Unlimited smart replies', 'Advanced analytics', 'Up to 50 automation rules', 'Priority support'],
    limits: { emailsPerDay: 10000, rulesLimit: 50, storageGB: 100, apiCallsPerMinute: 1000 },
  },
  enterprise: {
    id: ENV.stripeEnterprisePriceId,
    name: 'Enterprise',
    tier: 'enterprise',
    price: 0,
    currency: 'USD',
    billingPeriod: 'year',
    features: ['Everything in Pro', 'Unlimited everything', 'Dedicated support', 'Custom integrations', 'SLA guarantee', 'Advanced security', 'Audit logs', 'Custom branding'],
    limits: { emailsPerDay: 999999, rulesLimit: 999, storageGB: 1000, apiCallsPerMinute: 10000 },
  },
};

export async function createCheckoutSession(userId: number, userEmail: string, tier: SubscriptionTier, returnUrl: string) {
  if (tier === 'free') throw new Error('Cannot create checkout for free tier');
  const plan = PRICING_PLANS[tier];
  if (!plan.id) throw new Error(`Stripe price ID not configured for tier: ${tier}`);

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: `user_${userId}`,
    line_items: [{ price: plan.id, quantity: 1 }],
    mode: 'subscription',
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
    metadata: { userId: userId.toString(), tier },
  });
  return session;
}

export async function getCustomerSubscription(customerId: string) {
  const subs = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
  return subs.data[0] || null;
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}

export async function verifyWebhookSignature(body: string, signature: string, secret: string): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(body, signature, secret);
}

// ============================================================================
// WEBHOOK HANDLERS — All TODOs replaced with real DB updates
// ============================================================================

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = parseInt(subscription.metadata?.userId || '0');
  const tier = (subscription.metadata?.tier || 'pro') as SubscriptionTier;

  if (!userId) {
    console.error('[Stripe] handleSubscriptionCreated: missing userId in metadata');
    return;
  }

  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const periodStart = new Date((subscription.current_period_start as number) * 1000);
  const periodEnd = new Date((subscription.current_period_end as number) * 1000);

  await db
    .insert(subscriptions)
    .values({
      userId,
      tier,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      status: subscription.status as any,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        tier,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id ?? null,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        status: subscription.status as any,
        updatedAt: new Date(),
      },
    });

  console.log(`[Stripe] Subscription created for user ${userId}: ${tier}`);
  return { userId, tier, subscriptionId: subscription.id };
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = parseInt(subscription.metadata?.userId || '0');
  const tier = (subscription.metadata?.tier || 'pro') as SubscriptionTier;

  if (!userId) {
    console.error('[Stripe] handleSubscriptionUpdated: missing userId in metadata');
    return;
  }

  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const periodStart = new Date((subscription.current_period_start as number) * 1000);
  const periodEnd = new Date((subscription.current_period_end as number) * 1000);

  await db
    .update(subscriptions)
    .set({
      tier,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      status: subscription.status as any,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId));

  console.log(`[Stripe] Subscription updated for user ${userId}: ${tier}`);
  return { userId, tier, subscriptionId: subscription.id };
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = parseInt(subscription.metadata?.userId || '0');

  if (!userId) {
    console.error('[Stripe] handleSubscriptionDeleted: missing userId in metadata');
    return;
  }

  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(subscriptions)
    .set({
      tier: 'free',
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      status: 'canceled',
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId));

  console.log(`[Stripe] Subscription deleted for user ${userId}, downgraded to free`);
  return { userId, tier: 'free' };
}

export function getUserTierFromSubscription(subscription: Stripe.Subscription | null): SubscriptionTier {
  if (!subscription || subscription.status !== 'active') return 'free';
  return (subscription.metadata?.tier as SubscriptionTier) || 'pro';
}

export function getFeatureLimitForTier(tier: SubscriptionTier, feature: keyof PricingPlan['limits']): number {
  return PRICING_PLANS[tier].limits[feature];
}

export function formatPrice(plan: PricingPlan): string {
  if (plan.price === 0) return plan.tier === 'free' ? 'Free' : 'Custom';
  return `$${plan.price.toFixed(2)}/${plan.billingPeriod === 'month' ? 'mo' : 'yr'}`;
}
