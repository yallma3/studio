/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { LLMModel } from "../../../shared/LLM/config";
import { NodeRegistry } from "../../flow/types/NodeRegistry";
import { Task, TaskConnection } from "../../task/types/types";

// Interfaces for workspace data structure
export interface Agent {
  id: string;
  name: string;
  role: string;
  objective: string;
  background: string;
  capabilities: string;
  tools: Tool[];
  llm: LLMOption; // ID of the LLM to use for this agent
  apiKey: string;
  variables?: Record<string, string>; // Variables for templating in background and other fields
}

export interface ToolConfig {
  name: string;
  isInputChannel: boolean;
  isOutputProducer: boolean;
  isJudge: boolean;
}

export type Tool = {
  id?: string;
  type: "function" | "workflow" | "mcp" | "basic";
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
};

export interface Workflow {
  id: string;
  name: string;
  description: string;
}

// export interface LLMOption {
//   id: string;
//   name: string;
//   provider: string;
//   tokenLimit: number;
// }
export interface LLMOption {
  provider: "Groq" | "OpenAI" | "OpenRouter" | "Gemini" | "Anthropic";
  model: LLMModel;
}
export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  sensitive: boolean;
  createdAt: number;
  updatedAt: number;
}
export interface WorkspaceData {
  id: string;
  createdAt: number;
  updatedAt: number;
  // Step 1: workspace Basics
  name: string;
  description: string;
  // Step 2: LLM Selection
  mainLLM: LLMOption;
  apiKey: string;
  useSavedCredentials: boolean;

  // Step 3: Tasks
  tasks: Task[];
  connections: TaskConnection[];

  // Step 4: Agents
  agents: Agent[];

  // Workflows
  workflows: Workflow[];

  //MCP tools:
  mcpTools: Tool[];
  // Environment Variables
  environmentVariables?: EnvironmentVariable[]; 
}

export interface ConsoleEvent {
  id: string;
  timestamp: number;
  type: "info" | "warning" | "error" | "success" | "system" | "input" | "user";
  message: string;
  details?: string;
  results?: string;
  promptId?: string;
  nodeId?: number;
  nodeName?: string;
}

export type ExecutionStepType = "agentic" | "workflow";

export interface ExecutionStep {
  step: number;
  task: string;
  agent?: string;
  workflow?: string;
  type: "agentic" | "workflow";
  description: string;
  inputs: string[];
  outputs: string[];
  toolsUsed: string[];
  dependsOn: number[];
}

export interface StepExecutionResult {
  stepNumber: number;
  taskName: string;
  executedBy: string;
  success: boolean;
  result: string;
  executionTime: number;
  error?: string;
}

export interface SequentialExecutionOptions {
  nodeRegistry: NodeRegistry;
  workspaceData: WorkspaceData;
  steps: ExecutionStep[];
  onStepStart?: (step: ExecutionStep, stepNumber: number) => void;
  onStepComplete?: (result: StepExecutionResult) => void;
  onError?: (error: string, stepNumber: number) => void;
  onComplete?: (results: StepExecutionResult[]) => void;
}

export interface CollaborationPairing {
  agents: [string, string];
  purpose: string;
}

export type WorkflowAction = "use" | "ignore" | "move_to_separate_project";

export interface WorkflowRecommendation {
  name: string;
  action: WorkflowAction;
  notes: string;
}

export interface ParsedProjectPlan {
  project: {
    name: string;
    objective: string;
  };
  steps: ExecutionStep[];
  collaboration: {
    notes: string;
    pairings: CollaborationPairing[];
  };
  workflowRecommendations: WorkflowRecommendation[];
}
