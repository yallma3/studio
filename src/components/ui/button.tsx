/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React from "react";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "default" | "outline";
  size?: "default" | "lg" | "sm";
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
  const sizeClasses = size === "lg" ? "h-14 text-lg px-6" : size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4";
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