import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simple button component
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer";
    const variants = {
      primary: "bg-button-primary text-text-white shadow-xs inset-shadow-2xs border border-white/10",
      secondary: "bg-background-primary-default text-text-primary hover:bg-background-primary-hover active:bg-background-primary-active border border-border-button-default shadow-xs",
      danger: "bg-button-danger text-text-white shadow-xs hover:opacity-95 active:scale-[0.98]",
      ghost: "hover:bg-background-secondary-hover text-text-secondary hover:text-text-primary"
    };
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-9 py-2 px-4 text-sm",
      lg: "h-11 px-8 text-base"
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

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-9.5 w-full rounded-xl border border-border-button-default bg-background-tertiary-default px-3 py-2 text-sm text-text-primary placeholder:text-text-placeholder transition-all duration-150 outline-none hover:border-border-button-hover focus:border-border-focus-ring focus:ring-2 focus:ring-border-focus-ring/25 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export function Card({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("glass text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden", className)}>{children}</div>;
}

export function CardHeader({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("flex flex-col space-y-1.5 p-4 border-b border-slate-900/10 dark:border-white/10", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string, children: React.ReactNode }) {
  return <h2 className={cn("text-sm font-semibold tracking-tight", className)}>{children}</h2>;
}

export function CardContent({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

// Table components
export function Table({ className, containerClassName, children }: { className?: string, containerClassName?: string, children: React.ReactNode }) {
  return <div className={cn("w-full overflow-auto", containerClassName)}><table className={cn("w-full text-left text-sm", className)}>{children}</table></div>
}
export function TableHeader({ className, children }: { className?: string, children: React.ReactNode }) {
  return <thead className={cn("text-slate-500 text-[10px] uppercase border-b border-black/5 dark:border-white/5", className)}>{children}</thead>
}
export function TableBody({ className, children }: { className?: string, children: React.ReactNode }) {
  return <tbody className={cn("divide-y divide-black/5 dark:divide-white/5", className)}>{children}</tbody>
}
export function TableRow({ className, children }: { className?: string, children: React.ReactNode }) {
  return <tr className={cn("text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100/50 dark:hover:bg-white/5 cursor-default group", className)}>{children}</tr>
}
export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("pb-2 font-medium", className)} {...props}>{children}</th>
}
export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("py-3", className)} {...props}>{children}</td>
}
