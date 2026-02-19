import { SignIn } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import Link from 'next/link';

export default function SignInPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center gap-2 mb-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                        <Sparkles className="size-6 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold text-white">Hefai</span>
                    <h1 className="text-2xl font-bold">Sign In Required</h1>
                    <p className="text-sm text-muted-foreground">You've reached the guest message limit</p>
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
    );
}
