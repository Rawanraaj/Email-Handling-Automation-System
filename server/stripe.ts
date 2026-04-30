import Stripe from 'stripe';
import { ENV } from './_core/env';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-04-22.dahlia',
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
    id: 'price_free',
    name: 'Free',
    tier: 'free',
    price: 0,
    currency: 'USD',
    billingPeriod: 'month',
    features: [
      'Basic email management',
      'AI categorization',
      'Email summarization (limited)',
      'Smart replies (limited)',
      'Basic analytics',
      'Up to 5 automation rules',
    ],
    limits: {
      emailsPerDay: 50,
      rulesLimit: 5,
      storageGB: 1,
      apiCallsPerMinute: 100,
    },
  },
  pro: {
    id: 'price_pro_monthly',
    name: 'Pro',
    tier: 'pro',
    price: 9.99,
    currency: 'USD',
    billingPeriod: 'month',
    features: [
      'Unlimited email management',
      'Advanced AI features',
      'Unlimited summarization',
      'Unlimited smart replies',
      'Advanced analytics',
      'Up to 50 automation rules',
      'Priority support',
      'Custom integrations',
    ],
    limits: {
      emailsPerDay: 10000,
      rulesLimit: 50,
      storageGB: 100,
      apiCallsPerMinute: 1000,
    },
  },
  enterprise: {
    id: 'price_enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    price: 0, // Custom pricing
    currency: 'USD',
    billingPeriod: 'year',
    features: [
      'Everything in Pro',
      'Unlimited everything',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'Advanced security',
      'Audit logs',
      'Custom branding',
    ],
    limits: {
      emailsPerDay: 999999,
      rulesLimit: 999,
      storageGB: 1000,
      apiCallsPerMinute: 10000,
    },
  },
};

export async function createCheckoutSession(
  userId: number,
  userEmail: string,
  tier: SubscriptionTier,
  returnUrl: string
) {
  if (tier === 'free') {
    throw new Error('Cannot create checkout for free tier');
  }

  const plan = PRICING_PLANS[tier];

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: `user_${userId}`,
    line_items: [
      {
        price: plan.id,
        quantity: 1,
      },
    ],
    mode: tier === 'enterprise' ? 'setup' : 'subscription',
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
    metadata: {
      userId: userId.toString(),
      tier,
    },
  });

  return session;
}

export async function getCustomerSubscription(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
  });

  return subscriptions.data[0] || null;
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  return subscription;
}

export async function updateSubscriptionTier(
  subscriptionId: string,
  newTier: SubscriptionTier
) {
  if (newTier === 'free') {
    return cancelSubscription(subscriptionId);
  }

  const plan = PRICING_PLANS[newTier];
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0]!.id,
        price: plan.id,
      },
    ],
  });

  return updatedSubscription;
}

export async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(body, signature, secret);
}

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = parseInt(subscription.metadata?.userId || '0');
  const tier = (subscription.metadata?.tier || 'pro') as SubscriptionTier;

  // Update user subscription in database
  // TODO: Implement database update
  console.log(`Subscription created for user ${userId}: ${tier}`);

  return {
    userId,
    tier,
    subscriptionId: subscription.id,
  };
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = parseInt(subscription.metadata?.userId || '0');
  const tier = (subscription.metadata?.tier || 'pro') as SubscriptionTier;

  // Update user subscription in database
  // TODO: Implement database update
  console.log(`Subscription updated for user ${userId}: ${tier}`);

  return {
    userId,
    tier,
    subscriptionId: subscription.id,
  };
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = parseInt(subscription.metadata?.userId || '0');

  // Downgrade user to free tier
  // TODO: Implement database update
  console.log(`Subscription deleted for user ${userId}, downgrading to free`);

  return {
    userId,
    tier: 'free',
  };
}

export function getUserTierFromSubscription(
  subscription: Stripe.Subscription | null
): SubscriptionTier {
  if (!subscription || subscription.status !== 'active') {
    return 'free';
  }

  return (subscription.metadata?.tier as SubscriptionTier) || 'pro';
}

export function getFeatureLimitForTier(
  tier: SubscriptionTier,
  feature: keyof PricingPlan['limits']
): number {
  return PRICING_PLANS[tier].limits[feature];
}

export async function checkFeatureAccess(
  userId: number,
  tier: SubscriptionTier,
  feature: string
): Promise<boolean> {
  const plan = PRICING_PLANS[tier];
  return plan.features.includes(feature);
}

export function formatPrice(plan: PricingPlan): string {
  if (plan.price === 0) {
    return 'Free';
  }
  return `$${plan.price.toFixed(2)}/${plan.billingPeriod === 'month' ? 'mo' : 'yr'}`;
}
