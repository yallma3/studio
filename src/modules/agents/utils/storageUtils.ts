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
import { readTextFile, writeTextFile, exists, mkdir } from  '@tauri-apps/plugin-fs';
import { appConfigDir } from '@tauri-apps/api/path';


// Define agent state interface
export interface AgentState {
  agentId: string;
  agentName: string | null;
  nextComponentId: number;
}

// Define saved agent interface
interface SavedAgent {
  id: string;
  path: string;
  name: string;
  lastModified: number;
}

// Path to recent agents file
let recentAgentsPath: string;

// Initialize paths
const initPaths = async () => {
  if (recentAgentsPath) return;
  
  const configDir = await appConfigDir();
  const appDir = `${configDir}/yaLLMa3`;
  // Ensure the directory exists
  if (!(await exists(appDir))) {
    await mkdir(appDir, { recursive: true });
  }
  
  recentAgentsPath = `${appDir}/recent_agents.json`;
};

// Save agent state to file
export const saveAgentState = async (state: AgentState): Promise<string> => {
  await initPaths();
  
  // If agent doesn't have a name, prompt for one
  if (!state.agentName) {
    throw new Error('Agent name is required');
  }
  
  // Determine file path (use dialog if saving for the first time)
  
  
  // Use dialog to select file location
  const filePath = await save({
    defaultPath: state.agentName ? `${state.agentName}.json` : 'untitled_agent.json',
    filters: [{
      name: 'Agent JSON',
      extensions: ['json']
    }]
  });
  
  if (!filePath) {
    throw new Error('No file path selected');
  }
  
  // Save agent state to file
  const serializedState = JSON.stringify(state, null, 2);
  await writeTextFile(filePath, serializedState);
  
  // Update recent agents list
  await updateRecentAgents({
    id: state.agentId,
    path: filePath,
    name: state.agentName || 'Untitled Agent',
    lastModified: Date.now()
  });
  
  return filePath;
};

// Load agent state from file
export const loadAgentState = async (): Promise<{ agentState: AgentState, filePath: string } | null> => {
  // Open file dialog to select JSON file
  const filePath = await open({
    multiple: false,
    filters: [{
      name: 'Agent JSON',
      extensions: ['json']
    }]
  });
  
  // If no file selected, return null
  if (!filePath || Array.isArray(filePath)) {
    return null;
  }
  
  try {
    // Read file contents
    const fileContents = await readTextFile(filePath as string);
    const agentState = JSON.parse(fileContents) as AgentState;
    
    // Update recent agents list
    await updateRecentAgents({
      id: agentState.agentId,
      path: filePath as string,
      name: agentState.agentName || 'Untitled Agent',
      lastModified: Date.now()
    });
    
    return { agentState, filePath: filePath as string };
  } catch (error) {
    console.error("Error loading agent state:", error);
    throw new Error(`Failed to load agent state: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Load agent state from specific path
export const loadAgentStateFromPath = async (filePath: string, agentId: string): Promise<AgentState | null> => {
  try {
    // Check if file exists
    if (!(await exists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    // Read file contents
    const fileContents = await readTextFile(filePath);
    const agentState = JSON.parse(fileContents) as AgentState;
    
    // Verify agent ID matches
    if (agentState.agentId !== agentId) {
      console.warn(`Agent ID mismatch: expected ${agentId}, found ${agentState.agentId}`);
    }
    
    // Update recent agents list
    await updateRecentAgents({
      id: agentState.agentId,
      path: filePath,
      name: agentState.agentName || 'Untitled Agent',
      lastModified: Date.now()
    });
    
    return agentState;
  } catch (error) {
    console.error("Error loading agent state:", error);
    throw new Error(`Failed to load agent state: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Update recent agents list
const updateRecentAgents = async (agent: SavedAgent) => {
  await initPaths();
  
  let recentAgents: SavedAgent[] = [];
  
  // Load existing recent agents if file exists
  if (await exists(recentAgentsPath)) {
    try {
      const fileContents = await readTextFile(recentAgentsPath);
      recentAgents = JSON.parse(fileContents);
    } catch (error) {
      console.warn("Error reading recent agents:", error);
    }
  }
  
  // Remove agent if it already exists in the list
  recentAgents = recentAgents.filter(g => g.id !== agent.id);
  
  // Add agent to the beginning of the list
  recentAgents.unshift(agent);
  
  // Limit list to 20 recent agents
  if (recentAgents.length > 20) {
    recentAgents = recentAgents.slice(0, 20);
  }
  
  // Save updated list
  await writeTextFile(recentAgentsPath, JSON.stringify(recentAgents, null, 2));
};

// Load recent agents list
export const loadRecentAgents = async (): Promise<SavedAgent[]> => {
  await initPaths();
  
  if (!(await exists(recentAgentsPath))) {
    return [];
  }
  
  try {
    const fileContents = await readTextFile(recentAgentsPath);
    return JSON.parse(fileContents);
  } catch (error) {
    console.warn("Error reading recent agents:", error);
    return [];
  }
};

// Export agent as JSON file
export const exportAgentState = async (state: AgentState): Promise<string> => {
  // Use dialog to select file location
  const filePath = await save({
    defaultPath: state.agentName ? `${state.agentName}.json` : 'untitled_agent.json',
    filters: [{
      name: 'Agent JSON',
      extensions: ['json']
    }]
  });
  
  if (!filePath) {
    throw new Error('No file path selected');
  }
  
  // Save agent state to file
  const serializedState = JSON.stringify(state, null, 2);
  await writeTextFile(filePath, serializedState);
  
  return filePath;
}; 