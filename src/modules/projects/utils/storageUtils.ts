/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { open, save } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile, mkdir, exists, readDir, remove } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { appDataDir } from "@tauri-apps/api/path";
import {WorkspaceData} from '../types/Types'

export interface WorkspaceState {
  workspaceId: string;
  workspaceName: string | null;
  description?: string;
  createdAt: number;
  updatedAt: number;
  flows: string[]; // IDs of flows related to this workspace
  agents: string[]; // IDs of agents related to this workspace
}

export interface WorkspaceSaveResult {
  path: string;
  workspaceState: WorkspaceData;
}

// Generate clean, short random string
const generateCleanId = (length: number = 6): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate a unique ID that's clean and short
export const generateUniqueId = (): string => {
  const shortDate = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const randomPart = generateCleanId(4);
  return `ws-${shortDate}${randomPart}`;
};

// Check if a workspace ID already exists to prevent duplicates
export const isWorkspaceIdUnique = async (id: string): Promise<boolean> => {
  try {
    const appDir = await appDataDir();
    const workspacesDirPath = await join(appDir, 'Workspaces');
    const fileName = `${id}.yallma3`;
    const filePath = await join(workspacesDirPath, fileName);
    return !(await exists(filePath));
  } catch (error) {
    console.error('Error checking workspace ID uniqueness:', error);
    return true; // Assume unique on error
  }
};

// Generate a guaranteed unique workspace ID
export const generateUniqueWorkspaceId = async (): Promise<string> => {
  let id = generateUniqueId();
  let isUnique = await isWorkspaceIdUnique(id);
  
  // Keep generating until we find a unique ID (very unlikely to loop more than once)
  while (!isUnique) {
    id = generateUniqueId();
    isUnique = await isWorkspaceIdUnique(id);
  }
  
  return id;
};

// Regenerate all IDs in imported workspace data
const regenerateWorkspaceIds = async (workspaceData: WorkspaceData): Promise<WorkspaceData> => {
  // Generate new workspace ID
  const newWorkspaceId = await generateUniqueWorkspaceId();
  

  // Return workspace with all new IDs
  return {
    ...workspaceData,
    id: newWorkspaceId,
    createdAt: Date.now(), // Update creation time for imported workspace
    updatedAt: Date.now()
  };
};

// Save workspace state to a file
export const saveWorkspaceState = async (workspaceState: WorkspaceData): Promise<WorkspaceSaveResult> => {
  try {
    // Use workspace name for file name, fall back to ID if no name
    const fileName = workspaceState.name 
      ? `${workspaceState.name}.yallma3`
      : `${workspaceState.id}.yallma3`;
    
    // Initialize the save path dialog
    const savePath = await save({
      title: 'Export workspace',
      defaultPath: fileName,
      filters: [{
        name: 'yaLLma3 workspace',
        extensions: ['yallma3']
      }]
    });
    
    if (!savePath) {
      throw new Error('Export operation cancelled');
    }
    
    // Update timestamps
    const updatedState = {
      ...workspaceState,
      updatedAt: Date.now()
    };
    
    // Write the file
    await writeTextFile(savePath, JSON.stringify(updatedState, null, 2));
    
    return {
      path: savePath,
      workspaceState: updatedState
    };
  } catch (error) {
    console.error('Error exporting workspace:', error);
    throw error;
  }
};

// Save workspace to a file with .yallma3 extension
export const saveWorkspace = async (workspaceState: WorkspaceData): Promise<WorkspaceSaveResult> => {
  try {
    // Use ID for file name instead of name
    const fileName = `${workspaceState.id}.yallma3`;
    
    // Initialize the save path dialog
    const savePath = await save({
      title: 'Save workspace',
      defaultPath: fileName,
      filters: [{
        name: 'yaLLma3 workspace',
        extensions: ['yallma3']
      }]
    });
    
    if (!savePath) {
      throw new Error('Save operation cancelled');
    }
    
    // Update timestamps
    const updatedState = {
      ...workspaceState,
      updatedAt: Date.now()
    };
    
    // Write the file as JSON
    await writeTextFile(savePath, JSON.stringify(updatedState, null, 2));
    
    return {
      path: savePath,
      workspaceState: updatedState
    };
  } catch (error) {
    console.error('Error saving workspace:', error);
    throw error;
  }
};

