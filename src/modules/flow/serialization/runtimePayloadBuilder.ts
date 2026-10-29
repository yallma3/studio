/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 * 
 * Copyright (C) 2025 yaLLMa3
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 * 
 * This software is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { BaseNode, ConfigParameterType, Connection, Socket } from "../types/NodeTypes";
import { CanvasState } from "../utils/storageUtils";
import {
  RuntimeConfigParam,
  RuntimeNodePayload,
  RuntimeWorkflowPayload,
  RuntimeWorkspacePayload,
  StoredConnection,
  StoredSocket,
} from "./types";

/**
 * Builds a lean runtime node payload for sidecar execution & LLM inference (Goal 2).
 * Strips canvas geometry, presentation catalogs, and transient runtime residue.
 * Enriches config parameters with type semantics and default fallbacks.
 */
export function buildRuntimeNodePayload(node: BaseNode): RuntimeNodePayload {
  const sockets: StoredSocket[] = Array.isArray(node.sockets)
    ? node.sockets.map((s: Socket) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        nodeId: s.nodeId,
        dataType: s.dataType,
      }))
    : [];

  const configParameters: RuntimeConfigParam[] = [];
  const rawParams: ConfigParameterType[] = node.configParameters ?? [];

  for (const p of rawParams) {
    if (!p || !p.parameterName) continue;
    const resolvedValue = p.paramValue !== undefined ? p.paramValue : p.defaultValue;

    configParameters.push({
      parameterName: p.parameterName,
      parameterType: p.parameterType || "string",
      paramValue: resolvedValue,
      defaultValue: p.defaultValue,
      description: typeof p.description === "string" ? p.description : undefined,
    });
  }

  const payload: RuntimeNodePayload = {
    id: node.id,
    nodeType: node.nodeType,
    title: node.customTitle || node.title || node.nodeType,
    sockets,
    configParameters,
  };

  return payload;
}

export type WorkflowLike =
  | CanvasState
  | { id?: string; name?: string; description?: string; canvasState?: CanvasState }
  | Record<string, unknown>;

export interface TaskDependencySets {
  workflowIds: Set<string>;
  agentIds: Set<string>;
  mcpToolIds: Set<string>;
}

export type WorkspaceLike = {
  id?: string;
  name?: string;
  description?: string;
  tasks?: unknown[];
  agents?: unknown[];
  workflows?: unknown[];
  mcpTools?: unknown[];
};

/**
 * Resolves all direct and transitive runtime dependencies originating from defined tasks (Goal 2).
 * Elements (workflows, agents, tools) without an active dependency path from tasks are identified for pruning.
 */
export function resolveTaskDependencies(
  workspaceData: WorkspaceLike | Record<string, unknown>
): TaskDependencySets {
  const workflowIds = new Set<string>();
  const agentIds = new Set<string>();
  const mcpToolIds = new Set<string>();

  const rawTasks = Array.isArray(workspaceData?.tasks) ? workspaceData.tasks : [];
  const rawAgents = Array.isArray(workspaceData?.agents) ? workspaceData.agents : [];
  const rawWorkflows = Array.isArray(workspaceData?.workflows) ? workspaceData.workflows : [];

  let hasUnassignedAgenticTask = false;

  for (const rawTask of rawTasks) {
    if (!rawTask || typeof rawTask !== "object") continue;
    const task = rawTask as Record<string, unknown>;
    const executorId = typeof task.executorId === "string" ? task.executorId.trim() : null;
    const taskType = typeof task.type === "string" ? task.type.toLowerCase().trim() : "";

    // 1. Direct Workflow Dependency
    if (taskType === "workflow" && executorId) {
      workflowIds.add(executorId);
    }

    // 2. Direct Agent Dependency (supports "specific-agent", "agent", and "agentic" with executorId)
    const isAgentType =
      taskType === "specific-agent" ||
      taskType === "agent" ||
      taskType === "agentic";

    if (isAgentType && executorId) {
      agentIds.add(executorId);
    } else if (taskType === "agentic" && !executorId) {
      hasUnassignedAgenticTask = true;
    }

    // Defensive fallback: if executorId matches any agent or workflow, preserve it
    if (executorId) {
      const isAgent = rawAgents.some(
        (a) => a && typeof a === "object" && (a as Record<string, unknown>).id === executorId
      );
      if (isAgent) {
        agentIds.add(executorId);
      }
      const isWf = rawWorkflows.some(
        (w) => w && typeof w === "object" && (w as Record<string, unknown>).id === executorId
      );
      if (isWf) {
        workflowIds.add(executorId);
      }
    }
  }

  // If there are unassigned agentic tasks, all agents in the workspace are candidate executors
  if (hasUnassignedAgenticTask) {
    for (const rawAgent of rawAgents) {
      if (rawAgent && typeof rawAgent === "object") {
        const id = (rawAgent as Record<string, unknown>).id;
        if (typeof id === "string" && id.trim()) {
          agentIds.add(id.trim());
        }
      }
    }
  }

  // 3. Transitive dependencies from required agents (tools)
  for (const agentId of Array.from(agentIds)) {
    const rawAgent = rawAgents.find(
      (a) => a && typeof a === "object" && (a as Record<string, unknown>).id === agentId
    );
    if (!rawAgent || typeof rawAgent !== "object") continue;
    const agent = rawAgent as Record<string, unknown>;
    const rawTools = Array.isArray(agent.tools) ? agent.tools : [];

    for (const rawTool of rawTools) {
      if (!rawTool || typeof rawTool !== "object") continue;
      const tool = rawTool as Record<string, unknown>;
      const toolType = typeof tool.type === "string" ? tool.type.toLowerCase().trim() : "";

      if (toolType === "workflow") {
        const toolParams = (tool.parameters && typeof tool.parameters === "object")
          ? (tool.parameters as Record<string, unknown>)
          : undefined;

        const wfId = (typeof tool.id === "string" && tool.id)
          ? tool.id
          : (typeof toolParams?.workflowId === "string" && toolParams.workflowId)
          ? toolParams.workflowId
          : (typeof tool.name === "string" && tool.name)
          ? tool.name
          : null;

        if (wfId && typeof wfId === "string" && wfId.trim()) {
          workflowIds.add(wfId.trim());
        }
      } else if (toolType === "mcp") {
        if (typeof tool.id === "string" && tool.id.trim()) {
          mcpToolIds.add(tool.id.trim());
        }
        if (typeof tool.name === "string" && tool.name.trim()) {
          mcpToolIds.add(tool.name.trim());
        }
      }
    }
  }

  return { workflowIds, agentIds, mcpToolIds };
}

