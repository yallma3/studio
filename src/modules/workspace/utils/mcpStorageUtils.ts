import { join, appDataDir } from "@tauri-apps/api/path";
import {
  writeTextFile,
  readTextFile,
  exists,
  mkdir,
  readDir,
  remove,
} from "@tauri-apps/plugin-fs";
import { Tool } from "../types/Types";

export interface McpToolFile {
  id: string;
  name: string;
  description: string;
  type: "STDIO" | "HTTP";
  parameters: {
    command?: string;
    args?: string[];
    url?: string;
    headers?: Record<string, string>;
  };
  createdAt: number;
  updatedAt: number;
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

// Generate unique MCP tool ID
export const generateMcpToolId = (): string => {
  const shortDate = Date.now().toString().slice(-6);
  const randomPart = generateCleanId(3);
  return `mcp-${shortDate}${randomPart}`;
};

// Ensure mcp-tools directory exists
const ensureMcpToolsDirectory = async (): Promise<string> => {
  const appDir = await appDataDir();
  const mcpToolsDir = await join(appDir, "mcp-tools");

  if (!(await exists(mcpToolsDir))) {
    await mkdir(mcpToolsDir, { recursive: true });
  }

  return mcpToolsDir;
};

// Save MCP tool to appdata/mcp-tools
export const saveMcpToolToFile = async (
  mcpTool: McpToolFile
): Promise<void> => {
  try {
    const mcpToolsDir = await ensureMcpToolsDirectory();
    const fileName = `${mcpTool.id}.json`;
    const filePath = await join(mcpToolsDir, fileName);

    const mcpToolData = {
      ...mcpTool,
      updatedAt: Date.now(),
    };

    await writeTextFile(filePath, JSON.stringify(mcpToolData, null, 2));
    console.log(`MCP Tool saved: ${filePath}`);
  } catch (error) {
    console.error("Error saving MCP tool:", error);
    throw error;
  }
};

// Load MCP tool from appdata/mcp-tools
export const loadMcpToolFromFile = async (
  mcpToolId: string
): Promise<McpToolFile | null> => {
  try {
    const mcpToolsDir = await ensureMcpToolsDirectory();
    const fileName = `${mcpToolId}.json`;
    const filePath = await join(mcpToolsDir, fileName);

    if (!(await exists(filePath))) {
      return null;
    }

    const fileContent = await readTextFile(filePath);
    const mcpToolData = JSON.parse(fileContent) as McpToolFile;
    return mcpToolData;
  } catch (error) {
    console.error(`Error loading MCP tool ${mcpToolId}:`, error);
    return null;
  }
};

// Load all MCP tools from appdata/mcp-tools
export const loadAllMcpToolsFromFiles = async (): Promise<McpToolFile[]> => {
  try {
    const mcpToolsDir = await ensureMcpToolsDirectory();
    const entries = await readDir(mcpToolsDir);
    const mcpTools: McpToolFile[] = [];

    for (const entry of entries) {
      if (entry.name && entry.name.endsWith(".json")) {
        try {
          const filePath = await join(mcpToolsDir, entry.name);
          const fileContent = await readTextFile(filePath);
          const mcpToolData = JSON.parse(fileContent) as McpToolFile;
          mcpTools.push(mcpToolData);
        } catch (error) {
          console.error(`Error loading MCP tool file ${entry.name}:`, error);
        }
      }
    }

    // Sort by updatedAt descending (newest first)
    return mcpTools.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error("Error loading MCP tools:", error);
    return [];
  }
};

// Delete MCP tool file
export const deleteMcpToolFile = async (mcpToolId: string): Promise<void> => {
  try {
    const mcpToolsDir = await ensureMcpToolsDirectory();
    const fileName = `${mcpToolId}.json`;
    const filePath = await join(mcpToolsDir, fileName);

    if (await exists(filePath)) {
      await remove(filePath);
      console.log(`MCP Tool deleted: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting MCP tool ${mcpToolId}:`, error);
    throw error;
  }
};

// Create new MCP tool with generated ID
export const createNewMcpTool = async (
  name: string,
  description: string,
  type: "STDIO" | "HTTP",
  parameters: {
    command?: string;
    args?: string[];
    url?: string;
    headers?: Record<string, string>;
  }
): Promise<McpToolFile> => {
  const mcpTool: McpToolFile = {
    id: generateMcpToolId(),
    name,
    description,
    type,
    parameters,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveMcpToolToFile(mcpTool);
  return mcpTool;
};

// Update existing MCP tool
export const updateMcpToolFile = async (
  mcpToolId: string,
  updates: Partial<Omit<McpToolFile, "id" | "createdAt">>
): Promise<McpToolFile | null> => {
  try {
    const existingMcpTool = await loadMcpToolFromFile(mcpToolId);
    if (!existingMcpTool) {
      return null;
    }

    const updatedMcpTool: McpToolFile = {
      ...existingMcpTool,
      ...updates,
      updatedAt: Date.now(),
    };

    await saveMcpToolToFile(updatedMcpTool);
    return updatedMcpTool;
  } catch (error) {
    console.error(`Error updating MCP tool ${mcpToolId}:`, error);
    throw error;
  }
};

// Convert Tool to McpToolFile
export const toolToMcpToolFile = (tool: Tool): McpToolFile => {
  const parameters = tool.parameters || {};

  const mcpToolFile = {
    id: tool.id || generateMcpToolId(),
    name: tool.name,
    description: tool.description,
    type: (parameters.type as "STDIO" | "HTTP") || "STDIO",
    parameters: {
      command: parameters.command as string,
      args: parameters.args as string[],
      url: parameters.url as string,
      headers: parameters.headers as Record<string, string>,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return mcpToolFile;
};

// Convert McpToolFile to Tool
export const mcpToolFileToTool = (mcpTool: McpToolFile): Tool => {
  return {
    id: mcpTool.id,
    type: "mcp",
    name: mcpTool.name,
    description: mcpTool.description,
    parameters: {
      type: mcpTool.type,
      ...(mcpTool.type === "STDIO"
        ? { command: mcpTool.parameters.command, args: mcpTool.parameters.args }
        : { url: mcpTool.parameters.url, headers: mcpTool.parameters.headers }),
    },
  };
};
