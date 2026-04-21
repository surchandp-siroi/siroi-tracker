import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simple button component
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-500",
      secondary: "bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-900/20 dark:hover:bg-white/20 border border-slate-900/10 dark:border-white/10",
      danger: "bg-red-500/80 text-white hover:bg-red-600/80",
      ghost: "hover:bg-slate-900/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
    };
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-9 py-2 px-4 text-sm",
      lg: "h-11 px-8 text-lg"
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
          "flex h-9 w-full rounded-md glass-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50",
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
export function Table({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className="w-full overflow-auto"><table className={cn("w-full text-left text-sm", className)}>{children}</table></div>
}
export function TableHeader({ className, children }: { className?: string, children: React.ReactNode }) {
  return <thead className={cn("text-slate-500 text-[10px] uppercase border-b border-black/5 dark:border-white/5", className)}>{children}</thead>
}
export function TableBody({ className, children }: { className?: string, children: React.ReactNode }) {
  return <tbody className={cn("divide-y divide-black/5 dark:divide-white/5", className)}>{children}</tbody>
}
export function TableRow({ className, children }: { className?: string, children: React.ReactNode }) {
  return <tr className={cn("text-slate-700 dark:text-slate-300 transition-colors hover:bg-black/5 dark:hover:dark:bg-white/5 bg-slate-900/5 cursor-default", className)}>{children}</tr>
}
export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("pb-2 font-medium", className)} {...props}>{children}</th>
}
export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("py-3", className)} {...props}>{children}</td>
}
