import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';

const PRICING_PLANS = [
  {
    name: 'Free',
    tier: 'free',
    price: 0,
    description: 'Perfect for getting started',
    features: [
      'Basic email management',
      'AI categorization',
      'Email summarization (limited)',
      'Smart replies (limited)',
      'Basic analytics',
      'Up to 5 automation rules',
      '50 emails per day',
    ],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: 9.99,
    description: 'For power users and professionals',
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
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    tier: 'enterprise',
    price: null,
    description: 'Custom solutions for large teams',
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
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  // TODO: Add subscription upgrade mutation when implemented
  // const upgradeMutation = trpc.subscription?.upgrade?.useMutation?.();

  const handleUpgrade = async (tier: string) => {
    if (tier === 'enterprise') {
      window.location.href = 'mailto:sales@emailautomationpro.com?subject=Enterprise%20Plan%20Inquiry';
      return;
    }
    if (tier === 'free') return;
    // TODO: Implement Stripe checkout
    console.log('Upgrade to', tier);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your email management needs. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.tier}
              className={`relative flex flex-col p-8 transition-all duration-300 ${
                plan.highlighted
                  ? 'ring-2 ring-blue-500 shadow-xl scale-105'
                  : 'hover:shadow-lg'
              }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  Most Popular
                </Badge>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                {plan.price !== null ? (
                  <>
                    <span className="text-5xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">/month</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    Custom Pricing
                  </span>
                )}
              </div>

              <Button
                onClick={() => handleUpgrade(plan.tier)}
                variant={plan.highlighted ? 'default' : 'outline'}
                className="w-full mb-8"
                disabled={plan.tier === 'free'}
              >
                {plan.cta}
              </Button>

              <div className="space-y-4 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                question: 'Can I change my plan anytime?',
                answer:
                  'Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
              },
              {
                question: 'Do you offer refunds?',
                answer:
                  'We offer a 14-day money-back guarantee. If you\'re not satisfied, contact our support team for a full refund.',
              },
              {
                question: 'Is there a free trial?',
                answer:
                  'Yes! All paid plans include a 14-day free trial. No credit card required to start.',
              },
              {
                question: 'What payment methods do you accept?',
                answer:
                  'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal through Stripe.',
              },
              {
                question: 'Can I get a discount for annual billing?',
                answer:
                  'Yes! Annual plans come with a 20% discount compared to monthly billing.',
              },
              {
                question: 'What if I need more than Pro?',
                answer:
                  'Contact our sales team for a custom Enterprise plan tailored to your needs.',
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-blue-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of professionals managing their emails smarter.
          </p>
          <Button
            onClick={() => handleUpgrade('pro')}
            variant="secondary"
            className="px-8 py-3 text-lg"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
}
