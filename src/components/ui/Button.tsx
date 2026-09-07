/**
 * @file Button.tsx
 * Reusable design system Button component.
 */

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium tracking-wide rounded-lg transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] focus:ring-offset-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs uppercase tracking-widest font-bold gap-2",
    lg: "px-6 py-3 text-sm uppercase tracking-widest font-bold gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-[#D4AF37] text-black hover:bg-[#C19B2D] border border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)] font-bold",
    secondary:
      "bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 shadow-sm",
    danger:
      "bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 shadow-sm",
    outline:
      "bg-transparent hover:bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/40",
    ghost:
      "bg-transparent hover:bg-white/5 text-white/60 hover:text-white",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};
