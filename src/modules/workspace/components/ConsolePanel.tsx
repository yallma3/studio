/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Play,
  Pause,
  Trash2,
  Expand,
  Minimize,
  FileText,
  Send,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardContent,
} from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { ScrollArea } from "../../../shared/components/ui/scroll-area";
import EventResultDialog from "./EventResultDialog";
import { useConsole } from "../context/ConsoleContext";
import { ConsoleEvent } from "../types/Types";

interface ConsolePanelProps {
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onClose?: () => void;
  className?: string;
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({
  isMaximized = false,
  onToggleMaximize,
  className = "",
}) => {
  const { t } = useTranslation();
  const { events, pendingPrompts, sendInput, clearEvents } = useConsole();

  // Local state
  const [consoleInput, setConsoleInput] = useState("");
  const [isConsoleRunning, setIsConsoleRunning] = useState(true);

  // Event result dialog state
  const [selectedEvent, setSelectedEvent] = useState<ConsoleEvent | null>(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);

  // Ref for scroll area
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom of console
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  // Scroll to bottom when new events are added
  useEffect(() => {
    if (events.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 0);
    }
  }, [events, scrollToBottom]);

  const handleConsoleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;

    sendInput(consoleInput);
    setConsoleInput("");
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
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

  const handleViewResult = (event: ConsoleEvent) => {
    setSelectedEvent(event);
    setIsResultDialogOpen(true);
  };

  const handleCloseResultDialog = () => {
    setIsResultDialogOpen(false);
    setSelectedEvent(null);
  };

  return (
    <>
      <Card
        className={`bg-zinc-900 border-zinc-800 flex-1 flex flex-col min-h-0 ${className}`}
      >
        <CardHeader className="flex flex-row items-center justify-between py-2 px-3 border-b border-zinc-800 min-h-[40px]">
          {/* Minimal Header */}
          <div className="flex items-center gap-2">
            {/* <Terminal className="h-4 w-4 text-zinc-400" /> */}
            <span className="text-xs font-mono text-zinc-500 font-bold uppercase tracking-wider">
              Console
            </span>
          </div>

          <div className="flex items-center gap-1 mr-8">
            {/* Play/Pause */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConsoleRunning(!isConsoleRunning)}
              className="h-9 w-9 p-0 border-0 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              {isConsoleRunning ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            {/* Clear */}
            <Button
              variant="outline"
              size="sm"
              onClick={clearEvents}
              className="h-9 w-9 p-0 border-0 bg-transparent text-zinc-400 hover:text-white hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* Separator */}
            <div className="w-px h-5 bg-zinc-800 mx-1" />

            {/* Maximize/Restore */}
            {onToggleMaximize && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleMaximize}
                className="h-9 w-9 p-0 border-0 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                {isMaximized ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Expand className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Close/Minimize to button (optional here if we have the X in parent, but good to have) */}
            {/* Use the parent's X button instead for closing to avoid clutter, as requested "make them minimal" */}
          </div>
        </CardHeader>
        {/* ... content ... */}

        <CardContent className="flex-1 flex flex-col min-h-0 ">
          <ScrollArea
            ref={scrollAreaRef}
            className="flex-1 w-full mb-3 pr-3 console-scrollbar"
          >
            <div className="space-y-1 font-mono text-xs">
              {events.length === 0 ? (
                <div className="text-zinc-600 text-center py-8 italic">
                  {t(
                    "workspaceTab.noEvents",
                    "No events to display. Events will appear here as they occur."
                  )}
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-2 p-1.5 rounded hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className="text-zinc-600 text-[10px] min-w-[50px] flex-shrink-0 pt-0.5">
                      {formatTimestamp(event.timestamp)}
                    </span>
                    <span
                      className={`text-[10px] font-medium min-w-[50px] flex-shrink-0 pt-0.5 ${getEventColor(
                        event.type
                      )}`}
                    >
                      [{event.type.toUpperCase()}]
                    </span>
                    <div className="flex items-start justify-between gap-4 w-full">
                      <div className="text-zinc-300 break-words flex-1 leading-relaxed">
                        {event.message}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {event.details && typeof event.details === "string" && (
                          <div className="text-zinc-500 text-[10px] break-words">
                            {event.details}
                          </div>
                        )}
                        {event.results !== undefined &&
                          event.results !== null && (
                            <button
                              onClick={() => handleViewResult(event)}
                              className="text-[#FFC72C] hover:text-[#FFB300] transition-colors p-0.5 rounded hover:bg-zinc-800 cursor-pointer"
                              title={t(
                                "workspaceTab.viewResult",
                                "View result"
                              )}
                            >
                              <FileText className="h-3 w-3" />
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Console Input Form */}
          <form
            onSubmit={handleConsoleInputSubmit}
            className="border-t border-zinc-800 pt-2 pb-1"
          >
            <div className="flex items-center gap-2 bg-zinc-950/30 border border-zinc-800 rounded-md px-3 py-1 focus-within:border-zinc-700 focus-within:bg-zinc-950/50 transition-all">
              <input
                type="text"
                value={consoleInput}
                onChange={(e) => setConsoleInput(e.target.value)}
                placeholder={
                  pendingPrompts.length > 0 && pendingPrompts[0].message
                    ? pendingPrompts[0].message
                    : t("workspaceTab.enterInput", "Enter command...")
                }
                className="flex-1 bg-transparent border-none focus:outline-none text-zinc-300 placeholder:text-zinc-600 text-xs h-7 font-mono"
                disabled={!isConsoleRunning}
              />
              <button
                type="submit"
                className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
                disabled={!isConsoleRunning || !consoleInput.trim()}
                title={t("workspaceTab.send", "Send")}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Event Result Dialog */}
      <EventResultDialog
        isOpen={isResultDialogOpen}
        onClose={handleCloseResultDialog}
        event={selectedEvent}
      />
    </>
  );
};

export default ConsolePanel;
