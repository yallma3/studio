import { open, save } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

export interface ProjectState {
  projectId: string;
  projectName: string | null;
  description?: string;
  createdAt: number;
  updatedAt: number;
  flows: string[]; // IDs of flows related to this project
  agents: string[]; // IDs of agents related to this project
}

export interface ProjectSaveResult {
  path: string;
  projectState: ProjectState;
}

// Save project state to a file
export const saveProjectState = async (projectState: ProjectState): Promise<ProjectSaveResult> => {
  try {
    // If project has a name, use it for the file name, otherwise use the ID
    const fileName = `${projectState.projectName || projectState.projectId}.llmproject.json`;
    
    // Initialize the save path dialog
    const savePath = await save({
      title: 'Save Project',
      defaultPath: fileName,
      filters: [{
        name: 'yaLLma Project',
        extensions: ['llmproject.json']
      }]
    });
    
    if (!savePath) {
      throw new Error('Save operation cancelled');
    }
    
    // Update timestamps
    const updatedState = {
      ...projectState,
      updatedAt: Date.now()
    };
    
    // Write the file
    await writeTextFile(savePath, JSON.stringify(updatedState, null, 2));
    
    return {
      path: savePath,
      projectState: updatedState
    };
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

// Load project state from file picker
export const loadProjectState = async (): Promise<ProjectSaveResult> => {
  try {
    // Open file picker dialog
    const filePath = await open({
      title: 'Load Project',
      multiple: false,
      filters: [{
        name: 'yaLLma Project',
        extensions: ['llmproject.json']
      }]
    });
    
    if (!filePath || typeof filePath === 'object') {
      throw new Error('No file selected or multiple files selected');
    }
    
    // Read and parse the file
    const fileContent = await readTextFile(filePath);
    const projectState = JSON.parse(fileContent) as ProjectState;
    
    return {
      path: filePath,
      projectState
    };
  } catch (error) {
    console.error('Error loading project:', error);
    throw error;
  }
};

// Load project state from a specific path
export const loadProjectStateFromPath = async (path: string, id: string): Promise<ProjectState> => {
  try {
    const configPath = await join(path, `${id}.llmproject.json`);
    const fileContent = await readTextFile(configPath);
    return JSON.parse(fileContent) as ProjectState;
  } catch (error) {
    console.error(`Error loading project from path: ${path}/${id}`, error);
    throw error;
  }
}; 