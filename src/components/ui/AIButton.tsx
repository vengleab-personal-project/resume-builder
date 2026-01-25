"use client";

import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  label?: string;
  variant?: 'ghost' | 'outline' | 'solid';
}

export const AIButton = ({ 
  onClick, 
  loading, 
  label = "AI", 
  className,
  variant = 'outline',
  ...props 
}: AIButtonProps) => {
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
      disabled={loading || props.disabled}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all disabled:opacity-50",
        variant === 'outline' && "bg-indigo-50/50 text-indigo-600 border border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600",
        variant === 'solid' && "bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700",
        variant === 'ghost' && "text-indigo-600 hover:bg-indigo-50",
        className
      )}
      {...props}
    >
      {loading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
      {label}
    </button>
  );
};
