import { cn } from "@/lib/utils";

interface ShinyTextProps {
    text: string;
    disabled?: boolean;
    speed?: number;
    className?: string;
}

export default function ShinyText({ text, disabled = false, speed = 5, className }: ShinyTextProps) {
    const animationDuration = `${speed}s`;

    return (
        <div
            className={cn(
                "py-2 font-medium bg-clip-text text-transparent bg-no-repeat",
                disabled ? "" : "shiny-text",
                className
            )}
            style={{
                backgroundImage: disabled ? 'none' : 'linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                animationDuration: animationDuration,
            }}
        >
            {text}
        </div>
    );
}
