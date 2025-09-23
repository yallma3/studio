/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { join, appDataDir } from "@tauri-apps/api/path";

import {
  NodeType,
  Connection,
  GraphState,
  BaseNode,
} from "../types/NodeTypes.ts";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  readTextFile,
  writeTextFile,
  exists,
  mkdir,
} from "@tauri-apps/plugin-fs";

export interface CanvasState {
  graphId: string;
  graphName: string | null;
  nodes: BaseNode[];
  connections: Connection[];
  nextNodeId: number;
}

// Generate clean, short random string
const generateCleanId = (length: number = 6): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate unique graph ID - updated format
const generateGraphId = (): string => {
  const shortDate = Date.now().toString().slice(-6);
  const randomPart = generateCleanId(3);
  return `gf-${shortDate}${randomPart}`;
};

/**
 * Save canvas state to a JSON file
 */
export const saveCanvasState = async (
  graphId: string,
  nodes: NodeType[],
  connections: Connection[],
  nextNodeId: number,
  graphName: string
): Promise<void> => {
  const canvasState: CanvasState = {
    graphId,
    graphName,
    nodes,
    connections,
    nextNodeId,
  };

  // Convert to JSON string
  const stateJson = JSON.stringify(canvasState, null, 2);

  try {
    // Open a save dialog to let the user choose the file location and name
    // const filePath = await save({
    //   filters: [{
    //     name: 'JSON',
    //     extensions: ['json']
    //   }],
    //   defaultPath: `${graphId}.json`
    // });

    const filePath = await join(await appDataDir(), `${graphName}.json`);
    await writeTextFile(filePath, stateJson);

    console.log("Selected save path:", filePath);

    // If user cancels the save dialog
    if (!filePath) {
      return;
    }

    // Write the file to the selected location
    // await writeTextFile(filePath, stateJson);

    // Store graph state information
    const newGraphState: GraphState = {
      id: graphId,
      name: filePath.split("/").pop() || filePath,
      path: filePath,
      lastModified: Date.now(),
    };

    // Save to localStorage for current session
    localStorage.setItem(
      `agent-graph-${graphId}`,
      JSON.stringify(newGraphState)
    );

    // Also save to persistent storage
    await saveRecentGraphs(newGraphState);

    console.log("Canvas state saved to file successfully");
  } catch (error) {
    console.error("Error saving canvas state to file:", error);

    // Fallback to localStorage if file system access fails
    localStorage.setItem("nodeCanvasState", stateJson);
    console.log("Fallback: Canvas state saved to localStorage");
  }
};

/**
 * Load canvas state from a JSON file
 * Returns the canvas state if found, null otherwise
 */
export const loadCanvasState = async (): Promise<{
  canvasState: CanvasState;
  newGraphId: string;
} | null> => {
  try {
    const file = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: "JSON",
          extensions: ["json"],
        },
      ],
    });

    if (!file) {
      return null;
    }
    const content = await readTextFile(file);

    const fileName = file.split("/").pop() || file;
    const graphDir = await appDataDir();

    const newGraphPath = await join(graphDir, fileName);

    await mkdir(graphDir, { recursive: true });

    // Copy file into internal storage
    await writeTextFile(newGraphPath, content);

    const parsedContent = JSON.parse(content);
    const nodes = parsedContent.nodes;
    const canvasState = {
      ...parsedContent,
      nodes,
    };

    try {
      const newGraphId = generateGraphId();
      const newGraphState: GraphState = {
        id: newGraphId,
        name: fileName,
        path: newGraphPath,
        lastModified: Date.now(),
      };
      localStorage.setItem(
        `agent-graph-${newGraphId}`,
        JSON.stringify(newGraphState)
      );

      await saveRecentGraphs(newGraphState);

      console.log("Canvas state loaded from file successfully");
      return { canvasState, newGraphId };
    } catch (parseError) {
      console.error("Failed to parse JSON from file:", parseError);
      return null;
    }
  } catch (error) {
    console.error("Error loading canvas state from file:", error);

    // Fallback to localStorage if file system access fails
    const savedState = localStorage.getItem("nodeCanvasState");

    if (savedState) {
      try {
        // Parse the JSON string
        const canvasState = JSON.parse(savedState);
        console.log("Fallback: Canvas state loaded from localStorage");
        return canvasState;
      } catch (parseError) {
        console.error(
          "Failed to parse saved canvas state from localStorage:",
          parseError
        );
        return null;
      }
    }

    return null;
  }
};

export const exportCanvasState = async (
  graph: CanvasState,
  nodes: NodeType[],
  connections: Connection[],
  nextNodeId: number
): Promise<void> => {
  const canvasState: CanvasState = {
    graphId: graph?.graphId,
    graphName: graph?.graphName,
    nodes,
    connections,
    nextNodeId: nextNodeId,
  };

  // Convert to JSON string
  const stateJson = JSON.stringify(canvasState, null, 2);

  // Open a save dialog to let the user choose where to save the file
  const filePath = await save({
    filters: [
      {
        name: "JSON",
        extensions: ["json"],
      },
    ],
    defaultPath: `${graph.graphName || "untitled"}.json`,
  });

  // If user cancels the save dialog
  if (!filePath) {
    return;
  }

  // Write the file to the selected location
  await writeTextFile(filePath, stateJson);
};

