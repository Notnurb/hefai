import { SignIn } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import Link from 'next/link';
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    return (
        <div className={cn("grid min-h-svh lg:grid-cols-2")}>
            <div className="flex flex-col gap-4 p-6 md:p-10 justify-center">
                <div className="flex justify-center gap-2 md:justify-start mb-8">
                    <Link href="/" className="flex items-center gap-2 font-medium">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <Sparkles className="size-4" />
                        </div>
                        Hefai
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <div className="flex flex-col items-center gap-2 text-center mb-8">
                            <h1 className="text-2xl font-bold">Welcome back</h1>
                            <p className="text-balance text-sm text-muted-foreground">
                                Login to your Hefai account
                            </p>
                        </div>
                        <div className="flex justify-center w-full">
                            <SignIn
                                appearance={{
                                    elements: {
                                        rootBox: "w-full",
                                        card: "bg-transparent shadow-none w-full p-0",
                                        headerTitle: "hidden",
                                        headerSubtitle: "hidden",
                                        socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
                                        socialButtonsBlockButtonText: "text-white font-medium",
                                        dividerLine: "bg-white/10",
                                        dividerText: "text-white/40",
                                        formFieldLabel: "text-white/80",
                                        formFieldInput: "bg-white/5 border-white/10 text-white focus:border-white/20",
                                        emailCodeFieldInput: "bg-white/5 border-white/10 text-white focus:border-white/20",
                                        footer: "hidden",
                                        formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                                        footerActionLink: "text-primary hover:text-primary/90",
                                    }
                                }}
                                path="/login"
                                redirectUrl="/"
                                signUpUrl="/register"
                            />
                        </div>
                        <div className="mt-4 text-center text-sm text-gray-400">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                                Sign up
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <div className="relative hidden bg-muted lg:block">
                <Image
                    src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop"
                    alt="Image"
                    fill
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white/90">
                    <h2 className="text-3xl font-bold mb-4 drop-shadow-md">Unlock Full Potential</h2>
                    <p className="max-w-md text-lg drop-shadow-sm opacity-90">Experience the next generation of AI reasoning with Hefai's advanced models.</p>
                </div>
            </div>
        </div>
    );
}
