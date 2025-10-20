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
import { ConsoleEvent } from "../types/Types";
import { X, FileText } from "lucide-react";

interface EventResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: ConsoleEvent | null;
}

const EventResultDialog: React.FC<EventResultDialogProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  if (!isOpen || !event || !event.results) return null;

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "info":
        return "text-blue-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "success":
        return "text-green-400";
      case "system":
        return "text-[#9CA3AF]";
      case "input":
        return "text-[#06B6D4]";
      case "user":
        return "text-[#8B5CF6]";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 ">
      <div className="rounded-lg shadow-xl w-full max-w-4xl  border border-[#2A2A2A] bg-[#171717] flex flex-col">
        <div className="px-6 pt-4 pb-4 border-b border-[#FFC72C]/30 bg-[#FFC72C]/10 rounded-t-lg backdrop-blur-sm">
          <div className="flex justify-between items-center">
            {/* LEFT SIDE */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center bg-[#FFC72C]/15 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-[#FFC72C]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-100 leading-tight">
                  Result
                </h2>
                <div className="text-xs text-gray-400 mt-0.5">
                  {formatTimestamp(event.timestamp)} •{" "}
                  <span className={`${getEventColor(event.type)} font-medium`}>
                    {event.type.toUpperCase()}
                  </span>{" "}
                  <span title={event.id}>• {event.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#FFC72Caa] hover:text-[#FFC72C] hover:bg-[#FFC72C]/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results - Main Content with Scroll */}
        <div className="flex-1 max-h-[80vh] overflow-auto p-6">
          <div className="bg-[#1f1f1f] border border-[#333] rounded-lg h-full p-4">
            <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono leading-relaxed">
              {event.results}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventResultDialog;
