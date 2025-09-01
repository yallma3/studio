import React, { forwardRef } from "react";

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, className = "" }, ref) => {
    return (
      <div 
        ref={ref}
        className={`overflow-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 ${className}`}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = "ScrollArea"; 