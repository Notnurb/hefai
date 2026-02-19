'use client';

import { PricingSection } from '@/components/ui/pricing-section';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/context/SubscriptionContext';

const PAYMENT_FREQUENCIES = ['monthly', 'yearly'];

const TIERS = [
    {
        id: 'go',
        name: 'Go',
        price: { monthly: 8, yearly: 5 },
        description: 'Get started with Hefai',
        features: ['8 ads per week', 'Access to Suzhou 3', 'Standard response speed', 'Basic file uploads', 'Chat history (7 days)'],
        cta: 'Get Started',
        href: '#', // Handled by click
    },
    {
        id: 'builder',
        name: 'Builder',
        price: { monthly: 16, yearly: 10 },
        description: 'For creators and developers',
        features: ['16 ads per week', 'Access to Majuli 3', 'Faster response speed', 'Image analysis (Vision)', 'Chat history (30 days)', 'Priority support'],
        cta: 'Get Started',
        popular: true,
        href: '#',
    },
    {
        id: 'plus',
        name: 'Plus',
        price: { monthly: 20, yearly: 13 },
        description: 'For power users',
        features: ['20 ads per week', 'Access to Taipei 3 + Majuli 3', 'Deep Think mode', 'Extended reasoning', 'Unlimited file uploads', 'Chat history (90 days)'],
        cta: 'Get Started',
        href: '#',
    },
    {
        id: 'max',
        name: 'Max',
        price: { monthly: 150, yearly: 100 },
        description: 'For teams and enterprises',
        features: ['150 ads per week', 'All models unlocked', 'Anura OS sandbox access', 'Custom system prompts', 'Unlimited history', 'API access', 'Dedicated support'],
        cta: 'Get Started',
        highlighted: true,
        href: '#',
    },
];

export default function SubscribePage() {
    const router = useRouter();
    const { plan, isSubscribed, toggleSubscription } = useSubscription();

    const handleSubscribe = (tierId: string) => {
        // Mock subscription process
        toggleSubscription(tierId as any);
        alert(`Successfully subscribed to ${tierId.toUpperCase()} plan!`);
        setTimeout(() => {
            router.push('/chat');
        }, 1000);
    };

    // Transform tiers to include click handler logic
    const interactiveTiers = TIERS.map(tier => ({
        ...tier,
        cta: plan === tier.id ? 'Current Plan' : (isSubscribed ? 'Switch Plan' : 'Subscribe'),
        highlighted: plan === tier.id || tier.highlighted,
        onClick: () => router.push(`/subscribe/checkout?plan=${tier.id}`),
    }));

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="p-4 flex justify-between items-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/chat')}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                    Back to Chat
                </Button>

                {isSubscribed && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            toggleSubscription('free');
                            alert("Unsubscribed successfully.");
                        }}
                    >
                        Cancel Subscription
                    </Button>
                )}
            </div>
            <div className="flex-1 flex justify-center items-start px-4 pb-12">
                <div className="w-full max-w-6xl">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">Simple Pricing</h2>
                        <p className="text-muted-foreground text-lg">
                            {isSubscribed
                                ? `You are currently on the ${plan.toUpperCase()} plan.`
                                : "Choose the best plan for your needs. All plans include core Hefai features."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {interactiveTiers.map((tier) => (
                            <div key={tier.id} className={`relative flex flex-col p-6 rounded-2xl border ${tier.highlighted ? 'border-primary/50 shadow-lg bg-primary/5' : 'border-border bg-card'}`}>
                                {tier.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                                        MOST POPULAR
                                    </div>
                                )}
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold">{tier.name}</h3>
                                    <p className="text-muted-foreground text-sm mt-1">{tier.description}</p>
                                </div>
                                <div className="mb-6">
                                    <span className="text-3xl font-bold">${tier.price.monthly}</span>
                                    <span className="text-muted-foreground">/mo</span>
                                </div>
                                <ul className="flex-1 space-y-3 mb-6">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-center text-sm gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className="w-full"
                                    variant={tier.highlighted ? "default" : "outline"}
                                    onClick={tier.onClick}
                                    disabled={plan === tier.id}
                                >
                                    {tier.cta}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
