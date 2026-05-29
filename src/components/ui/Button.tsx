import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'outline' | 'red' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'gold', size = 'md', ...props }, ref) => {
    const variants = {
      gold: 'bg-[#C9A96E] text-[#1E1A18] hover:bg-[#D4B985] shadow-lg shadow-[#C9A96E11]',
      outline: 'border border-[#3D3834] text-[#E8E2D9] hover:bg-[#2A2624]',
      red: 'bg-[#C45C2A] text-[#E8E2D9] hover:bg-[#D46C3A] shadow-lg shadow-[#C45C2A11]',
      ghost: 'text-[#6B6560] hover:text-[#E8E2D9]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-6 py-3',
      lg: 'px-8 py-4 text-lg',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'rounded-full font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
