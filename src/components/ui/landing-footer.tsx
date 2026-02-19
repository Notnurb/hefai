import Link from 'next/link';
import { Sparkles, ExternalLink } from 'lucide-react';

export function LandingFooter() {
    return (
        <footer className="relative z-10 border-t border-white/10 bg-black/60 backdrop-blur-md">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <span className="text-white font-semibold text-lg">Tripplet Hefai</span>
                        </Link>
                        <p className="text-white/50 text-sm">
                            Your early look at Agenetic AGI powered by Nanolink
                        </p>
                    </div>

                    {/* Features */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Features</h3>
                        <ul className="space-y-2">
                            <li><span className="text-white/50 text-sm">Hefai</span></li>
                            <li><span className="text-white/50 text-sm">Tripplet AI Studio</span></li>
                            <li><span className="text-white/50 text-sm">Video Playground</span></li>
                            <li><span className="text-white/50 text-sm">Image Playground</span></li>
                            <li><Link href="#" className="text-white/50 text-sm hover:text-white transition-colors">API</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Company</h3>
                        <ul className="space-y-2">
                            <li><span className="text-white/50 text-sm">About Us</span></li>
                            <li><span className="text-white/50 text-sm">Insiders Program</span></li>
                            <li><span className="text-white/50 text-sm">Terms of Service</span></li>
                            <li><span className="text-white/50 text-sm">Privacy Policy</span></li>
                            <li><span className="text-white/50 text-sm">Help Center</span></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Resources</h3>
                        <ul className="space-y-2">
                            <li><Link href="#" className="text-white/50 text-sm hover:text-white transition-colors">Documentation</Link></li>
                            <li><Link href="/chat" className="text-white/50 text-sm hover:text-white transition-colors">Try Tripplet</Link></li>
                            <li>
                                <a href="https://unlicense.org/" target="_blank" rel="noopener noreferrer" className="text-white/50 text-sm hover:text-white transition-colors inline-flex items-center gap-1">
                                    Unlicense
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 mt-10 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-white/40 text-sm text-center md:text-left">
                            FEBURARY 18TH 2026 | NanoLink && Tripplet
                        </p>
                        <p className="text-white/30 text-xs text-center md:text-right max-w-2xl">
                            This is free and unencumbered software released into the public domain.
                            For more information, please refer to{' '}
                            <a href="https://unlicense.org/" target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary transition-colors">
                                unlicense.org
                            </a>
                        </p>
                    </div>
                </div>

                {/* Full License (collapsible) */}
                <details className="mt-6 group">
                    <summary className="text-white/30 text-xs cursor-pointer hover:text-white/50 transition-colors">
                        View full license
                    </summary>
                    <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs font-mono leading-relaxed">
                        <p className="mb-3">This is free and unencumbered software released into the public domain.</p>
                        <p className="mb-3">Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.</p>
                        <p className="mb-3">In jurisdictions that recognize copyright laws, the author or authors of this software dedicate any and all copyright interest in the software to the public domain. We make this dedication for the benefit of the public at large and to the detriment of our heirs and successors. We intend this dedication to be an overt act of relinquishment in perpetuity of all present and future rights to this software under copyright law.</p>
                        <p className="mb-3">THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>
                        <p>For more information, please refer to <a href="https://unlicense.org/" target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary">https://unlicense.org/</a></p>
                    </div>
                </details>
            </div>
        </footer>
    );
}
