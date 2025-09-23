import { ConsoleEvent, ParsedProjectPlan, WorkspaceData } from "../types/Types";
import { NodeRegistry } from "../../flow/types/NodeRegistry";
import { BaseNode } from "../../flow/types/NodeTypes";
import { AgentRuntime } from "../../agent/AgentRuntime";
import { loadWorkflowFromFile, WorkflowFile } from "./workflowStorageUtils";
import { createFlowRuntime } from "../../flow/utils/flowRuntime";
import {
  ExecutionStep,
  StepExecutionResult,
  SequentialExecutionOptions,
} from "../types/Types";

export async function executeTasksSequentially(
  options: SequentialExecutionOptions
): Promise<StepExecutionResult[]> {
  const {
    nodeRegistry,
    workspaceData,
    steps,
    onStepStart,
    onStepComplete,
    onError,
    onComplete,
  } = options;

  const results: StepExecutionResult[] = [];

  console.log(`🔄 Starting sequential execution of ${steps.length} steps...`);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepNumber = i + 1;

    // Find task
    const task = workspaceData.tasks.find(
      (t) => t.id === step.task || t.name === step.task
    );

    // Find workflow
    const workflow = workspaceData.workflows.find(
      (w) => w.id === step.workflow || w.name === step.workflow
    );

    // Find agent
    const agent = step.agent
      ? workspaceData.agents.find(
          (a) => a.id === step.agent || a.name === step.agent
        )
      : task?.assignedAgent
      ? workspaceData.agents.find((a) => a.id === task.assignedAgent)
      : null;

    // Validate dependencies before execution
    const dependencyValidation = validateDependencies(step, results);
    if (!dependencyValidation.isValid) {
      const error = `Dependency validation failed: ${dependencyValidation.error}`;
      console.error(`❌ Step ${stepNumber}: ${error}`);
      onError?.(error, stepNumber);
      results.push({
        stepNumber,
        taskName: step.task,
        executedBy: step.agent || step.workflow || "Unknown",
        success: false,
        result: "",
        executionTime: 0,
        error,
      });
      continue;
    }

    // Build context from dependency results
    const dependencyContext = buildDependencyContext(step, results);

    if (!task) {
      const error = `Task not found: ${step.task}`;
      console.error(`❌ Step ${stepNumber}: ${error}`);
      onError?.(error, stepNumber);
      results.push({
        stepNumber,
        taskName: step.task,
        executedBy: step.agent || step.workflow || "Unknown",
        success: false,
        result: "",
        executionTime: 0,
        error,
      });
      continue;
    }

    if (!agent && !workflow) {
      const error = `Agent or Workflow not found for task: ${task.name}`;
      console.error(`❌ Step ${stepNumber}: ${error}`);
      onError?.(error, stepNumber);
      results.push({
        stepNumber,
        taskName: task.name,
        executedBy: step.agent || step.workflow || "Unknown",
        success: false,
        result: "",
        executionTime: 0,
        error,
      });
      continue;
    }

    // Notify step start
    console.log(
      `\n🚀 Running step ${stepNumber}/${steps.length}: ${
        task.name
      } with agent: ${agent?.name || workflow?.name || "Unknown"}`
    );
    console.log(`📋 Task description: ${task.description}`);
    onStepStart?.(step, stepNumber);
    const startTime = Date.now();
    let result = "";
    try {
      if (agent) {
        // Create GroqChatRunner
        const groqRunner = new GroqChatRunner(
          nodeRegistry,
          agent.apiKey || workspaceData.apiKey,
          (event: ConsoleEvent) => console.log(event)
        );

        // Create and run AgentRuntime with dependency context
        const runtime = new AgentRuntime(
          agent,
          task,
          groqRunner,
          dependencyContext
        );
        result = await runtime.run();
      } else if (workflow) {
        // Create WorkflowRuntime
        const workflowData = await getWorkflow(workflow.id);

        if (workflowData) {
          console.log(
            "🔄 Running workflow:",
            "Nodes",
            workflowData.canvasState.nodes,
            "Connections",
            workflowData.canvasState.connections
          );
          const runtime = createFlowRuntime(
            workflowData.canvasState.nodes,
            workflowData.canvasState.connections
          );
          const results = await runtime.execute();
          result = results[0].result?.toString() || "";
          console.log("🔄 Workflow results:", result);
        } else {
          console.error("❌ Failed to load workflow nodes and connections");
          result = "Failed to load workflow nodes and connections";
        }
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      console.log(`✅ Step ${stepNumber} completed in ${executionTime}ms`);
      console.log(`📄 Result length: ${result.length} characters`);
      console.log(`📄 Result preview: ${result.substring(0, 200)}...`);

      const executionResult: StepExecutionResult = {
        stepNumber,
        taskName: task.name,
        executedBy: agent?.name || workflow?.name || "Unknown",
        success: true,
        result,
        executionTime,
      };

      results.push(executionResult);
      onStepComplete?.(executionResult);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ Error in step ${stepNumber}:`, errorMessage);

      const executionResult: StepExecutionResult = {
        stepNumber,
        taskName: task.name,
        executedBy: agent?.name || workflow?.name || "Unknown",
        success: false,
        result: "",
        executionTime: 0,
        error: errorMessage,
      };

      results.push(executionResult);
      onError?.(errorMessage, stepNumber);
    }
  }

  console.log(`\n🎉 All ${steps.length} steps completed!`);
  onComplete?.(results);

  return results;
}

// Helper function to convert ParsedProjectPlan steps to SequentialExecutionStep
export function convertToSequentialSteps(
  parsedPlan: ParsedProjectPlan
): ExecutionStep[] {
  return parsedPlan.steps.map((step, index) => ({
    step: index + 1,
    task: step.task,
    agent: step.agent,
    workflow: step.workflow,
    type: step.type,
    description: step.description,
    inputs: step.inputs,
    outputs: step.outputs,
    toolsUsed: step.toolsUsed,
    dependsOn: step.dependsOn,
  }));
}

export function parseLLMResponse(rawText: string): ParsedProjectPlan | null {
  try {
    // Step 1: Remove markdown code block markers
    const cleaned = rawText
      .trim()
      .replace(/^```json/, "")
      .replace(/```$/, "")
      .trim();

    // Step 2: Parse JSON
    const parsed = JSON.parse(cleaned);

    // Step 3: Optional minimal check
    if (
      parsed &&
      typeof parsed.project?.name === "string" &&
      Array.isArray(parsed.steps)
    ) {
      return parsed as ParsedProjectPlan;
    }

    console.warn("Invalid LLM response format:", parsed);
    return null;
  } catch (err) {
    console.error("Error parsing LLM JSON response:", err);
    return null;
  }
}

export interface ParseFunction<T> {
  (rawText: string): T | null;
}

export interface ChatRunner {
  run(prompt: string, systemPrompt: string): Promise<string | null>;
}

export class GroqChatRunner implements ChatRunner {
  private node: BaseNode | undefined;

  constructor(
    private nodeRegistry: NodeRegistry,
    private apiKey: string,
    private addEvent: (event: ConsoleEvent) => void
  ) {}

  async run(prompt: string, systemPrompt: string = ""): Promise<string | null> {
    this.node = this.nodeRegistry.createNode("GroqChat", 0, { x: 0, y: 0 });

    if (!this.node) {
      console.error("❌ Failed to create GroqChat Node.");
      this.emitEvent("error", "Could not create GroqChat Node");
      return null;
    }

    // Set API key
    if (this.node.setConfigParameter) {
      this.node.setConfigParameter("API Key", this.apiKey || "");
      console.log("✅ API key set.");
    }

    console.log("ℹ️ Prompt:", prompt);
    console.log("ℹ️ System Prompt:", systemPrompt);

    const getInputValue = async (socketId: number) => {
      if (socketId === this.node!.id * 100 + 1) return prompt;
      if (socketId === this.node!.id * 100 + 2) return systemPrompt;
      return undefined;
    };

    if (!this.node.process) {
      this.emitEvent("error", "GroqChat Node is missing process method");
      return null;
    }

    try {
      const result = await this.node.process({
        node: this.node,
        getInputValue,
      });

      console.log("🧪 Raw result:", result);
      if (
        result &&
        typeof result === "object" &&
        "3" in result &&
        "4" in result
      ) {
        const responseText =
          (result as Record<string, unknown>)["3"]?.toString() || "";
        const tokenCount =
          Number((result as Record<string, unknown>)["4"]) || 0;

        console.log("📝 Response:", responseText);
        console.log("🔢 Tokens:", tokenCount);

        const isError = responseText.toLowerCase().startsWith("error:");
        this.emitEvent(
          isError ? "error" : "success",
          `Groq LLM ${isError ? "failed" : "completed"}`
        );

        return responseText;
      } else {
        console.log("❌ Unexpected result format:", result);
        return null;
      }
    } catch (e: unknown) {
      console.error("❌ GroqChat Node exception:", e);
      this.emitEvent("error", `Exception during processing: ${e}`);
      return null;
    }
  }

  private emitEvent(
    type: "info" | "warning" | "error" | "success",
    message: string
  ) {
    this.addEvent({
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: Date.now(),
    });
  }
}

export async function getWorkflow(
  flowId: string
): Promise<WorkflowFile | null> {
  try {
    // Load the workflow file using the existing utility
    const workflow = await loadWorkflowFromFile(flowId);

    if (!workflow) {
      console.warn(`Flow not found: ${flowId}`);
      return null;
    }
    return workflow;
  } catch (error) {
    console.error(`Error loading flow ${flowId}:`, error);
    return null;
  }
}

export function generateWorkspacePrompt(workspaceData: WorkspaceData): string {
  const prompt = `
  You are an expert AI project planner. Given the following project metadata, return a structured execution plan in **valid JSON**.
  
  ---
  
  Project Info:
  {
    "name": "${workspaceData.name}",
    "description": "${workspaceData.description}"
  }
  
  Agents:
  ${JSON.stringify(
    workspaceData.agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      objective: agent.objective,
      background: agent.background,
      capabilities: agent.capabilities,
      tools: agent.tools?.map((t) => t.name) || [],
      llmId: agent.llmId,
    })),
    null,
    2
  )}
  
  Tasks:
  ${JSON.stringify(
    workspaceData.tasks.map((task) => ({
      id: task.id,
      name: task.name,
      description: task.description,
      expectedOutput: task.expectedOutput,
      type: task.executeWorkflow ? "workflow" : "agentic",
      workflow:
        task.executeWorkflow && task.workflowId
          ? {
              id: task.workflowId,
              name: task.workflowName || "Unnamed Workflow",
            }
          : null,
      assignedAgent: task.executeWorkflow
        ? null
        : task.assignedAgent
        ? {
            name:
              workspaceData.agents.find((a) => a.id === task.assignedAgent)
                ?.name || "Unknown",
            fixed: true,
          }
        : {
            name: null,
            fixed: false,
          },
    })),
    null,
    2
  )}
  
  Workflows:
  ${JSON.stringify(
    workspaceData.workflows.map((wf) => ({
      id: wf.id,
      name: wf.name,
      description: wf.description,
    })),
    null,
    2
  )}
  
  ---
  
  Instructions:
  Based on the above context, return a project execution plan as valid JSON only.
  
  ### JSON Format to Return:
  
  {
    "project": {
      "name": "string",
      "objective": "string"
    },
    "steps": [
      {
        "step": 1,
        "task": "string = task id",
        "type": "agentic" | "workflow",
        "agent": "string (if type is agentic and assignedAgent.fixed is true, use it; if fixed is false, choose the most suitable agent based on the agent's background, role, capabilities, and tools) = agent id,",
        "workflow": "string (if type is workflow) = workflow id",
        "description": "string",
        "inputs": ["string"],
        "outputs": ["string"],
        "toolsUsed": ["string"],
        "dependsOn": [stepNumber]
      }
    ],
    "collaboration": {
      "notes": "string",
      "pairings": [
        {
          "agents": ["string", "string"],
          "purpose": "string"
        }
      ]
    },
    "workflowRecommendations": [
      {
        "name": "string",
        "action": "use" | "ignore" | "move_to_separate_project",
        "notes": "string"
      }
    ]
  }
  
  Notes:
  - Each step must have either an "agent" (for agentic tasks) or a "workflow" (for automated tasks), never both.
  - For steps where "type" is "agentic":
    - If the task includes a pre-assigned agent, use their name in the "agent" field.
    - If the agent is not pre-assigned, choose the most suitable agent based on role, tools, and capabilities.
  - For steps where "type" is "workflow", provide the "workflow" field with the workflow name and omit the "agent".
  - Fill in "toolsUsed" only if relevant tools are needed from the agent’s toolset.
  - Use "dependsOn" to specify step order or prerequisites if necessary.
  - Output a clean and valid JSON object only — no markdown or extra explanation.
  
  Only return the JSON object — no additional text, markdown, or explanation.
  No Notes at the end.
  `;
  return prompt;
}

/**
 * Build context from dependency results for the current step
 */
function buildDependencyContext(
  step: ExecutionStep,
  results: StepExecutionResult[]
): string {
  if (!step.dependsOn || step.dependsOn.length === 0) {
    return "";
  }

  const dependencyResults = step.dependsOn
    .map((stepNumber) => {
      const dependencyResult = results.find((r) => r.stepNumber === stepNumber);
      if (!dependencyResult) {
        console.warn(
          `⚠️ Dependency step ${stepNumber} not found for step ${step.step}`
        );
        return null;
      }

      if (!dependencyResult.success) {
        console.warn(
          `⚠️ Dependency step ${stepNumber} failed for step ${step.step}`
        );
        return null;
      }

      return {
        stepNumber: dependencyResult.stepNumber,
        taskName: dependencyResult.taskName,
        executedBy: dependencyResult.executedBy,
        result: dependencyResult.result,
      };
    })
    .filter((result) => result !== null);

  if (dependencyResults.length === 0) {
    return "";
  }

  // Format the context in a clear way for the agent
  const contextLines = [
    "=== PREVIOUS STEP RESULTS ===",
    "The following results are available from previous steps that this task depends on:",
    "",
  ];

  dependencyResults.forEach((dep) => {
    contextLines.push(`## Step ${dep.stepNumber}: ${dep.taskName}`);
    contextLines.push(`Executed by: ${dep.executedBy}`);
    contextLines.push(`Result:`);
    contextLines.push(dep.result);
    contextLines.push("");
  });

  contextLines.push("=== END PREVIOUS RESULTS ===");
  contextLines.push("");
  contextLines.push(
    "Please use the above results as context when completing your current task."
  );

  console.log(
    `📋 Built dependency context for step ${step.step}:`,
    contextLines.join("\n")
  );

  return contextLines.join("\n");
}

/**
 * Validate that all dependencies for a step have been executed successfully
 */
function validateDependencies(
  step: ExecutionStep,
  results: StepExecutionResult[]
): { isValid: boolean; error?: string } {
  if (!step.dependsOn || step.dependsOn.length === 0) {
    return { isValid: true };
  }

  // Check if all dependencies have been executed
  for (const depStepNumber of step.dependsOn) {
    const depResult = results.find((r) => r.stepNumber === depStepNumber);

    if (!depResult) {
      return {
        isValid: false,
        error: `Dependency step ${depStepNumber} has not been executed yet`,
      };
    }

    if (!depResult.success) {
      return {
        isValid: false,
        error: `Dependency step ${depStepNumber} failed: ${
          depResult.error || "Unknown error"
        }`,
      };
    }
  }

  return { isValid: true };
}
