/**
 * @file Card.tsx
 * Design system card with warm Malagasy stone/wood accents.
 */

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "accent";
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  const variantStyles = {
    default: "bg-[#0D0D0D] border border-white/10",
    elevated: "bg-[#121212] border border-white/10 shadow-2xl shadow-black/90",
    accent: "bg-[#141414] border border-[#D4AF37]/30 shadow-lg shadow-[#D4AF37]/5",
  };

  return (
    <div
      className={`rounded-xl p-5 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
