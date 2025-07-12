/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";

interface TooltipHelperProps {
  text: string;
  size?: number;
  position?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export const TooltipHelper: React.FC<TooltipHelperProps> = ({
  text,
  size = 16,
  position = "top",
  className = "",
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Position styles for the tooltip
  const getPositionStyles = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        className="cursor-help text-gray-400 hover:text-yellow-400 transition-colors"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <HelpCircle size={size} />
      </div>
      
      {showTooltip && (
        <div
          className={`absolute z-50 ${getPositionStyles()} bg-zinc-800 text-white text-sm px-3 py-2 rounded-md shadow-lg border border-zinc-700 min-w-[200px] whitespace-normal`}
        >
          {text}
          {/* Arrow/pointer */}
          {position === "top" && (
            <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-2 h-2 bg-zinc-800 rotate-45 border-r border-b border-zinc-700"></div>
          )}
          {position === "right" && (
            <div className="absolute top-1/2 transform -translate-y-1/2 -left-1 w-2 h-2 bg-zinc-800 rotate-45 border-l border-b border-zinc-700"></div>
          )}
          {position === "bottom" && (
            <div className="absolute left-1/2 transform -translate-x-1/2 -top-1 w-2 h-2 bg-zinc-800 rotate-45 border-l border-t border-zinc-700"></div>
          )}
          {position === "left" && (
            <div className="absolute top-1/2 transform -translate-y-1/2 -right-1 w-2 h-2 bg-zinc-800 rotate-45 border-r border-t border-zinc-700"></div>
          )}
        </div>
      )}
    </div>
  );
};
