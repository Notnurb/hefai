"use client"

import { useState } from 'react';
import { LandingHeader } from '@/components/ui/landing-header';
import { Video, Play, Download, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export default function VideoPlayground() {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [duration, setDuration] = useState([5]);
    const [ratio, setRatio] = useState('16:9');

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        // Simulate generation
        await new Promise(resolve => setTimeout(resolve, 3000));
        setGeneratedVideo("https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4"); // Placeholder video
        setIsGenerating(false);
    };

    return (
        <div className="min-h-screen bg-black">
            <LandingHeader />

            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Controls */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                    <Video className="w-5 h-5 text-primary" />
                                    Generate Video
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-white/70 block mb-2">Prompt</label>
                                        <Textarea
                                            placeholder="Describe the video you want to generate..."
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            className="h-32 bg-black/50 border-white/10 text-white resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-white/70 block mb-2">Aspect Ratio</label>
                                        <Select value={ratio} onValueChange={(val) => val && setRatio(val)}>
                                            <SelectTrigger className="bg-black/50 border-white/10 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-neutral-900 border-white/10">
                                                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                                                <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                                                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-sm font-medium text-white/70">Duration</label>
                                            <span className="text-xs text-white/50">{duration}s</span>
                                        </div>
                                        <Slider
                                            value={duration}
                                            min={1}
                                            max={10}
                                            step={1}
                                            onValueChange={setDuration}
                                        />
                                    </div>

                                    <Button
                                        className="w-full bg-primary hover:bg-primary/90"
                                        size="lg"
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !prompt}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Generate Video
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="lg:col-span-2">
                            <div className="aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 relative flex items-center justify-center">
                                {generatedVideo ? (
                                    <video
                                        src={generatedVideo}
                                        controls
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        loop
                                    />
                                ) : (
                                    <div className="text-center p-8">
                                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                            <Play className="w-8 h-8 text-white/20" />
                                        </div>
                                        <p className="text-white/40">Enter a prompt and click generate to create a video</p>
                                    </div>
                                )}
                            </div>

                            {generatedVideo && (
                                <div className="flex justify-end mt-4">
                                    <Button variant="outline" className="text-white border-white/10 hover:bg-white/5">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
