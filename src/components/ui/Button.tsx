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
    "inline-flex items-center justify-center font-medium tracking-wide rounded-lg transition-colors duration-150 select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C8A452] disabled:opacity-35 disabled:cursor-not-allowed active:scale-[0.99]";

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-3.5 py-2 text-xs tracking-wider uppercase font-semibold gap-2",
    lg: "px-5 py-2.5 text-sm tracking-wider uppercase font-semibold gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-[#C8A452] text-[#121110] hover:bg-[#D5B364] border border-[#C8A452] font-semibold",
    secondary:
      "bg-white/[0.05] hover:bg-white/[0.09] text-[#F5F3EE] border border-white/[0.08]",
    danger:
      "bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20",
    outline:
      "bg-transparent hover:bg-white/[0.05] text-[#F5F3EE] border border-white/[0.15]",
    ghost:
      "bg-transparent hover:bg-white/[0.05] text-[#9E9890] hover:text-[#F5F3EE]",
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