// Load workspace state from file picker - with ID regeneration for imports
export const loadWorkspaceState = async (): Promise<WorkspaceSaveResult> => {
  try {
    // Open file picker dialog
    const filePath = await open({
      title: 'Load workspace',
      multiple: false,
      filters: [{
        name: 'yaLLma3 workspace',
        extensions: ['yallma3']
      }]
    });
    
    if (!filePath || typeof filePath === 'object') {
      throw new Error('No file selected or multiple files selected');
    }
    
    // Read and parse the file
    const fileContent = await readTextFile(filePath);
    const originalWorkspaceData = JSON.parse(fileContent) as WorkspaceData;
    
    // Regenerate all IDs for the imported workspace
    const workspaceStateWithNewIds = await regenerateWorkspaceIds(originalWorkspaceData);
    
    return {
      path: filePath,
      workspaceState: workspaceStateWithNewIds
    };
  } catch (error) {
    console.error('Error loading workspace:', error);
    throw error;
  }
};

// Load workspace state from a specific path - with ID regeneration for imports
export const loadWorkspaceStateFromPath = async (path: string, id: string): Promise<WorkspaceData> => {
  try {
    const configPath = await join(path, `${id}.yallma3`);
    const fileContent = await readTextFile(configPath);
    const originalWorkspaceData = JSON.parse(fileContent) as WorkspaceData;
    
    // Regenerate all IDs for the imported workspace
    const workspaceDataWithNewIds = await regenerateWorkspaceIds(originalWorkspaceData);
    
    return workspaceDataWithNewIds;
  } catch (error) {
    console.error(`Error loading workspace from path: ${path}/${id}`, error);
    throw error;
  }
};

