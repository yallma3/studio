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

import { describe, it, expect } from "vitest";
import {
  resolveTaskDependencies,
  pruneWorkspaceByTaskDependencies,
} from "@/modules/flow/serialization/runtimePayloadBuilder";
import { Agent, Tool, WorkspaceData } from "@/modules/workspace/types/Types";
import { Task } from "@/modules/task/types/types";

describe("Task-Centric Runtime Dependency Pruning (Goal 2)", () => {
  const mockAgent1: Agent = {
    id: "agent-writer",
    name: "Content Writer",
    role: "Writer",
    objective: "Write articles",
    background: "Expert journalist",
    capabilities: "Writing",
    tools: [
      {
        id: "wf-subflow-1",
        type: "workflow",
        name: "Summarize Workflow Tool",
        description: "Summarizes text",
      },
      {
        id: "mcp-search",
        type: "mcp",
        name: "WebSearchTool",
        description: "Searches the web",
      },
    ],
    llm: { provider: "Groq" },
    apiKey: "test-key",
  };

  const mockAgent2Unused: Agent = {
    id: "agent-unused",
    name: "Unused Agent",
    role: "Idle",
    objective: "None",
    background: "Idle",
    capabilities: "None",
    tools: [],
    llm: { provider: "Groq" },
    apiKey: "test-key",
  };

  const mockMcpTools: Tool[] = [
    {
      id: "mcp-search",
      type: "mcp",
      name: "WebSearchTool",
      description: "Searches the web",
    },
    {
      id: "mcp-unused",
      type: "mcp",
      name: "UnusedMcpTool",
      description: "Never used",
    },
  ];

  const createMockWorkspace = (tasks: Task[]): WorkspaceData => ({
    id: "ws-test-1",
    createdAt: 1000,
    updatedAt: 2000,
    name: "Test Workspace",
    description: "Workspace testing task dependency pruning",
    mainLLM: { provider: "Groq" },
    apiKey: "api-key",
    useSavedCredentials: false,
    trigger: null,
    tasks,
    connections: [],
    agents: [mockAgent1, mockAgent2Unused],
    workflows: [
      { id: "wf-direct-task", name: "Direct Workflow", description: "Directly executed by task" },
      { id: "wf-subflow-1", name: "Summarize Subflow", description: "Used by Agent 1 tool" },
      { id: "wf-unrelated-orphan", name: "Orphan Workflow", description: "No task uses this" },
    ],
    mcpTools: mockMcpTools,
    environmentVariables: [],
  });

  it("should resolve direct workflow dependencies when task.type === 'workflow'", () => {
    const task: Task = {
      id: "task-1",
      title: "Run Analysis Flow",
      description: "Executes direct workflow",
      expectedOutput: "Summary output",
      type: "workflow",
      executorId: "wf-direct-task",
      position: { x: 0, y: 0 },
      selected: false,
      sockets: [],
    };

    const ws = createMockWorkspace([task]);
    const deps = resolveTaskDependencies(ws);

    expect(deps.workflowIds.has("wf-direct-task")).toBe(true);
    expect(deps.workflowIds.has("wf-subflow-1")).toBe(false);
    expect(deps.workflowIds.has("wf-unrelated-orphan")).toBe(false);
    expect(deps.agentIds.size).toBe(0);
  });

  it("should resolve direct agent dependencies and transitive tool workflows & MCP tools", () => {
    const task: Task = {
      id: "task-2",
      title: "Write Article",
      description: "Agentic writing task",
      expectedOutput: "Article draft",
      type: "agentic",
      executorId: "agent-writer",
      position: { x: 0, y: 0 },
      selected: false,
      sockets: [],
    };

    const ws = createMockWorkspace([task]);
    const deps = resolveTaskDependencies(ws);

    // Direct agent dependency
    expect(deps.agentIds.has("agent-writer")).toBe(true);
    expect(deps.agentIds.has("agent-unused")).toBe(false);

    // Transitive workflow dependency via agent-writer's tool
    expect(deps.workflowIds.has("wf-subflow-1")).toBe(true);
    // Unrelated workflows remain excluded
    expect(deps.workflowIds.has("wf-direct-task")).toBe(false);
    expect(deps.workflowIds.has("wf-unrelated-orphan")).toBe(false);

    // Transitive MCP tool dependency
    expect(deps.mcpToolIds.has("mcp-search") || deps.mcpToolIds.has("WebSearchTool")).toBe(true);
    expect(deps.mcpToolIds.has("mcp-unused")).toBe(false);
  });

  it("should prune unreferenced workflows, agents, and tools from workspace data", () => {
    const taskWorkflow: Task = {
      id: "task-1",
      title: "Run Workflow",
      description: "Direct flow",
      expectedOutput: "Done",
      type: "workflow",
      executorId: "wf-direct-task",
      position: { x: 0, y: 0 },
      selected: false,
      sockets: [],
    };

    const taskAgent: Task = {
      id: "task-2",
      title: "Agent Task",
      description: "Agent task",
      expectedOutput: "Draft",
      type: "agent",
      executorId: "agent-writer",
      position: { x: 0, y: 0 },
      selected: false,
      sockets: [],
    };

    const ws = createMockWorkspace([taskWorkflow, taskAgent]);
    const pruned = pruneWorkspaceByTaskDependencies(ws);

    // Workflows: wf-direct-task and wf-subflow-1 kept, wf-unrelated-orphan pruned
    expect(pruned.workflows.length).toBe(2);
    expect(pruned.workflows.map((w: { id: string }) => w.id)).toEqual(["wf-direct-task", "wf-subflow-1"]);

    // Agents: agent-writer kept, agent-unused pruned
    expect(pruned.agents.length).toBe(1);
    expect(pruned.agents[0].id).toBe("agent-writer");

    // MCP Tools: mcp-search kept, mcp-unused pruned
    expect(pruned.mcpTools.length).toBe(1);
    expect(pruned.mcpTools[0].id).toBe("mcp-search");
  });

  it("should resolve specific-agent task type (task.type === 'specific-agent')", () => {
    const taskSpecificAgent: Task = {
      id: "tk-6768160ox",
      title: "T2",
      description: "produce final verdict",
      expectedOutput: "List of tasks",
      type: "specific-agent",
      executorId: "agent-writer",
      position: { x: 0, y: 0 },
      selected: false,
      sockets: [],
    };

    const ws = createMockWorkspace([taskSpecificAgent]);
    const deps = resolveTaskDependencies(ws);

    expect(deps.agentIds.has("agent-writer")).toBe(true);
    expect(deps.agentIds.has("agent-unused")).toBe(false);

    const pruned = pruneWorkspaceByTaskDependencies(ws);
    expect(pruned.agents.length).toBe(1);
    expect(pruned.agents[0].id).toBe("agent-writer");
  });

  it("should preserve all agents when an agentic task has no specific executor (dynamic assignment)", () => {
    const taskGeneralAgentic: Task = {
      id: "tk-agentic-unassigned",
      title: "T-General",
      description: "General agentic planning",
      expectedOutput: "Results",
      type: "agentic",
      executorId: null,
      position: { x: 0, y: 0 },
      selected: false,
      sockets: [],
    };

    const ws = createMockWorkspace([taskGeneralAgentic]);
    const deps = resolveTaskDependencies(ws);

    expect(deps.agentIds.has("agent-writer")).toBe(true);
    expect(deps.agentIds.has("agent-unused")).toBe(true);

    const pruned = pruneWorkspaceByTaskDependencies(ws);
    expect(pruned.agents.length).toBe(2);
  });

  it("should correctly handle real-world AAA workspace with mixed workflow and specific-agent tasks", () => {
    const task1: Task = {
      id: "tk-601794axs",
      title: "T1",
      description: "Extract emails",
      expectedOutput: "List of tasks",
      type: "workflow",
      executorId: "wf-0886992fo",
      position: { x: 0, y: 0 },
      selected: false,
      sockets: [],
    };

    const task2: Task = {
      id: "tk-6768160ox",
      title: "T2",
      description: "Judge verdict",
      expectedOutput: "Verdict",
      type: "specific-agent",
      executorId: "ag-658152nen",
      position: { x: 0, y: 0 },
      selected: false,
      sockets: [],
    };

    const aaaWorkspace: WorkspaceData = {
      id: "ws-838610ka8n",
      createdAt: 1000,
      updatedAt: 2000,
      name: "AAA",
      description: "AAA Workspace",
      mainLLM: { provider: "DeepSeek" as any },
      apiKey: "test",
      useSavedCredentials: false,
      trigger: null,
      tasks: [task1, task2],
      connections: [],
      agents: [
        {
          id: "ag-636137dis",
          name: "A1",
          role: "Planning Agent",
          objective: "",
          background: "Master organizer",
          capabilities: "",
          tools: [],
          llm: { provider: "DeepSeek" as any },
          apiKey: "k1",
        },
        {
          id: "ag-658152nen",
          name: "A2",
          role: "Judge",
          objective: "",
          background: "Very meticulous judge",
          capabilities: "",
          tools: [],
          llm: { provider: "DeepSeek" as any },
          apiKey: "k2",
        },
      ],
      workflows: [
        { id: "wf-0886992fo", name: "wf1_get_emails", description: "" },
        { id: "wf-3537003u9", name: "wf2", description: "Unused flow" },
      ],
      mcpTools: [],
      environmentVariables: [],
    };

    const pruned = pruneWorkspaceByTaskDependencies(aaaWorkspace);

    // wf-0886992fo kept, wf-3537003u9 pruned
    expect(pruned.workflows.length).toBe(1);
    expect(pruned.workflows[0].id).toBe("wf-0886992fo");

    // ag-658152nen kept, ag-636137dis pruned
    expect(pruned.agents.length).toBe(1);
    expect(pruned.agents[0].id).toBe("ag-658152nen");
  });

  it("should prune all unattached workflows and agents when tasks array is empty", () => {
    const ws = createMockWorkspace([]);
    const pruned = pruneWorkspaceByTaskDependencies(ws);

    expect(pruned.workflows.length).toBe(0);
    expect(pruned.agents.length).toBe(0);
    expect(pruned.mcpTools.length).toBe(0);
  });
});
