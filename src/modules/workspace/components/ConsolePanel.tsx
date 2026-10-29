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
  X,
  Download,
  Eye,
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
import { ConsoleEvent, WorkspaceArtifact } from "../types/Types";
import {
  downloadArtifact,
  fetchArtifactContent,
} from "../utils/fileDownloadUtils";

interface ConsolePanelProps {
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onClose?: () => void;
  canClose?: boolean;
  className?: string;
  baseUrl?: string;
  showToast?: (message: string, type: "success" | "error") => void;
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({
  isMaximized = false,
  onToggleMaximize,
  onClose,
  canClose = true,
  className = "",
  baseUrl,
  showToast,
}) => {
  const { t } = useTranslation();
  const { events, pendingPrompts, latestArtifacts, sendInput, clearEvents } =
    useConsole();

  const effectiveBaseUrl =
    baseUrl ||
    (typeof window !== "undefined" &&
      (window as unknown as { __YALLMA3_BASE_URL__?: string })
        .__YALLMA3_BASE_URL__) ||
    import.meta.env.VITE_CORE_URL ||
    "http://localhost:3001";

  // Local state
  const [consoleInput, setConsoleInput] = useState("");
  const [isConsoleRunning, setIsConsoleRunning] = useState(true);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [downloadingArtifact, setDownloadingArtifact] = useState<string | null>(
    null
  );

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

  const handlePreviewArtifact = async (artifact: WorkspaceArtifact) => {
    try {
      setPreviewLoading(artifact.filename);
      const content = await fetchArtifactContent(artifact, effectiveBaseUrl);
      setSelectedEvent({
        id: `artifact-${artifact.filename}`,
        timestamp: Date.now(),
        type: "success",
        message: `Artifact: ${artifact.filename}`,
        results: content,
      });
      setIsResultDialogOpen(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      showToast?.(errorMsg, "error");
    } finally {
      setPreviewLoading(null);
    }
  };

  const handleDownloadArtifact = async (artifact: WorkspaceArtifact) => {
    try {
      setDownloadingArtifact(artifact.filename);
      await downloadArtifact(artifact, effectiveBaseUrl, { showToast });
    } catch {
      // Handled via showToast in downloadArtifact
    } finally {
      setDownloadingArtifact(null);
    }
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

            {/* Close Button */}
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={!canClose}
                className={`h-9 w-9 p-0 border-0 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800 transition-opacity ${
                  !canClose ? "opacity-30 cursor-not-allowed" : ""
                }`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
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

          {/* Execution Output Artifacts */}
          {latestArtifacts && latestArtifacts.length > 0 && (
            <div className="border-t border-zinc-800 bg-zinc-950/70 px-3 py-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-[#FFC72C]" />
                  {t("workspaceTab.executionArtifacts", "Execution Output Artifacts")}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {latestArtifacts.length} {latestArtifacts.length === 1 ? "file" : "files"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {latestArtifacts.map((artifact) => (
                  <div
                    key={artifact.filename}
                    className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-md px-2.5 py-1 text-xs font-mono transition-colors"
                  >
                    <span
                      className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                        artifact.format === "json"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {artifact.format.toUpperCase()}
                    </span>
                    <span
                      className="text-zinc-300 max-w-[200px] truncate select-all"
                      title={artifact.filename}
                    >
                      {artifact.filename}
                    </span>
                    <div className="flex items-center gap-1 border-l border-zinc-800 pl-1.5">
                      <button
                        type="button"
                        onClick={() => handlePreviewArtifact(artifact)}
                        disabled={previewLoading === artifact.filename}
                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 cursor-pointer"
                        title={t("workspaceTab.previewArtifact", "Preview artifact content")}
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadArtifact(artifact)}
                        disabled={downloadingArtifact === artifact.filename}
                        className="p-1 rounded text-[#FFC72C] hover:text-[#FFB300] hover:bg-zinc-800 transition-colors disabled:opacity-40 cursor-pointer"
                        title={t("workspaceTab.downloadArtifact", "Download artifact")}
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
