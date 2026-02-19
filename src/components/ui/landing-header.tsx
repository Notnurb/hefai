'use client';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { createPortal } from 'react-dom';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { LucideIcon, Sparkles, Image, Video, Search, MessageSquare, Zap, Users, Star, FileText, Shield, HelpCircle, Code, BookOpen, Terminal, Play, Globe, Compass, MessageCircle, GitBranch } from 'lucide-react';

type LinkItem = {
    title: string;
    href: string;
    icon: LucideIcon;
    description?: string;
};

import { useAuth } from '@/context/AuthContext';
import UserMenu from '@/components/Layout/UserMenu';

export function LandingHeader() {
    const { user, isLoading } = useAuth();
    const [open, setOpen] = React.useState(false);
    const scrolled = useScroll(10);

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    return (
        <header
            className={cn(
                'fixed top-0 z-50 w-full transition-all duration-300',
                scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent',
            )}
        >
            <div className="container mx-auto px-4 flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-white font-semibold text-lg">Hefai</span>
                    </Link>
                    <NavigationMenu className="hidden md:flex">
                        <NavigationMenuList className="gap-1">
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent text-white/80 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10">
                                    Features
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <div className="grid w-[500px] grid-cols-2 gap-1 p-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl">
                                        {featureLinks.map((item, i) => (
                                            <ListItem key={i} {...item} />
                                        ))}
                                    </div>
                                    <div className="border-t border-white/10 bg-black/95 p-3">
                                        <p className="text-sm text-white/60">
                                            Interested?{' '}
                                            <Link href="/chat" className="text-primary hover:underline">
                                                Try Hefai now
                                            </Link>
                                        </p>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent text-white/80 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10">
                                    Company
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <div className="flex w-[400px] gap-1 p-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl">
                                        <div className="flex flex-col gap-1 flex-1">
                                            {companyLinks.map((item, i) => (
                                                <ListItem key={i} {...item} />
                                            ))}
                                        </div>
                                        <div className="flex flex-col gap-1 flex-1">
                                            {companyLinks2.map((item, i) => (
                                                <Link
                                                    key={i}
                                                    href={item.href}
                                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                                >
                                                    <item.icon className="size-4" />
                                                    {item.title}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent text-white/80 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10">
                                    Coder
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <div className="flex w-[500px] gap-1 p-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl">
                                        <div className="flex flex-col gap-1 flex-1">
                                            {coderLinks.map((item, i) => (
                                                <ListItem key={i} {...item} />
                                            ))}
                                        </div>
                                        <div className="flex flex-col gap-1 flex-1">
                                            <p className="px-3 py-2 text-xs font-medium text-white/50 uppercase">Models</p>
                                            {coderModels.map((item, i) => (
                                                <Link
                                                    key={i}
                                                    href={item.href}
                                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                                >
                                                    <item.icon className="size-4 text-primary" />
                                                    {item.title}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="border-t border-white/10 bg-black/95 p-3">
                                        <p className="text-sm text-white/60">
                                            Start building now?{' '}
                                            <Link href="/coder" className="text-primary hover:underline">
                                                Open Coder
                                            </Link>
                                        </p>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href="#" className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                                        Docs
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                <div className="hidden items-center gap-2 md:flex">
                    {isLoading ? (
                        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                    ) : user ? (
                        <UserMenu />
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/chat">
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    Get Started
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                <button
                    onClick={() => setOpen(!open)}
                    className="md:hidden text-white"
                    aria-expanded={open}
                    aria-controls="mobile-menu"
                    aria-label="Toggle menu"
                >
                    <MenuToggleIcon open={open} className="size-6" />
                </button>
            </div>
            <MobileMenu open={open} className="md:hidden">
                <div className="flex flex-col gap-1 px-4">
                    <p className="px-3 py-2 text-xs font-medium text-white/50 uppercase">Features</p>
                    {featureLinks.map((link) => (
                        <MobileLink key={link.title} {...link} />
                    ))}
                    <p className="px-3 py-2 text-xs font-medium text-white/50 uppercase mt-4">Coder</p>
                    {coderLinks.map((link) => (
                        <MobileLink key={link.title} {...link} />
                    ))}
                    <p className="px-3 py-2 text-xs font-medium text-white/50 uppercase mt-4">Company</p>
                    {companyLinks.map((link) => (
                        <MobileLink key={link.title} {...link} />
                    ))}
                    {companyLinks2.map((link) => (
                        <MobileLink key={link.title} {...link} />
                    ))}
                </div>
                <div className="border-t border-white/10 p-4 flex flex-col gap-2 mt-4">
                    {!isLoading && user ? (
                        <Link href="/chat">
                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                                Go to App
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/chat">
                                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                                    Get Started
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </MobileMenu>
        </header>
    );
}

type MobileMenuProps = React.ComponentProps<'div'> & {
    open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
    if (!open || typeof window === 'undefined') return null;

    return createPortal(
        <div
            className={cn(
                'fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-black/95 backdrop-blur-xl',
                className,
            )}
            {...props}
        >
            <div className="flex flex-col py-4">
                {children}
            </div>
        </div>,
        document.body,
    );
}

function MobileLink({ title, href, icon: Icon }: LinkItem) {
    return (
        <Link href={href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <Icon className="size-5" />
            <span>{title}</span>
        </Link>
    );
}

function ListItem({
    title,
    description,
    href,
    icon: Icon,
    className,
}: Omit<React.ComponentProps<'div'>, 'title'> & LinkItem) {
    return (
        <Link
            href={href}
            className={cn(
                'flex items-start gap-3 rounded-lg p-3 hover:bg-white/10 transition-colors',
                className,
            )}
        >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Icon className="size-5 text-primary" />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{title}</span>
                <span className="text-xs text-white/40">{description}</span>
            </div>
        </Link>
    );
}

const featureLinks: LinkItem[] = [
    {
        title: 'Hefai Spark',
        href: '/spark',
        description: 'AI-powered creative assistant',
        icon: Sparkles,
    },
    {
        title: 'Hefai AI Studio',
        href: '/studio',
        description: 'Professional AI content creation',
        icon: Zap,
    },
    {
        title: 'Hefai Insiders Program',
        href: '/insiders',
        description: 'Early access to new features',
        icon: Star,
    },
    {
        title: 'Video Playground',
        href: '/video',
        description: 'Create and edit AI videos',
        icon: Video,
    },
    {
        title: 'Image Playground',
        href: '/image',
        description: 'Generate stunning visuals',
        icon: Image,
    },
    {
        title: 'API',
        href: '#',
        description: 'Build with Hefai',
        icon: Code,
    },
];

const companyLinks: LinkItem[] = [
    {
        title: 'About Us',
        href: '/about',
        description: 'Learn more about Hefai',
        icon: Users,
    },
];

const companyLinks2: LinkItem[] = [
    {
        title: 'Terms of Service',
        href: '#',
        icon: FileText,
    },
    {
        title: 'Privacy Policy',
        href: '#',
        icon: Shield,
    },
    {
        title: 'Help Center',
        href: '#',
        icon: HelpCircle,
    },
];

const coderLinks: LinkItem[] = [
    {
        title: 'Try it',
        href: '/coder',
        description: 'Start building with AI',
        icon: Play,
    },
    {
        title: 'Public Beta',
        href: '#',
        description: 'Latest experimental features',
        icon: Globe,
    },
    {
        title: 'Explore models',
        href: '#',
        description: 'Browse available models',
        icon: Compass,
    },
    {
        title: 'Guide',
        href: '#',
        description: 'Learn how to use Coder',
        icon: BookOpen,
    },
    {
        title: 'Give feedback',
        href: '#',
        description: 'Share your thoughts',
        icon: MessageCircle,
    },
    {
        title: 'Collaborate',
        href: '#',
        description: 'Work with your team',
        icon: GitBranch,
    },
];

const coderModels: LinkItem[] = [
    {
        title: 'Hefai Coder',
        href: '#',
        icon: Terminal,
    },
    {
        title: 'Hefai Coder Advanced',
        href: '#',
        icon: Terminal,
    },
    {
        title: 'Hefai Coder Beta',
        href: '#',
        icon: Terminal,
    },
];

function useScroll(threshold: number) {
    const [scrolled, setScrolled] = React.useState(false);

    const onScroll = React.useCallback(() => {
        setScrolled(window.scrollY > threshold);
    }, [threshold]);

    React.useEffect(() => {
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, [onScroll]);

    React.useEffect(() => {
        onScroll();
    }, [onScroll]);

    return scrolled;
}
