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
    default: "bg-[#161514] border border-white/[0.06]",
    elevated: "bg-[#181615] border border-white/[0.08] shadow-lg shadow-black/60",
    accent: "bg-[#181615] border border-[#C8A452]/25 shadow-sm",
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
