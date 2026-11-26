import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// BoardUI Button component
export { Button, ButtonLink, buttonStyles } from "@/components/base/buttons/button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-9.5 w-full rounded-xl border border-border-button-default bg-background-tertiary-default px-3 py-2 text-sm text-text-primary placeholder:text-text-placeholder transition-all duration-150 outline-none hover:border-border-button-hover focus:border-border-focus-ring focus:ring-2 focus:ring-border-focus-ring/25 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("rounded-3xl border border-separator-border bg-background-primary-default text-text-primary shadow-xs flex flex-col overflow-hidden transition-colors", className)} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("flex flex-col space-y-1.5 p-5 border-b border-separator-border", className)} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 
      className={cn("text-title-3-semibold text-text-primary tracking-tight", className)} 
      {...props}
    >
      {children}
    </h2>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("p-5 text-body-regular text-text-secondary", className)} 
      {...props}
    >
      {children}
    </div>
  );
}

// Table components
export function Table({ className, containerClassName, children, ...props }: React.TableHTMLAttributes<HTMLTableElement> & { containerClassName?: string }) {
  return (
    <div className={cn("w-full overflow-x-auto", containerClassName)}>
      <table className={cn("bui-table w-full text-start border-collapse text-body-2-regular text-text-primary", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn("bg-background-secondary-default text-text-tertiary border-y border-separator-border text-caption-1-semibold uppercase tracking-wider", className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("divide-y divide-separator-border", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("text-text-primary transition-colors duration-150 hover:bg-background-secondary-hover cursor-default group border-b border-separator-border last:border-b-0", className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("px-3.5 py-3 text-start align-middle font-semibold text-text-tertiary whitespace-nowrap outline-none", className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-3.5 py-3 align-middle text-text-primary outline-none", className)} {...props}>
      {children}
    </td>
  );
}
