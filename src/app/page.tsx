'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

const ShaderAnimation = dynamic(() => import('@/components/ui/shader-animation').then(mod => mod.ShaderAnimation), {
    ssr: false,
});
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { LandingHeader as Header } from '@/components/ui/landing-header';
import { LandingFooter as Footer } from '@/components/ui/landing-footer';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { DownloadShowcase } from '@/components/ui/download-options-section';
import { Sparkles, ArrowRight, Image, Video, Search, Zap, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

export default function Landing() {
    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Shader Background */}
            <ShaderAnimation />

            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

            {/* Navigation Header */}
            <Header />

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col pt-16">
                {/* Hero Section */}
                <main className="flex-1 flex flex-col px-6 py-12 gap-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-6xl mx-auto"
                    >
                        {/* NanoLink AGI Acquisition Badge */}
                        <Link href="#" className="flex justify-center mb-6">
                            <div className="group rounded-full border border-white/10 bg-white/5 text-base transition-all ease-in hover:cursor-pointer hover:bg-white/10">
                                <AnimatedShinyText shimmerWidth={100} className="inline-flex items-center justify-center px-4 py-1 transition ease-out">
                                    <Cpu className="w-4 h-4 mr-2" />
                                    <span>NanoLink AGI Acquired</span>
                                    <ArrowRight className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                                </AnimatedShinyText>
                            </div>
                        </Link>

                        {/* Main Heading */}
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 text-center text-white">
                            Meet Tripplet
                        </h1>

                        {/* Spline 3D Card */}
                        <Card className="w-full h-[500px] bg-black/40 relative overflow-hidden border-white/10">
                            <Spotlight
                                className="-top-40 left-0 md:left-60 md:-top-20"
                                fill="white"
                            />

                            <div className="flex h-full">
                                {/* Left content */}
                                <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
                                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                        Tripplet Hefai
                                    </h2>

                                    <p className="text-lg text-white/70 max-w-md mb-8">
                                        Our all new model lineup, with a fresh new design, Powered by NanoLink. Generate images & videos, search the web, and have meaningful conversations, and yes we did stop using synthara.
                                    </p>

                                    <div className="flex flex-wrap gap-4">
                                        <Link href="/chat">
                                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl">
                                                Start Chatting
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </Button>
                                        </Link>
                                        <Link href="/images">
                                            <Button size="lg" variant="outline" className="bg-white border-white text-black hover:bg-white/90 px-8 py-6 text-lg rounded-xl">
                                                Explore Vision
                                                <Sparkles className="w-5 h-5 ml-2 text-black" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Right content - 3D Robot */}
                                <div className="flex-1 relative hidden md:block">
                                    <SplineScene
                                        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                                        className="w-full h-full"
                                    />
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Features Grid with Glowing Effect */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="w-full max-w-6xl mx-auto"
                    >
                        <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
                            <GridItem
                                area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
                                icon={<Image className="h-4 w-4 text-white" />}
                                title="Image Generation"
                                description="Create stunning AI-generated images from text descriptions."
                            />
                            <GridItem
                                area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
                                icon={<Video className="h-4 w-4 text-white" />}
                                title="Video Generation"
                                description="Transform your ideas into captivating videos with AI."
                            />
                            <GridItem
                                area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/9]"
                                icon={<Sparkles className="h-4 w-4 text-white" />}
                                title="Powered by NanoLink"
                                description="Built on cutting-edge AI technology for natural, intelligent conversations that understand context and deliver meaningful responses."
                            />
                            <GridItem
                                area="md:[grid-area:2/7/3/13] xl:[grid-area:1/9/2/13]"
                                icon={<Search className="h-4 w-4 text-white" />}
                                title="Web Search"
                                description="Access real-time information from the web instantly."
                            />
                            <GridItem
                                area="md:[grid-area:3/1/4/13] xl:[grid-area:2/9/3/13]"
                                icon={<Zap className="h-4 w-4 text-white" />}
                                title="Lightning Fast"
                                description="Get instant responses with our optimized AI infrastructure."
                            />
                        </ul>
                    </motion.div>

                    {/* Download Options Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="w-full max-w-6xl mx-auto"
                    >
                        <DownloadShowcase />
                    </motion.div>
                </main>

                {/* Footer */}
                <Footer />
            </div>
        </div>
    );
}

interface GridItemProps {
    area: string;
    icon: React.ReactNode;
    title: string;
    description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
    return (
        <li className={cn("min-h-[14rem] list-none", area)}>
            <div className="relative h-full rounded-2xl border border-white/10 p-2 md:rounded-3xl md:p-3">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-6 md:p-6 backdrop-blur-sm">
                    <div className="relative flex flex-1 flex-col justify-between gap-3">
                        <div className="w-fit rounded-lg border border-white/10 bg-white/5 p-2">
                            {icon}
                        </div>
                        <div className="space-y-3">
                            <h3 className="pt-0.5 text-xl font-semibold text-white">
                                {title}
                            </h3>
                            <p className="text-sm text-white/60 leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};