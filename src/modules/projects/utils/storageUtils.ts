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
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
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

// Save workspace to the default app storage directory without prompting user
export const saveWorkspaceToDefaultLocation = async (workspaceState: WorkspaceData): Promise<WorkspaceSaveResult> => {
  try {
    // If workspace has a name, use it for the file name, otherwise use the ID
    const fileName = `${workspaceState.name || workspaceState.id}.yallma3`;
    
    // Create a workspaces directory in the app data directory
    // const workspacesDir = 'workspaces';
    
    // Check if the workspaces directory exists, if not create it
    
    

    
    // Update timestamps
    const updatedState = {
      ...workspaceState,
      updatedAt: Date.now()
    };
    
    const filePath = await join(await appDataDir(), `${fileName}`);
    
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