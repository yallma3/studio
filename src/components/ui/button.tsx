import React from "react";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "default" | "outline";
  size?: "default" | "lg";
  className?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  variant = "default", 
  size = "default", 
  className = "",
  disabled = false
}) => {
  const baseClasses = "flex items-center justify-center gap-2 font-medium rounded-lg transition-all";
  const sizeClasses = size === "lg" ? "h-14 text-lg px-6" : "h-10 px-4";
  const variantClasses = variant === "outline" 
    ? "bg-gray-800/50 hover:bg-gray-800 text-white border border-yellow-400/30" 
    : "bg-yellow-400 hover:bg-yellow-500 text-gray-900 border-0";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  
  return (
    <button 
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};