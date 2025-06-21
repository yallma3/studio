import React from "react";

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({ children, className = "" }) => {
  return (
    <div className={`overflow-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 ${className}`}>
      {children}
    </div>
  );
}; 