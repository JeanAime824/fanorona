/**
 * @file IconButton.tsx
 * Accessible icon button for game controls and toolbars.
 */

import React from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const IconButton: React.FC<IconButtonProps> = ({
  label,
  icon,
  variant = "secondary",
  size = "md",
  className = "",
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const variantStyles = {
    primary:
      "bg-[#D4AF37] hover:bg-[#C19B2D] text-black border border-[#D4AF37] shadow-sm",
    secondary:
      "bg-white/5 hover:bg-white/10 text-white/90 border border-white/10",
    ghost:
      "bg-transparent hover:bg-white/5 text-white/60 hover:text-white",
    danger:
      "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30",
  };

  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37] disabled:opacity-25 disabled:cursor-not-allowed active:scale-95 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};
