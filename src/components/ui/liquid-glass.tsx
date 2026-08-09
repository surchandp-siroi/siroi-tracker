import React from 'react';
import { cn } from '@/components/ui';

export interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowIntensity?: 'none' | 'sm' | 'md' | 'lg';
  shadowIntensity?: 'none' | 'sm' | 'md' | 'lg';
  borderRadius?: string;
  blurIntensity?: 'none' | 'sm' | 'md' | 'lg';
  draggable?: boolean;
}

export function LiquidGlassCard({
  glowIntensity = 'md',
  shadowIntensity = 'md',
  borderRadius = '16px',
  blurIntensity = 'md',
  draggable = false,
  className,
  children,
  ...props
}: LiquidGlassCardProps) {
  const blurClasses = {
    none: 'backdrop-blur-none',
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-xl',
  };

  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-2xl',
  };

  const glowClasses = {
    none: '',
    sm: 'border border-white/30',
    md: 'border border-white/50',
    lg: 'border border-white/70',
  };

  return (
    <div
      className={cn(
        'bg-white/20 dark:bg-black/20',
        blurClasses[blurIntensity],
        shadowClasses[shadowIntensity],
        glowClasses[glowIntensity],
        draggable ? 'cursor-grab active:cursor-grabbing' : '',
        className
      )}
      style={{ borderRadius, boxShadow: shadowIntensity === 'lg' ? '0 8px 32px 0 rgba(31, 38, 135, 0.07)' : undefined }}
      {...props}
    >
      {children}
    </div>
  );
}
