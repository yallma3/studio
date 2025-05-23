// Interfaces for workspace data structure
export interface Agent {
  id: string;
  name: string;
  role: string;
  objective: string;
  background: string;
  capabilities: string;
  tools: ToolConfig[];
  llmId: string; // ID of the LLM to use for this agent
}

export interface ToolConfig {
  name: string;
  isInputChannel: boolean;
  isOutputProducer: boolean;
  isJudge: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  expectedOutput: string;
  assignedAgent: string | null; // ID of the assigned agent or null for auto-assign
  executeWorkflow: boolean;
  workflowId: string | null; // ID of the workflow to execute if executeWorkflow is true
  workflowName?: string; // Name of the workflow for display purposes
}

export interface LLMOption {
  id: string;
  name: string;
  provider: string;
  tokenLimit: number;
}

export interface WorkspaceData {
  id: string;
  createdAt: number;
  updatedAt: number;
  // Step 1: workspace Basics
  name: string;
  description: string;
  // Step 2: LLM Selection
  mainLLM: string;
  apiKey: string;
  useSavedCredentials: boolean;
  
  // Step 3: Tasks
  tasks: Task[];
  
  // Step 4: Agents
  agents: Agent[];
  
  // Workflows
  workflows: Workflow[];
}