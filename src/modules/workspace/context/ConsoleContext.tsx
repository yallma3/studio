/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ConsoleEvent, WorkspaceArtifact, WorkspaceArtifactsPayload } from "../types/Types";
import { sidecarClient, SidecarCommand } from "../../api/SidecarClient";

export interface PendingPromptData {
  promptId: string;
  nodeId: number;
  nodeName?: string;
  message: string;
  timestamp: number;
  inputValue: string;
}

interface ConsoleContextType {
  events: ConsoleEvent[];
  pendingPrompts: PendingPromptData[];
  latestArtifacts: WorkspaceArtifact[];
  addEvent: (event: ConsoleEvent) => void;
  sendInput: (input: string) => void;
  clearEvents: () => void;
  clearArtifacts: () => void;
}

const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

interface ConsoleProviderProps {
  children: React.ReactNode;
  workspaceId: string;
}

export const ConsoleProvider: React.FC<ConsoleProviderProps> = ({
  children,
  workspaceId,
}) => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<ConsoleEvent[]>([]);
  const [pendingPrompts, setPendingPrompts] = useState<PendingPromptData[]>([]);
  const [consumedPromptIds, setConsumedPromptIds] = useState<string[]>([]);
  const [latestArtifacts, setLatestArtifacts] = useState<WorkspaceArtifact[]>([]);

  const WAITING_FOR_INPUT = t(
    "workspaceTab.waitingForInput",
    "Waiting for user input"
  );

  const addEvent = useCallback((event: ConsoleEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setPendingPrompts([]);
    setConsumedPromptIds([]);
    setLatestArtifacts([]);
  }, []);

  const clearArtifacts = useCallback(() => {
    setLatestArtifacts([]);
  }, []);

  const sendInput = useCallback(
    async (input: string) => {
      if (!input.trim()) return;

      let newEvent: ConsoleEvent;

      if (pendingPrompts.length > 0) {
        const currentPrompt = pendingPrompts[0];

        newEvent = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          timestamp: Date.now(),
          type: "user",
          message: input,
          details: t("workspaceTab.userInput", "User input"),
          promptId: currentPrompt.promptId,
        };

        // Remove the prompt from pending list and mark as consumed
        setPendingPrompts((prev) =>
          prev.filter((p) => p.promptId !== currentPrompt.promptId)
        );
        setConsumedPromptIds((prev) => [...prev, currentPrompt.promptId]);
      } else {
        // No pending prompt, just add as regular console input
        newEvent = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          type: "user",
          message: input,
          details: t("workspaceTab.userInput", "User input"),
        };
      }

      console.log("Sending console input via WebSocket:", newEvent);

      // Update local state
      addEvent(newEvent);

      // Send via Sidecar
      const message: SidecarCommand = {
        requestId: crypto.randomUUID(),
        type: "console_input",
        workspaceId: workspaceId,
        data: newEvent,
        timestamp: new Date().toISOString(),
      };
      try {
        await sidecarClient.sendMessage(message).promise;
      } catch (error) {
        console.error("Failed to send console input:", error);
      }
    },
    [pendingPrompts, t, addEvent, workspaceId]
  );

  // Handle adding new pending prompts from console events - ONE AT A TIME
  useEffect(() => {
    if (pendingPrompts.length === 0) {
      const newPrompt = events.find(
        (event) =>
          event.type === "input" &&
          event.promptId &&
          event.details === WAITING_FOR_INPUT &&
          !consumedPromptIds.includes(event.promptId)
      );

      if (newPrompt) {
        setPendingPrompts([
          {
            promptId: newPrompt.promptId!,
            nodeId: newPrompt.nodeId || 0,
            nodeName:
              newPrompt.nodeName ||
              t("workspaceTab.unknownNode", "Unknown Node"),
            message: newPrompt.message,
            timestamp: newPrompt.timestamp,
            inputValue: "",
          },
        ]);
      }
    }
  }, [events, pendingPrompts, consumedPromptIds, t, WAITING_FOR_INPUT]);

  // Subscribe to Sidecar events
  useEffect(() => {
    const handleSidecarCommand = (command: SidecarCommand) => {
      try {
        // Handle console prompts and inputs (echoed back or from other sources)
        if (
          command.type === "console_prompt" ||
          command.type === "console_input"
        ) {
          if (command.data && typeof command.data === "object") {
            const event = command.data as ConsoleEvent;
            addEvent(event);
          }
        }

        // Handle general messages
        if (command.type === "message") {
          if (command.data && typeof command.data === "object") {
            addEvent(command.data as ConsoleEvent);
          }
        }

        if (command.type === "error") {
          const err = command as SidecarCommand & { code?: string; message?: string };
          console.error("Server error:", err);
          const displayMsg =
            err.code === "WORKSPACE_FAILED"
              ? err.message || "Workspace execution failed"
              : err.code === "INTERNAL_ERROR"
              ? `Server error: ${err.message || "Unknown error"}`
              : err.message || `Error: ${err.code || "Unknown error"}`;
          addEvent({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            type: "error",
            message: displayMsg,
            timestamp: Date.now(),
          });
        }

        // Handle resolved console input logging
        if (command.type === "console_input_resolved") {
          if (command.data && typeof command.data === "object") {
            const { promptId, message } = command.data as {
              promptId: string;
              message: string;
            };
            console.log(
              `Console input resolved for prompt ${promptId}: ${message}`
            );
          }
        }
      } catch (error) {
        console.error("Error handling sidecar command in ConsoleProvider:", error);
      }
    };
    
    // Also listen for direct console events from the sidecar client
    const handleConsoleEvent = (event: ConsoleEvent) => {
      addEvent(event);
    };

    const handleWorkspaceArtifacts = (payload: WorkspaceArtifactsPayload) => {
      if (
        payload &&
        payload.workspaceId === workspaceId &&
        Array.isArray(payload.artifacts)
      ) {
        const validArtifacts = payload.artifacts.filter(
          (a): a is WorkspaceArtifact =>
            Boolean(
              a &&
                typeof a.filename === "string" &&
                typeof a.format === "string" &&
                typeof a.downloadUrl === "string"
            )
        );
        setLatestArtifacts(validArtifacts);
      }
    };

    sidecarClient.onCommand(handleSidecarCommand);
    sidecarClient.onConsoleEvent(handleConsoleEvent);
    const unsubscribeArtifacts = sidecarClient.onWorkspaceArtifacts(handleWorkspaceArtifacts);

    return () => {
      sidecarClient.offCommand(handleSidecarCommand);
      sidecarClient.offConsoleEvent(handleConsoleEvent);
      unsubscribeArtifacts();
    };
  }, [addEvent, workspaceId]);

  return (
    <ConsoleContext.Provider
      value={{
        events,
        pendingPrompts,
        latestArtifacts,
        addEvent,
        sendInput,
        clearEvents,
        clearArtifacts,
      }}
    >
      {children}
    </ConsoleContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useConsole = () => {
  const context = useContext(ConsoleContext);
  if (context === undefined) {
    throw new Error("useConsole must be used within a ConsoleProvider");
  }
  return context;
};
