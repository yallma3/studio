import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const variantClasses = variant === "secondary" 
    ? "bg-gray-800 text-gray-300" 
    : "bg-[#FFC72C] text-black";
    
  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}; 