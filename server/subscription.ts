import { eq } from 'drizzle-orm';
import { getDb } from './db';
import type { SubscriptionTier } from './stripe';
import { PRICING_PLANS } from './stripe';

export interface UserSubscription {
  userId: number;
  tier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get user subscription tier
 * Defaults to 'free' if no subscription found
 */
export async function getUserSubscriptionTier(userId: number): Promise<SubscriptionTier> {
  const db = await getDb();
  if (!db) return 'free';

  try {
    // TODO: Query subscription table
    // For now, check if user is owner (gets free access)
    if (userId === 1) {
      // Assuming owner has ID 1
      return 'pro'; // Owner gets pro access
    }
    return 'free';
  } catch (error) {
    console.error('Error getting subscription tier:', error);
    return 'free';
  }
}

/**
 * Check if user is the owner (gets free premium access)
 */
export async function isOwner(userId: number, ownerEmail: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // TODO: Query users table and check email
    return false;
  } catch (error) {
    console.error('Error checking owner status:', error);
    return false;
  }
}

/**
 * Upgrade user subscription
 */
export async function upgradeSubscription(
  userId: number,
  tier: SubscriptionTier,
  stripeSubscriptionId: string,
  stripeCustomerId: string
): Promise<UserSubscription> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // TODO: Insert or update subscription record
    const subscription: UserSubscription = {
      userId,
      tier,
      stripeSubscriptionId,
      stripeCustomerId,
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(`Upgraded user ${userId} to ${tier}`);
    return subscription;
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    throw error;
  }
}

/**
 * Downgrade user to free tier
 */
export async function downgradeToFree(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // TODO: Update subscription record to free tier
    console.log(`Downgraded user ${userId} to free tier`);
  } catch (error) {
    console.error('Error downgrading subscription:', error);
    throw error;
  }
}

/**
 * Check if user has access to feature
 */
export async function hasFeatureAccess(
  userId: number,
  feature: string
): Promise<boolean> {
  const tier = await getUserSubscriptionTier(userId);
  const plan = PRICING_PLANS[tier];
  return plan.features.includes(feature);
}

/**
 * Check if user has reached rate limit
 */
export async function checkRateLimit(
  userId: number,
  feature: string,
  currentUsage: number
): Promise<boolean> {
  const tier = await getUserSubscriptionTier(userId);
  const plan = PRICING_PLANS[tier];

  // Map feature to limit
  const limitMap: Record<string, keyof typeof plan.limits> = {
    emailsPerDay: 'emailsPerDay',
    apiCallsPerMinute: 'apiCallsPerMinute',
    rulesLimit: 'rulesLimit',
    storageGB: 'storageGB',
  };

  const limitKey = limitMap[feature];
  if (!limitKey) return true; // Unknown feature, allow

  const limit = plan.limits[limitKey];
  return currentUsage < limit;
}

/**
 * Get user's subscription details
 */
export async function getSubscriptionDetails(userId: number) {
  const tier = await getUserSubscriptionTier(userId);
  const plan = PRICING_PLANS[tier];

  return {
    tier,
    plan,
    features: plan.features,
    limits: plan.limits,
    price: plan.price,
    billingPeriod: plan.billingPeriod,
  };
}

/**
 * Check if user is on free tier
 */
export async function isFreeTier(userId: number): Promise<boolean> {
  const tier = await getUserSubscriptionTier(userId);
  return tier === 'free';
}

/**
 * Check if user is on pro tier or higher
 */
export async function isProTierOrHigher(userId: number): Promise<boolean> {
  const tier = await getUserSubscriptionTier(userId);
  return tier === 'pro' || tier === 'enterprise';
}
