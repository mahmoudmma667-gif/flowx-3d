import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    {
        variants: {
            variant: {
                default:
                    "bg-brand-cyan text-brand-dark hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:scale-105",
                destructive:
                    "bg-red-500 text-white hover:bg-red-600",
                outline:
                    "border border-brand-cyan text-brand-cyan hover:bg-brand-cyan/10",
                secondary:
                    "bg-brand-purple text-white hover:shadow-[0_0_20px_rgba(189,0,255,0.5)] hover:scale-105",
                ghost: "hover:bg-brand-cyan/10 text-brand-cyan",
                link: "text-brand-cyan underline-offset-4 hover:underline",
                glass: "glass text-white hover:bg-white/10 hover:border-brand-cyan/50",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-12 rounded-md px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
