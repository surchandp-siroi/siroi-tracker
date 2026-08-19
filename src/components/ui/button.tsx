import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer";

    const variants = {
      default: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm",
      primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/25",
      secondary: "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/10",
      outline: "bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-indigo-500/30 shadow-sm",
      ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white",
      destructive: "bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/20",
      link: "text-indigo-600 dark:text-indigo-400 underline-offset-4 hover:underline p-0 h-auto",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-9.5 px-4 text-xs sm:text-sm",
      lg: "h-11 px-6 text-base",
      icon: "h-9 w-9 p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export const buttonVariants = (options?: { variant?: ButtonProps["variant"]; size?: ButtonProps["size"] }) => {
  const variant = options?.variant || "default";
  const size = options?.size || "md";
  return cn(
    "inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-150",
    variant === "primary" && "bg-indigo-600 text-white hover:bg-indigo-700",
    variant === "secondary" && "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100",
    variant === "outline" && "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10",
    variant === "ghost" && "hover:bg-slate-100 dark:hover:bg-white/5",
    variant === "destructive" && "bg-rose-500 text-white hover:bg-rose-600",
    size === "sm" ? "h-8 px-3 text-xs" : size === "lg" ? "h-11 px-6 text-base" : "h-9.5 px-4 text-xs sm:text-sm"
  );
};
