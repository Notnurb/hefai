"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import NumberFlow from "@number-flow/react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export interface PricingTier {
    name: string
    price: Record<string, number | string>
    description: string
    features: string[]
    cta: string
    href?: string
    highlighted?: boolean
    popular?: boolean
}

interface PricingCardProps {
    tier: PricingTier
    paymentFrequency: string
}

export function PricingCard({ tier, paymentFrequency }: PricingCardProps) {
    const price = tier.price[paymentFrequency]
    const isHighlighted = tier.highlighted
    const isPopular = tier.popular

    return (
        <Card
            className={cn(
                "relative flex flex-col gap-8 overflow-hidden p-6",
                isHighlighted
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground",
                isPopular && "ring-2 ring-brand"
            )}
        >
            {isHighlighted && <HighlightedBackground />}
            {isPopular && <PopularBackground />}

            <h2 className="flex items-center gap-3 text-xl font-medium capitalize">
                {tier.name}
                {isPopular && (
                    <Badge variant="secondary" className="mt-1 z-10">
                        🔥 Most Popular
                    </Badge>
                )}
            </h2>

            <div className="relative h-12">
                {typeof price === "number" ? (
                    <>
                        <NumberFlow
                            format={{
                                style: "currency",
                                currency: "USD",
                                trailingZeroDisplay: "stripIfInteger",
                            }}
                            value={price}
                            className="text-4xl font-medium"
                        />
                        <p className={cn(
                            "-mt-2 text-xs",
                            isHighlighted ? "text-background/70" : "text-muted-foreground"
                        )}>
                            Per ads/week
                        </p>
                    </>
                ) : (
                    <h1 className="text-4xl font-medium">{price}</h1>
                )}
            </div>

            <div className="flex-1 space-y-2">
                <h3 className="text-sm font-medium">{tier.description}</h3>
                <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                        <li
                            key={index}
                            className={cn(
                                "flex items-center gap-2 text-sm font-medium",
                                isHighlighted ? "text-background/80" : "text-muted-foreground"
                            )}
                        >
                            <HugeiconsIcon icon={Tick02Icon} size={16} className="shrink-0" />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>



            {tier.href ? (
                <Link href={tier.href} className="w-full">
                    <Button
                        variant={isHighlighted ? "secondary" : "default"}
                        className="w-full"
                    >
                        {tier.cta}
                        <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="ml-2" />
                    </Button>
                </Link>
            ) : (
                <Button
                    variant={isHighlighted ? "secondary" : "default"}
                    className="w-full"
                >
                    {tier.cta}
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="ml-2" />
                </Button>
            )}
        </Card>
    )
}

const HighlightedBackground = () => (
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
)

const PopularBackground = () => (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
)
