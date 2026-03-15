import React, { ElementType } from 'react';
import { ChevronRight } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  showArrow?: boolean;
  loading?: boolean;
  as?: any;
  to?: string;
  target?: string;
  onClick?: (e: any) => void | Promise<void>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  key?: any;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  icon, 
  showArrow = false, 
  loading = false,
  as: Component = 'button', 
  ...props 
}: ButtonProps) {
  const baseClasses = "relative group overflow-hidden transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none";
  
  const isDisabled = props.disabled || loading;

  if (variant === 'gradient') {
    return (
      <Component 
        className={`${baseClasses} w-full rounded-2xl p-[2px] shadow-[0_0_30px_rgba(217,70,239,0.15)] hover:shadow-[0_0_50px_rgba(217,70,239,0.3)] ${className}`}
        disabled={isDisabled}
        {...props as any}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 animate-gradient-x"></div>
        <div className={`relative bg-zinc-950 group-hover:bg-transparent transition-all w-full rounded-[0.9rem] flex items-center justify-center gap-3 ${size === 'lg' ? 'py-4' : size === 'sm' ? 'py-2' : 'py-3'}`}>
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {icon && <span className="text-fuchsia-500 group-hover:text-white transition-colors">{icon}</span>}
              <span className={`font-black tracking-tighter group-hover:text-white transition-colors uppercase italic ${size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm'}`}>
                {children}
              </span>
              {showArrow && (
                <div className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <ChevronRight className="w-5 h-5 text-white" />
                </div>
              )}
            </>
          )}
        </div>
      </Component>
    );
  }

  const variants = {
    primary: "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20",
    secondary: "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20",
    ghost: "bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white",
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px] rounded-xl",
    md: "px-6 py-3 text-xs rounded-2xl",
    lg: "px-8 py-4 text-lg rounded-2xl",
  };

  return (
    <Component 
      className={`${baseClasses} font-black uppercase tracking-widest ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      {...props as any}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
          {showArrow && <ChevronRight className="w-5 h-5" />}
        </>
      )}
    </Component>
  );
}