// Load all workspaces from the Workspaces directory
export const loadAllWorkspaces = async (): Promise<WorkspaceData[]> => {
  try {
    // Get the app data directory
    const appDir = await appDataDir();
    const workspacesDirPath = await join(appDir, 'Workspaces');
    
    // Check if Workspaces directory exists
    if (!(await exists(workspacesDirPath))) {
      return [];
    }
    
    // Read directory contents
    const entries = await readDir(workspacesDirPath);
    const workspaces: WorkspaceData[] = [];
    
    // Filter for .yallma3 files and load them
    for (const entry of entries) {
      if (entry.name && entry.name.endsWith('.yallma3')) {
        try {
          const filePath = await join(workspacesDirPath, entry.name);
          const fileContent = await readTextFile(filePath);
          const workspaceData = JSON.parse(fileContent) as WorkspaceData;
          workspaces.push(workspaceData);
        } catch (error) {
          console.error(`Error loading workspace ${entry.name}:`, error);
        }
      }
    }
    
    // Sort by updatedAt descending (newest first)
    return workspaces.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (error) {
    console.error('Error loading workspaces:', error);
    return [];
  }
};

// Save recent workspaces to JSON file
export const saveRecentWorkspaces = async (recentWorkspaces: string[]): Promise<void> => {
  try {
    const appDir = await appDataDir();
    const recentFilePath = await join(appDir, 'recent-workspaces.json');
    await writeTextFile(recentFilePath, JSON.stringify(recentWorkspaces, null, 2));
  } catch (error) {
    console.error('Error saving recent workspaces:', error);
  }
};

// Load recent workspaces from JSON file
export const loadRecentWorkspaces = async (): Promise<string[]> => {
  try {
    const appDir = await appDataDir();
    const recentFilePath = await join(appDir, 'recent-workspaces.json');
    
    if (!(await exists(recentFilePath))) {
      return [];
    }
    
    const fileContent = await readTextFile(recentFilePath);
    return JSON.parse(fileContent) as string[];
  } catch (error) {
    console.error('Error loading recent workspaces:', error);
    return [];
  }
};

// Save favorite workspaces to JSON file
export const saveFavoriteWorkspaces = async (favoriteWorkspaces: string[]): Promise<void> => {
  try {
    const appDir = await appDataDir();
    const favoritesFilePath = await join(appDir, 'favorite-workspaces.json');
    await writeTextFile(favoritesFilePath, JSON.stringify(favoriteWorkspaces, null, 2));
  } catch (error) {
    console.error('Error saving favorite workspaces:', error);
  }
};

// Load favorite workspaces from JSON file
export const loadFavoriteWorkspaces = async (): Promise<string[]> => {
  try {
    const appDir = await appDataDir();
    const favoritesFilePath = await join(appDir, 'favorite-workspaces.json');
    
    if (!(await exists(favoritesFilePath))) {
      return [];
    }
    
    const fileContent = await readTextFile(favoritesFilePath);
    return JSON.parse(fileContent) as string[];
  } catch (error) {
    console.error('Error loading favorite workspaces:', error);
    return [];
  }
};

// Check if a workspace file exists in the Workspaces directory
export const workspaceFileExists = async (workspaceData: WorkspaceData): Promise<boolean> => {
  try {
    const appDir = await appDataDir();
    const workspacesDirPath = await join(appDir, 'Workspaces');
    
    // Check for file with workspace ID
    const fileName = `${workspaceData.id}.yallma3`;
    const filePath = await join(workspacesDirPath, fileName);
    return await exists(filePath);
  } catch (error) {
    console.error('Error checking if workspace file exists:', error);
    return false;
  }
};

// Initialize default directories on app start
export const initializeDefaultDirectories = async (): Promise<void> => {
  try {
    // Get the app data directory
    const appDir = await appDataDir();
    
    // Create the flows directory path (lowercase to match workflow storage utilities)
    const flowsDirPath = await join(appDir, 'flows');
    const workspacesDirPath = await join(appDir, 'Workspaces');
    
    // Create the flows directory if it doesn't exist
    if (!(await exists(flowsDirPath))) {
      await mkdir(flowsDirPath, { recursive: true });
      console.log('Created flows directory:', flowsDirPath);
    }
    if (!(await exists(workspacesDirPath))) {
      await mkdir(workspacesDirPath, { recursive: true });
      console.log('Created Workspaces directory:', workspacesDirPath);
    }
  } catch (error) {
    console.error('Error initializing default directories:', error);
  }
};

// Save workspace to the default app storage directory without prompting user
export const saveWorkspaceToDefaultLocation = async (workspaceState: WorkspaceData): Promise<WorkspaceSaveResult> => {
  try {
    // Use ID for file name instead of name
    const fileName = `${workspaceState.id}.yallma3`;
    
    // Get the app data directory
    const appDir = await appDataDir();
    
    // Create the Workspaces directory path
    const workspacesDirPath = await join(appDir, 'Workspaces');
    
    // Ensure the Workspaces directory exists
    if (!(await exists(workspacesDirPath))) {
      await mkdir(workspacesDirPath, { recursive: true });
    }
    
    // Update timestamps
    const updatedState = {
      ...workspaceState,
      updatedAt: Date.now()
    };
    
    // Create the full file path inside the Workspaces directory
    const filePath = await join(workspacesDirPath, fileName);
    
    // Write the file as JSON
    await writeTextFile(filePath, JSON.stringify(updatedState, null, 2));
    
    return {
      path: filePath,
      workspaceState: updatedState
    };
  } catch (error) {
    console.error('Error saving workspace to default location:', error);
    throw error;
  }
};

// Delete workspace from the default app storage directory
export const deleteWorkspace = async (workspaceId: string): Promise<void> => {
  try {
    // Get the app data directory
    const appDir = await appDataDir();
    const workspacesDirPath = await join(appDir, 'Workspaces');
    
    // Create the file path
    const fileName = `${workspaceId}.yallma3`;
    const filePath = await join(workspacesDirPath, fileName);
    
    // Check if file exists before attempting to delete
    if (await exists(filePath)) {
      await remove(filePath);
      console.log(`Deleted workspace: ${workspaceId}`);
    } else {
      console.warn(`Workspace file not found: ${workspaceId}`);
    }
  } catch (error) {
    console.error('Error deleting workspace:', error);
    throw error;
  }
};