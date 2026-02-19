import { LandingHeader } from '@/components/ui/landing-header';
import { LandingFooter } from '@/components/ui/landing-footer';
import { Users, Target, Heart, Rocket } from 'lucide-react';

export default function About() {
    return (
        <div className="min-h-screen bg-black">
            <LandingHeader />

            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                    {/* Hero */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-6">
                            <Users className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                            About Hefai
                        </h1>
                        <p className="text-xl text-white/60 max-w-2xl mx-auto">
                            We're building the future of AI-powered creativity, making advanced technology accessible to everyone.
                        </p>
                    </div>

                    {/* Values Grid */}
                    <div className="grid md:grid-cols-3 gap-6 mb-16">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <Target className="w-8 h-8 text-primary mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Our Mission</h3>
                            <p className="text-white/60">To democratize AI and empower creators with intelligent tools that amplify human creativity.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <Heart className="w-8 h-8 text-primary mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Our Values</h3>
                            <p className="text-white/60">Innovation, accessibility, privacy, and putting users first in everything we build.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <Rocket className="w-8 h-8 text-primary mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Our Vision</h3>
                            <p className="text-white/60">A world where AI enhances human potential and creativity knows no bounds.</p>
                        </div>
                    </div>

                    {/* Story */}
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-4">Our Story</h2>
                        <div className="prose prose-invert">
                            <p className="text-white/70 mb-4">
                                Hefai was born from a simple idea: AI should be a creative partner, not just a tool. We saw the potential for artificial intelligence to augment human creativity in ways never before possible.
                            </p>
                            <p className="text-white/70 mb-4">
                                Today, Hefai brings together cutting-edge AI models and makes them accessible through intuitive interfaces. From content creation to design, from coding to research, our platform serves creators of all kinds.
                            </p>
                            <p className="text-white/70">
                                We're just getting started. Join us as we continue to push the boundaries of what's possible with AI.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}
