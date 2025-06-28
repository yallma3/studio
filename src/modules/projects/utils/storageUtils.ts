import { open, save } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile, mkdir, exists, readDir } from '@tauri-apps/plugin-fs';
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

// Save workspace state to a file
export const saveWorkspaceState = async (workspaceState: WorkspaceData): Promise<WorkspaceSaveResult> => {
  try {
    // If workspace has a name, use it for the file name, otherwise use the ID
    const fileName = `${workspaceState.name || workspaceState.id}.yallma3`;
    
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
    
    // Write the file
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

// Save workspace to a file with .yallma3 extension
export const saveWorkspace = async (workspaceState: WorkspaceData): Promise<WorkspaceSaveResult> => {
  try {
    // If workspace has a name, use it for the file name, otherwise use the ID
    const fileName = `${workspaceState.name || workspaceState.id}.yallma3`;
    
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

// Load workspace state from file picker
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
    const workspaceState = JSON.parse(fileContent) as WorkspaceData;
    
    return {
      path: filePath,
      workspaceState: workspaceState
    };
  } catch (error) {
    console.error('Error loading workspace:', error);
    throw error;
  }
};

// Load workspace state from a specific path
export const loadWorkspaceStateFromPath = async (path: string, id: string): Promise<WorkspaceData> => {
  try {
    const configPath = await join(path, `${id}.yallma3`);
    const fileContent = await readTextFile(configPath);
    return JSON.parse(fileContent) as WorkspaceData;
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

// Initialize default directories on app start
export const initializeDefaultDirectories = async (): Promise<void> => {
  try {
    // Get the app data directory
    const appDir = await appDataDir();
    
    // Create the Flows directory path
    const flowsDirPath = await join(appDir, 'Flows');
    const workspacesDirPath = await join(appDir, 'Workspaces');
    
    // Create the Flows directory if it doesn't exist
    if (!(await exists(flowsDirPath))) {
      await mkdir(flowsDirPath, { recursive: true });
      console.log('Created Flows directory:', flowsDirPath);
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
    // If workspace has a name, use it for the file name, otherwise use the ID
    const fileName = `${workspaceState.name || workspaceState.id}.yallma3`;
    
    // Get the app data directory
    const appDir = await appDataDir();
    
    // Create the Workspaces directory path
    const workspacesDirPath = await join(appDir, 'Workspaces');
    
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