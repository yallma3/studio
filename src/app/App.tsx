/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import WorkspaceCanvas from "../modules/workspace/WorkspaceCanvas.tsx";
import HomeScreen from "../shared/HomeScreen.tsx";
import {
  loadWorkspaceState,
  loadWorkspaceStateFromPath,
  initializeDefaultDirectories,
} from "../modules/workspace/utils/storageUtils.ts";
import { WorkspaceData } from "../modules/workspace/types/Types.ts";

import { initFlowSystem } from "../modules/flow/initFlowSystem.ts";
import { getLLMs } from "../modules/api/getLLMs.ts";
import { sidecarClient } from "../modules/api/SidecarClient";

const DEFAULT_URL = import.meta.env.VITE_YALLMA3_URL || "http://localhost:3001";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<"home" | "canvas">("home");
  const [currentWorkspaceData, setCurrentWorkspaceData] =
    useState<WorkspaceData | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>(DEFAULT_URL);
  const { i18n } = useTranslation();

  useEffect(() => {
    let isMounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const init = async () => {
      console.log("Initializing System");
      let url = DEFAULT_URL;
      const isTauriMode =
        String(import.meta.env.VITE_TAURI_MODE).toLowerCase() === "true";
      if (isTauriMode) {
        const isTauriInit = !!window.__TAURI_INTERNALS__;
        if (!isTauriInit) {
          let attempts = 0;
          const maxAttempts = 250;

          interval = setInterval(() => {
            if (window.__TAURI_INTERNALS__) {
              if (interval) clearInterval(interval);
              if (timeout) clearTimeout(timeout);
              if (isMounted) initTauri();
            } else if (++attempts >= maxAttempts) {
              if (interval) clearInterval(interval);
              console.warn("Tauri init timeout after 5 seconds");
            }
          }, 20);

          timeout = setTimeout(() => {
            if (interval) clearInterval(interval);
            console.warn("Tauri init timeout after 5 seconds");
          }, 5000);
        } else {
          if (isMounted) initTauri();
        }

        async function initTauri() {
          let instanceId = "";
          try {
            const bindJson = await invoke<string>("get_yallma3_binding");
            const bind = JSON.parse(bindJson);
            url = `http://${bind.host}:${bind.port}`;
            instanceId = bind["instance-id"] || "";
            console.log("Setting baseUrl to:", url);
            console.log("Setting instanceId (x-api-key):", instanceId ? "*".repeat(instanceId.length - 4) + instanceId.slice(-4) : instanceId);
            if (isMounted) setBaseUrl(url);
          } catch (e) {
            console.error(
              "Failed to get yallma3 URL from Tauri, using default:",
              e
            );
          }

          const wsUrl = url.replace(/^http/, "ws");
          console.log("Connecting to WebSocket:", wsUrl, "with subprotocol:", instanceId);
          initFlowSystem(url, instanceId);
          getLLMs(url, instanceId);
          initializeDefaultDirectories();
          sidecarClient.connect(wsUrl, instanceId);
        }
      } else {
        const wsUrl = url.replace(/^http/, "ws");
        initFlowSystem(url, "");
        getLLMs(url, "");
        initializeDefaultDirectories();
        sidecarClient.connect(wsUrl, "");
      }
    };

    init();

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Handle creating a new graph, agent, or workspace
  // Handle opening a graph/agent/workspace from file system
  const handleLoadFromFile = async () => {
    try {
      const loadedState = await loadWorkspaceState();
      if (loadedState) {
        console.log("Loaded workspace state:", loadedState);

        // The loadWorkspaceState now returns workspaceData directly
        setCurrentWorkspaceData(loadedState.workspaceState);
        setCurrentView("canvas");
      }
    } catch (error) {
      console.error(`Error loading workspace state:`, error);
      alert(
        `Failed to load workspace state: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const handleOpenFromPath = async (path: string, id: string) => {
    const loadedState = await loadWorkspaceStateFromPath(path, id);
    if (loadedState) {
      console.log("Loaded workspace state:", loadedState);

      // The loadWorkspaceStateFromPath now returns workspaceData directly
      setCurrentWorkspaceData(loadedState);
      setCurrentView("canvas");
    }
  };

  // Handle opening a workspace with workspaceData
  const handleOpenWorkspace = (workspaceData: WorkspaceData) => {
    // console.log('Opening workspace with workspaceData:', workspaceData);
    setCurrentWorkspaceData(workspaceData);
    setCurrentView("canvas");
  };

  // Handle returning to home screen
  const handleReturnToHome = () => {
    setCurrentWorkspaceData(null);
    setCurrentView("home");
  };

  return (
    <div className="app-container">
      {currentView === "home" ? (
        <HomeScreen
          onOpenFromFile={handleLoadFromFile}
          onOpenFromPath={handleOpenFromPath}
          onOpenWorkspace={handleOpenWorkspace}
        />
      ) : (
        <>
          {currentWorkspaceData && (
            <WorkspaceCanvas
              workspaceData={currentWorkspaceData}
              onReturnToHome={handleReturnToHome}
              baseUrl={baseUrl}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
