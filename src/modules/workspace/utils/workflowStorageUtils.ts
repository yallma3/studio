import { join, appDataDir } from "@tauri-apps/api/path";
import { writeTextFile, readTextFile, exists, mkdir, readDir, remove } from '@tauri-apps/plugin-fs';
import { CanvasState, reattachNodeProcessors } from "../../flow/utils/storageUtils";

export interface WorkflowFile {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  canvasState: CanvasState;
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

// Generate unique workflow ID
export const generateWorkflowId = (): string => {
  const shortDate = Date.now().toString().slice(-6);
  const randomPart = generateCleanId(3);
  return `wf-${shortDate}${randomPart}`;
};

// Ensure flows directory exists
const ensureFlowsDirectory = async (): Promise<string> => {
  const appDir = await appDataDir();
  const flowsDir = await join(appDir, 'flows');
  
  if (!(await exists(flowsDir))) {
    await mkdir(flowsDir, { recursive: true });
  }
  
  return flowsDir;
};

// Save workflow to appdata/flow
export const saveWorkflowToFile = async (
  workflow: WorkflowFile
): Promise<void> => {
  try {
    const flowsDir = await ensureFlowsDirectory();
    const fileName = `${workflow.id}.json`;
    const filePath = await join(flowsDir, fileName);
    
    const workflowData = {
      ...workflow,
      updatedAt: Date.now()
    };
    
    await writeTextFile(filePath, JSON.stringify(workflowData, null, 2));
    console.log(`Workflow saved: ${filePath}`);
  } catch (error) {
    console.error('Error saving workflow:', error);
    throw error;
  }
};

// Load workflow from appdata/flow
export const loadWorkflowFromFile = async (workflowId: string): Promise<WorkflowFile | null> => {
  try {
    const flowsDir = await ensureFlowsDirectory();
    const fileName = `${workflowId}.json`;
    const filePath = await join(flowsDir, fileName);
    
    if (!(await exists(filePath))) {
      return null;
    }
    
    const fileContent = await readTextFile(filePath);
    const workflowData = JSON.parse(fileContent) as WorkflowFile;
    
    // Reattach the process functions that were lost during serialization
    workflowData.canvasState.nodes = reattachNodeProcessors(workflowData.canvasState.nodes);
    
    return workflowData;
  } catch (error) {
    console.error(`Error loading workflow ${workflowId}:`, error);
    return null;
  }
};

// Load all workflows from appdata/flow
export const loadAllWorkflowsFromFiles = async (): Promise<WorkflowFile[]> => {
  try {
    const flowsDir = await ensureFlowsDirectory();
    const entries = await readDir(flowsDir);
    const workflows: WorkflowFile[] = [];
    
    for (const entry of entries) {
      if (entry.name && entry.name.endsWith('.json')) {
        try {
          const filePath = await join(flowsDir, entry.name);
          const fileContent = await readTextFile(filePath);
          const workflowData = JSON.parse(fileContent) as WorkflowFile;
          workflows.push(workflowData);
        } catch (error) {
          console.error(`Error loading workflow file ${entry.name}:`, error);
        }
      }
    }
    
    // Sort by updatedAt descending (newest first)
    return workflows.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Error loading workflows:', error);
    return [];
  }
};

// Delete workflow file
export const deleteWorkflowFile = async (workflowId: string): Promise<void> => {
  try {
    const flowsDir = await ensureFlowsDirectory();
    const fileName = `${workflowId}.json`;
    const filePath = await join(flowsDir, fileName);
    
    if (await exists(filePath)) {
      await remove(filePath);
      console.log(`Workflow deleted: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting workflow ${workflowId}:`, error);
    throw error;
  }
};

// Create new workflow with generated ID
export const createNewWorkflow = async (
  name: string,
  description: string,
  canvasState: CanvasState
): Promise<WorkflowFile> => {
  const workflow: WorkflowFile = {
    id: generateWorkflowId(),
    name,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    canvasState
  };
  
  await saveWorkflowToFile(workflow);
  return workflow;
};

// Update existing workflow
export const updateWorkflowFile = async (
  workflowId: string,
  updates: Partial<Omit<WorkflowFile, 'id' | 'createdAt'>>
): Promise<WorkflowFile | null> => {
  try {
    const existingWorkflow = await loadWorkflowFromFile(workflowId);
    if (!existingWorkflow) {
      return null;
    }
    
    const updatedWorkflow: WorkflowFile = {
      ...existingWorkflow,
      ...updates,
      updatedAt: Date.now()
    };
    
    await saveWorkflowToFile(updatedWorkflow);
    return updatedWorkflow;
  } catch (error) {
    console.error(`Error updating workflow ${workflowId}:`, error);
    throw error;
  }
}; 