/**
 * Prunes unreferenced workflows, agents, and MCP tools from workspace data based on task dependencies (Goal 2).
 */
export function pruneWorkspaceByTaskDependencies<T extends WorkspaceLike>(
  workspaceData: T
): T {
  if (!workspaceData) return workspaceData;

  const { workflowIds, agentIds, mcpToolIds } = resolveTaskDependencies(workspaceData);

  const rawWorkflows = Array.isArray(workspaceData.workflows) ? workspaceData.workflows : [];
  const prunedWorkflows = rawWorkflows.filter((wf: unknown) => {
    if (!wf || typeof wf !== "object") return false;
    const id = (wf as Record<string, unknown>).id;
    return typeof id === "string" && workflowIds.has(id);
  });

  const rawAgents = Array.isArray(workspaceData.agents) ? workspaceData.agents : [];
  const prunedAgents = rawAgents.filter((agent: unknown) => {
    if (!agent || typeof agent !== "object") return false;
    const id = (agent as Record<string, unknown>).id;
    return typeof id === "string" && agentIds.has(id);
  });

  const rawMcpTools = Array.isArray(workspaceData.mcpTools) ? workspaceData.mcpTools : [];
  const prunedMcpTools = rawMcpTools.filter((tool: unknown) => {
    if (!tool || typeof tool !== "object") return false;
    const toolObj = tool as Record<string, unknown>;
    const id = toolObj.id;
    const name = toolObj.name;
    return (
      (typeof id === "string" && mcpToolIds.has(id)) ||
      (typeof name === "string" && mcpToolIds.has(name))
    );
  });

  return {
    ...workspaceData,
    workflows: prunedWorkflows,
    agents: prunedAgents,
    mcpTools: prunedMcpTools,
  };
}

/**
 * Builds a lean workflow runtime payload for WebSocket execution dispatch (Goal 2).
 */
export function buildWorkflowRuntimePayload(
  rawWorkflow: WorkflowLike | null | undefined
): RuntimeWorkflowPayload {
  const canvasState: CanvasState = (rawWorkflow && (rawWorkflow as { canvasState?: CanvasState }).canvasState)
    ? (rawWorkflow as { canvasState: CanvasState }).canvasState!
    : ((rawWorkflow as CanvasState) || {});

  const rawNodes = Array.isArray(canvasState.nodes) ? canvasState.nodes : [];
  const nodes = rawNodes.map((n) => buildRuntimeNodePayload(n));

  const rawConnections = Array.isArray(canvasState.connections) ? canvasState.connections : [];
  const connections: StoredConnection[] = rawConnections.map((c: Connection) => ({
    fromSocket: c.fromSocket,
    toSocket: c.toSocket,
    ...(c.label ? { label: c.label } : {}),
  }));

  const id = typeof canvasState.graphId === "string"
    ? canvasState.graphId
    : typeof (rawWorkflow as { id?: string })?.id === "string"
    ? (rawWorkflow as { id: string }).id
    : "";

  const name = typeof canvasState.graphName === "string"
    ? canvasState.graphName
    : typeof (rawWorkflow as { name?: string })?.name === "string"
    ? (rawWorkflow as { name: string }).name
    : "Workflow";

  return {
    id,
    name,
    nodes,
    connections,
  };
}

/**
 * Builds a lean workspace runtime payload encompassing multiple workflows (Goal 2).
 */
export function buildWorkspaceRuntimePayload(
  workspaceData: Record<string, unknown>,
  workflows: Array<CanvasState | Record<string, unknown>>
): RuntimeWorkspacePayload {
  const prunedWorkspace = pruneWorkspaceByTaskDependencies(workspaceData);
  const { workflowIds } = resolveTaskDependencies(workspaceData);

  // If tasks are present, only workflows with a dependency in defined tasks are converted
  const hasTasks = Array.isArray(workspaceData?.tasks) && workspaceData.tasks.length > 0;
  const filteredWorkflows = hasTasks
    ? (workflows || []).filter((wf) => {
        const id = (wf as { id?: string; graphId?: string })?.id || (wf as { graphId?: string })?.graphId;
        return typeof id === "string" && workflowIds.has(id);
      })
    : (workflows || []);

  const runtimeWorkflows: RuntimeWorkflowPayload[] = filteredWorkflows.map((wf) =>
    buildWorkflowRuntimePayload(wf)
  );

  return {
    ...prunedWorkspace,
    id: typeof workspaceData?.id === "string" ? workspaceData.id : "",
    name: typeof workspaceData?.name === "string" ? workspaceData.name : "Workspace",
    description: typeof workspaceData?.description === "string" ? workspaceData.description : undefined,
    workflows: runtimeWorkflows,
  };
}