/**
 * Load canvas state from a specified file path
 * Returns the canvas state if found, null otherwise
 * @param filePath - The path to the JSON file containing canvas state
 */
export const loadCanvasStateFromPath = async (
  filePath: string,
  graphId: string
): Promise<CanvasState | null> => {
  try {
    console.log("Loading canvas state from path:", filePath);
    const content = await readTextFile(filePath);

    try {
      // Parse the JSON string
      const parsedContent = JSON.parse(content);
      const nodes = parsedContent.nodes;
      const canvasState = {
        ...parsedContent,
        nodes,
      };
      return canvasState;
    } catch (parseError) {
      console.error("Failed to parse JSON from file:", parseError);
      return null;
    }
  } catch (e) {
    console.log("No file found", e);
    const canvasState: CanvasState = {
      graphId: graphId,
      graphName: null,
      nodes: [],
      connections: [],
      nextNodeId: 0,
    };
    return canvasState;
  }
};

// Type definition for File System Access API
declare global {
  interface FileSystemFileHandle {
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: string | ArrayBuffer | ArrayBufferView | Blob): Promise<void>;
    close(): Promise<void>;
  }

  interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: {
      description: string;
      accept: Record<string, string[]>;
    }[];
  }

  interface OpenFilePickerOptions {
    multiple?: boolean;
    types?: {
      description: string;
      accept: Record<string, string[]>;
    }[];
  }

  interface Window {
    showOpenFilePicker(
      options?: OpenFilePickerOptions
    ): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker(
      options?: SaveFilePickerOptions
    ): Promise<FileSystemFileHandle>;
  }
}

// Define the type for storing multiple graph states
export interface RecentGraphsState {
  graphs: GraphState[];
  lastAccessed: number;
}

/**
 * Save recent graphs data to a system file
 */
export const saveRecentGraphs = async (
  graphState: GraphState
): Promise<void> => {
  try {
    // Define a standard location to store the recent graphs data
    const appConfigDir = await import("@tauri-apps/api/path").then((path) =>
      path.appConfigDir()
    );
    const path = await import("@tauri-apps/api/path");
    const recentGraphsPath = await path.join(
      appConfigDir,
      "recent_graphs.json"
    );

    console.log("Recent graphs path:", recentGraphsPath);

    // Check if directory exists, create if not

    // Load existing recent graphs or create a new list
    let recentGraphs: RecentGraphsState;
    try {
      const content = await readTextFile(recentGraphsPath);
      recentGraphs = JSON.parse(content);

      // Update or add the graph state
      const existingIndex = recentGraphs.graphs.findIndex(
        (g) => g.id === graphState.id
      );
      if (existingIndex >= 0) {
        recentGraphs.graphs[existingIndex] = graphState;
      } else {
        // Limit to most recent X graphs (e.g., 10)
        if (recentGraphs.graphs.length >= 10) {
          recentGraphs.graphs.pop(); // Remove oldest
        }
        recentGraphs.graphs.unshift(graphState); // Add as most recent
      }
    } catch (error) {
      // Create new recent graphs list if it doesn't exist
      console.log("Error loading recent graphs:", error);
      recentGraphs = {
        graphs: [graphState],
        lastAccessed: Date.now(),
      };
    }

    recentGraphs.lastAccessed = Date.now();

    // Write the updated recent graphs list to file
    await writeTextFile(
      recentGraphsPath,
      JSON.stringify(recentGraphs, null, 2)
    );

    // Still keep in localStorage for immediate access in current session
    localStorage.setItem(
      `agent-graph-${graphState.id}`,
      JSON.stringify(graphState)
    );

    console.log("Recent graphs saved to file successfully");
  } catch (error) {
    console.error("Error saving recent graphs to file:", error);
  }
};

/**
 * Load recent graphs data from system file
 */
export const loadRecentGraphs = async (): Promise<GraphState[]> => {
  try {
    const appConfigDir = await import("@tauri-apps/api/path").then((path) =>
      path.appConfigDir()
    );
    const path = await import("@tauri-apps/api/path");
    const recentGraphsPath = await path.join(
      appConfigDir,
      "recent_graphs.json"
    );

    if (!(await exists(appConfigDir))) {
      await mkdir(appConfigDir);
      return [];
    }

    const content = await readTextFile(recentGraphsPath);
    const recentGraphs: RecentGraphsState = JSON.parse(content);

    console.log("Recent graphs loaded from file successfully");
    return recentGraphs.graphs;
  } catch (error) {
    console.log("No recent graphs file found or error reading it:", error);
    return [];
  }
};
