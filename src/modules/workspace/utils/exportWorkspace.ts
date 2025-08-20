/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { WorkspaceData } from "../types/Types";
import { generateWorkspacePrompt } from "./runtimeUtils";
import { loadWorkflowFromFile, WorkflowFile } from "./workflowStorageUtils";
import { exportFlowRunner } from "../../flow/utils/exportFlowRunner";



export const exportWorkspaceAsJs = async (
  workspaceData : WorkspaceData
) => {
const prompt = generateWorkspacePrompt(workspaceData)
const usedWorkflows: { [workflowName: string]: string } = {};

workspaceData.tasks.forEach((task) => {
    if (task.workflowId && task.executeWorkflow){
        usedWorkflows[task.workflowName ?? task.name] = task.workflowId;
    }
});
console.log(workspaceData)
console.log("Used Workflows", usedWorkflows)

// Load only the used workflows
const workflowDataMap: { [workflowId: string]: WorkflowFile } = {};
const workFlowRuntimes: { [workflowId: string]: string } = {};
for (const [workflowName, workflowId] of Object.entries(usedWorkflows)) {
  try {
    const workflowData = await loadWorkflowFromFile(workflowId);
    console.log("Workflow Data", workflowData)
    if (workflowData) {
      workflowDataMap[workflowId] = workflowData;
      const workflowRuntime = await exportFlowRunner(workflowData.canvasState.nodes, workflowData.canvasState.connections, true);
      if (workflowRuntime) {
        workFlowRuntimes[workflowId] = workflowRuntime;
      }else{
        console.error(`❌ Failed to get workflow runtime for ${workflowName} (${workflowId})`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to load workflow ${workflowName} (${workflowId}):`, error);
  }
}

let runtimeString = "";
for (const workflowId of Object.keys(workFlowRuntimes)) {
  runtimeString += `
  "${workflowId}": async () => { ${workFlowRuntimes[workflowId]} },
  `;
}



  // Generate the JavaScript code with self-executing functionality
  const jsCode = `/*
* yaLLMa3 Workspace Runtime - Standalone JavaScript File
* Generated from workspace: ${workspaceData.name}
* Description: ${workspaceData.description}
* Main LLM: ${workspaceData.mainLLM}
* 
* This file contains a complete runtime for executing yaLLMa3 workspace tasks.
* Usage: Load this file in Node.js or browser and call executeWorkspace().
*/

// ===== WORKSPACE CONFIGURATION =====
const workspaceConfig = ${JSON.stringify(workspaceData, null, 2)};

// ===== WORKFLOW DATA =====
const workflowData = ${JSON.stringify(workflowDataMap, null, 2)};


// ===== CORE DATA STRUCTURES =====

class ExecutionStep {
  constructor(step, task, agent, workflow, type, description, inputs, outputs, toolsUsed, dependsOn) {
    this.step = step;
    this.task = task;
    this.agent = agent;
    this.workflow = workflow;
    this.type = type;
    this.description = description;
    this.inputs = inputs;
    this.outputs = outputs;
    this.toolsUsed = toolsUsed;
    this.dependsOn = dependsOn;
  }
}

class StepResult {
  constructor(stepNumber, taskName, executedBy, success, result, executionTime, error) {
    this.stepNumber = stepNumber;
    this.taskName = taskName;
    this.executedBy = executedBy;
    this.success = success;
    this.result = result;
    this.executionTime = executionTime;
    this.error = error;
  }
}

const runtimes = {
  ${runtimeString}
}

// ===== LLM INTEGRATION =====
class GroqChatRunner {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.groq.com/openai/v1/chat/completions";
  }

  async run(prompt, systemPrompt = "") {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": \`Bearer \${this.apiKey}\`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || null;
    } catch (error) {
      console.error("Groq API error:", error);
      return null;
    }
  }
}

// ===== AGENT RUNTIME =====
class AgentRuntime {
  constructor(agent, task, llm, dependencyContext = "", verbose = false) {
    this.agent = agent;
    this.task = task;
    this.llm = llm;
    this.context = dependencyContext;
    this.history = [];
    this.maxIterations = 5;
    this.verbose = verbose;
  }

  async run() {
    let iteration = 0;
    let output = "";
    let feedback = "";

    while (iteration < this.maxIterations) {
      if (this.verbose) {
        console.log(\`\\n🗣️  [Agent: \${this.agent.name}] Iteration \${iteration + 1}:\`);
      }
      
      // Step 1: Generate response
      const systemPrompt = this.buildPrompt(iteration, output, feedback);
      
      if (this.verbose) {
        console.log(\`📋 System Prompt:\`);
        console.log(systemPrompt);
        if (this.context) {
          console.log(\`\\n📚 Dependency Context:\`);
          console.log(this.context);
        }
      }
      
      let response = await this.llm.run(this.context, systemPrompt);
      
      if (!response) {
        response = "Error: No response from LLM";
      }

      if (this.verbose) {
        console.log(\`\\n🧠 [Agent: \${this.agent.name}] LLM Response:\`);
        console.log(response);
        console.log(\`\\n📊 Response Length: \${response.length} characters\`);
      }

      this.history.push(\`Agent: \${response}\`);

      // Step 2: Execute tools if requested
      const toolOutput = await this.tryUseToolIfRequested(response);
      const finalResponse = toolOutput || response;

      // Step 3: Review the response
      const reviewResult = await this.reviewResponse(finalResponse);
      
      if (this.verbose) {
        console.log(\`\\n🔍 [Agent: \${this.agent.name}] Review Result:\`, reviewResult);
      }

      if (reviewResult.isComplete) {
        output = finalResponse;
        if (this.verbose) {
          console.log(\`\\n✅ [Agent: \${this.agent.name}] Task completed successfully after \${iteration + 1} iterations!\`);
        }
        break;
      }

      // Step 4: Use feedback for next iteration
      output = finalResponse;
      feedback = reviewResult.feedback;
      if (reviewResult.feedback && this.verbose) {
        console.log(\`\\n📝 [Agent: \${this.agent.name}] Feedback for next iteration:\`, reviewResult.feedback);
      }
      
      iteration++;
      
      if (this.verbose) {
        console.log(\`\\n🔄 [Agent: \${this.agent.name}] Continuing to iteration \${iteration + 1}...\`);
      }
    }

    if (iteration >= this.maxIterations) {
      if (this.verbose) {
        console.log(\`\\n⚠️ [Agent: \${this.agent.name}] Max iterations reached. Returning best effort result.\`);
      }
    }

    return output;
  }

  buildPrompt(iteration, previousResult, feedback) {
    let intro;
    
    if (iteration === 0) {
      intro = \`You are \${this.agent.name}, a \${this.agent.role}. Your task is: \${this.task.description}\`;
    } else {
      intro = \`You are \${this.agent.name}, a \${this.agent.role}. Please refine your previous result based on the feedback provided.

PREVIOUS RESULT:
\${previousResult}

FEEDBACK FOR IMPROVEMENT:
\${feedback}

Please provide an improved version that addresses the feedback while maintaining what was good about the previous result.\`;
    }

    const completionInstructions = \`
Provide a complete, comprehensive solution that fully addresses the task requirements.

Expected Output: \${this.task.expectedOutput}

Background: \${this.agent.background}
Capabilities: \${this.agent.capabilities}\`;

    return \`\${intro}\${completionInstructions}\`;
  }

  async tryUseToolIfRequested(response) {
    for (const tool of this.agent.tools) {
      if (response.includes(\`[use_tool:\${tool.name}]\`)) {
        // Note: Tool execution would need to be implemented based on your tool system
        const result = \`Tool "\${tool.name}" would be executed here\`;
        return \`Tool "\${tool.name}" executed: \${result}\`;
      }
    }
    return null;
  }

  async reviewResponse(response) {
    const reviewPrompt = this.buildReviewPrompt(response);
    
    if (this.verbose) {
      console.log(\`\\n🔍 [Agent: \${this.agent.name}] Review Prompt:\`);
      console.log(reviewPrompt);
    }
    
    const reviewResponse = await this.llm.run(reviewPrompt, "");
    
    if (!reviewResponse) {
      return {
        isValid: false,
        feedback: "Review failed - no response from LLM",
        isComplete: false
      };
    }

    if (this.verbose) {
      console.log(\`\\n🔍 [Agent: \${this.agent.name}] Review Response:\`);
      console.log(reviewResponse);
    }

    // Parse the review response
    return this.parseReviewResponse(reviewResponse);
  }

  buildReviewPrompt(response) {
    return \`You are a quality reviewer. Review the following response against the task requirements.

TASK: \${this.task.name}
DESCRIPTION: \${this.task.description}
EXPECTED OUTPUT: \${this.task.expectedOutput}

RESPONSE TO REVIEW:
\${response}

Please evaluate this response and provide your assessment in the following format:

VALID: [YES/NO]
COMPLETE: [YES/NO]
FEEDBACK: [Detailed feedback explaining what's good, what's missing, and what needs improvement]

Guidelines:
- VALID: Does the response address the task requirements?
- COMPLETE: Does the response fully satisfy the expected output?
- FEEDBACK: Provide specific, actionable feedback for improvement

If the response is both VALID and COMPLETE, the task is finished. Otherwise, provide specific feedback for the next iteration.\`;
  }

  parseReviewResponse(reviewResponse) {
    // Extract VALID status
    const validMatch = reviewResponse.match(/VALID:\\s*(YES|NO)/i);
    const isValid = validMatch ? validMatch[1].toUpperCase() === 'YES' : false;
    
    // Extract COMPLETE status
    const completeMatch = reviewResponse.match(/COMPLETE:\\s*(YES|NO)/i);
    const isComplete = completeMatch ? completeMatch[1].toUpperCase() === 'YES' : false;
    
    // Extract FEEDBACK
    const feedbackMatch = reviewResponse.match(/FEEDBACK:\\s*([\\s\\S]*?)(?=\\n\\n|$)/i);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : "No specific feedback provided";
    
    // Fallback logic for parsing
    if (!validMatch || !completeMatch) {
      // If we can't parse the structured response, use heuristics
      const hasCompletionIndicators = this.hasCompletionIndicators(reviewResponse);
      const isRelevant = this.isResponseRelevant(reviewResponse);
      
      return {
        isValid: isRelevant,
        feedback: feedback,
        isComplete: hasCompletionIndicators && isRelevant
      };
    }
    
    return {
      isValid,
      feedback,
      isComplete
    };
  }

  isResponseRelevant(response) {
    // Check if response contains keywords related to the task
    const taskKeywords = [
      ...this.task.name.toLowerCase().split(' '),
      ...this.task.description.toLowerCase().split(' ').filter(word => word.length > 3)
    ];
    
    const responseLower = response.toLowerCase();
    const relevantKeywords = taskKeywords.filter(keyword => 
      responseLower.includes(keyword)
    );
    
    // Consider relevant if it contains at least 2 task-related keywords
    return relevantKeywords.length >= 2;
  }

  hasCompletionIndicators(response) {
    const responseLower = response.toLowerCase();
    
    // Common completion phrases
    const completionPhrases = [
      "in conclusion",
      "to summarize",
      "in summary",
      "overall",
      "therefore",
      "thus",
      "finally",
      "recommendations",
      "conclusion",
      "summary"
    ];
    
    // Check for completion phrases
    const hasCompletionPhrase = completionPhrases.some(phrase => 
      responseLower.includes(phrase)
    );
    
    // Check for structured response patterns (like numbered lists, bullet points)
    const hasStructuredFormat = /\\d+\\.|•|- |\\* |\\n\\s*[A-Z]/.test(response);
    
    // Check for comprehensive response length (more than 200 words)
    const wordCount = response.split(/\\s+/).length;
    const isComprehensive = wordCount > 200;
    
    return hasCompletionPhrase || (hasStructuredFormat && isComprehensive);
  }
}

// ===== WORKSPACE RUNTIME =====
class WorkspaceRuntime {
  constructor(verbose = false) {
    this.results = [];
    this.verbose = verbose;
  }

  log(type, message, details = "") {
    console.log(\`[\${type.toUpperCase()}] \${message}\`);
    if (details) console.log(details);
  }

  speak(message, data = null) {
    if (this.verbose) {
      console.log(\`\\n🗣️  \${message}\`);
      if (data) {
        if (typeof data === 'string') {
          console.log(data);
        } else {
          console.log(JSON.stringify(data, null, 2));
        }
      }
      console.log(""); // Empty line for readability
    }
  }

  async execute(workspaceData, prompt) {
    this.log("info", \`Starting workspace execution: \${workspaceData.name}\`);
    
    // Generate project plan using main LLM
    const mainRunner = new GroqChatRunner(workspaceData.apiKey);
    const planPrompt = \`${prompt}\`;
    
    this.speak("📋 Sending project planning prompt to LLM:", planPrompt);
    
    const result = await mainRunner.run(planPrompt, "You are a project planning expert. Create clear, actionable steps.");
    
    if (!result) {
      this.log("error", "Failed to generate project plan");
      return null;
    }

    this.speak("🧠 LLM Response (Raw):", result);

    const parsed = this.parseLLMResponse(result);
    
    if (parsed) {
      this.log("success", "Project plan generated successfully");
      this.speak("📊 Parsed Project Plan:", parsed);
      
      if (parsed.steps && parsed.steps.length > 0) {
        const sequentialSteps = this.convertToSequentialSteps(parsed);
        this.speak("🔄 Converted to Sequential Steps:", sequentialSteps);
        const results = await this.executeTasksSequentially(workspaceData, sequentialSteps);
        return results;
      } else {
        this.log("warning", "No steps found in project plan");
        return [];
      }
    } else {
      this.log("error", "Failed to parse project plan");
      return null;
    }
  }

  parseLLMResponse(rawText) {
    try {
      const cleaned = rawText.trim().replace(/^\\\`\\\`\\\`json/, "").replace(/\\\`\\\`\\\`$/, "").trim();
      const parsed = JSON.parse(cleaned);
      
      if (parsed && typeof parsed.project?.name === "string" && Array.isArray(parsed.steps)) {
        return parsed;
      }
      
      return null;
    } catch (err) {
      console.error("Error parsing LLM response:", err);
      return null;
    }
  }

  convertToSequentialSteps(parsedPlan) {
    return parsedPlan.steps.map((step, index) => new ExecutionStep(
      index + 1,
      step.task,
      step.agent,
      step.workflow,
      step.type || "agentic",
      step.description,
      step.inputs,
      step.outputs,
      step.toolsUsed,
      step.dependsOn
    ));
  }

  async executeTasksSequentially(workspaceData, steps) {
    const results = [];
    
    this.log("info", \`Starting sequential execution of \${steps.length} steps\`);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepNumber = i + 1;

      // Find task, agent, and workflow
      const task = workspaceData.tasks.find(t => t.id === step.task || t.name === step.task);
      const agent = step.agent 
        ? workspaceData.agents.find(a => a.id === step.agent || a.name === step.agent)
        : task?.assignedAgent 
          ? workspaceData.agents.find(a => a.id === task.assignedAgent)
          : null;
      const workflow = task?.workflowId 
        ? workflowData[task.workflowId]
        : null;

      if (!task) {
        this.log("error", \`Task not found: \${step.task}\`);
        results.push(new StepResult(stepNumber, step.task, "Unknown", false, "", 0, "Task not found"));
        continue;
      }

      if (!agent && !workflow) {
        this.log("error", \`No agent or workflow found for task: \${task.name}\`);
        results.push(new StepResult(stepNumber, task.name, "Unknown", false, "", 0, "No agent or workflow found"));
        continue;
      }

      // Validate dependencies
      if (!this.validateDependencies(step, results)) {
        this.log("error", \`Dependency validation failed for step \${stepNumber}\`);
        results.push(new StepResult(stepNumber, task.name, agent?.name || workflow?.name || "Unknown", false, "", 0, "Dependency validation failed"));
        continue;
      }

      // Execute task
      this.log("info", \`Starting step \${stepNumber}: \${task.name}\`);
      const executorName = agent?.name || workflow?.name || "Unknown";
      const executorType = agent ? "Agent" : "Workflow";
      
      this.speak(\`🚀 Executing Step \${stepNumber}: \${task.name} with \${executorType}: \${executorName}\`, {
        task: {
          id: task.id,
          name: task.name,
          description: task.description,
          expectedOutput: task.expectedOutput
        },
        executor: agent ? {
          type: "agent",
          name: agent.name,
          role: agent.role,
          background: agent.background,
          capabilities: agent.capabilities
        } : {
          type: "workflow",
          name: workflow.name,
          description: workflow.description
        }
      });
      
      const startTime = Date.now();
      
      try {
        let result;
        
        if (agent) {
          // Execute with agent
          const dependencyContext = this.buildDependencyContext(step, results);
          const runtime = new AgentRuntime(agent, task, new GroqChatRunner(agent.apiKey || workspaceData.apiKey), dependencyContext, this.verbose);
          result = await runtime.run();
        } else if (workflow) {
           // Execute workflow
          const workflowResult = await runtimes[workflow.id]();
          console.log("Workflow Result", workflowResult[0].result);
          this.log("info", \`Executing workflow: \${workflow.name}\`);
          // const workflowResult = await this.executeWorkflow(workflow);

          result = workflowResult[0].result;
        }
        
        const executionTime = Date.now() - startTime;
        this.log("success", \`Step \${stepNumber} completed successfully\`);
        
        this.speak(\`✅ Step \${stepNumber} Result:\`, {
          taskName: task.name,
          executorName: executorName,
          executorType: executorType,
          executionTime: executionTime + "ms",
          result: result,
          resultLength: result.length + " characters"
        });
        
        results.push(new StepResult(stepNumber, task.name, executorName, true, result, executionTime));
      } catch (error) {
        const executionTime = Date.now() - startTime;
        this.log("error", \`Step \${stepNumber} failed: \${error.message}\`);
        
        this.speak(\`❌ Step \${stepNumber} Error:\`, {
          taskName: task.name,
          executorName: executorName,
          executorType: executorType,
          executionTime: executionTime + "ms",
          error: error.message,
          stack: error.stack
        });
        
        results.push(new StepResult(stepNumber, task.name, executorName, false, "", executionTime, error.message));
      }
    }

    this.log("success", \`Execution completed: \${results.filter(r => r.success).length}/\${results.length} steps successful\`);
    return results;
  }

  validateDependencies(step, results) {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return true;
    }

    for (const depStepNumber of step.dependsOn) {
      const depResult = results.find(r => r.stepNumber === depStepNumber);
      
      if (!depResult || !depResult.success) {
        return false;
      }
    }

    return true;
  }

  buildDependencyContext(step, results) {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return "";
    }

    const dependencyResults = step.dependsOn
      .map(stepNumber => {
        const dependencyResult = results.find(r => r.stepNumber === stepNumber);
        if (!dependencyResult || !dependencyResult.success) {
          return null;
        }
        
        return {
          stepNumber: dependencyResult.stepNumber,
          taskName: dependencyResult.taskName,
          result: dependencyResult.result
        };
      })
      .filter(result => result !== null);

    if (dependencyResults.length === 0) {
      return "";
    }

    const contextLines = [
      "=== PREVIOUS STEP RESULTS ===",
      "The following results are available from previous steps that this task depends on:",
      ""
    ];

    dependencyResults.forEach(dep => {
      contextLines.push(\`## Step \${dep.stepNumber}: \${dep.taskName}\`);
      contextLines.push(\`Result:\`);
      contextLines.push(dep.result);
      contextLines.push("");
    });

    contextLines.push("=== END PREVIOUS RESULTS ===");
    contextLines.push("Please use the above results as context when completing your current task.");
    
    return contextLines.join("\\n");
  }

  async executeWorkflow(workflow) {
    try {
      this.log("info", \`Executing workflow: \${workflow.name}\`);
      
      // Simple workflow execution - just return the workflow description for now
      // In a full implementation, this would execute the actual workflow nodes
      const result = \`Workflow "\${workflow.name}" executed successfully.\\n\\nDescription: \${workflow.description}\\n\\nNote: Full workflow execution with nodes and connections would be implemented here.\`;
      
      this.log("success", \`Workflow \${workflow.name} completed\`);
      return result;
    } catch (error) {
      this.log("error", \`Workflow \${workflow.name} failed: \${error.message}\`);
      throw error;
    }
  }
}

// ===== MAIN EXECUTION FUNCTION =====
async function executeWorkspace(workspaceConfig, prompt, verbose = false) {
  const runtime = new WorkspaceRuntime(verbose);
  return await runtime.execute(workspaceConfig, prompt);
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { executeWorkspace, WorkspaceRuntime, AgentRuntime, GroqChatRunner, workspaceConfig };
}

// Make available globally for browser environments
if (typeof window !== 'undefined') {
  window.yaLLMa3Runtime = { executeWorkspace, WorkspaceRuntime, AgentRuntime, GroqChatRunner, workspaceConfig };
}

// ===== AUTO-EXECUTION =====
// Check for -speak flag for verbose logging
const isVerbose = process.argv.includes('-speak') || process.argv.includes('--speak');
const speakMode = isVerbose ? 'ON' : 'OFF';

console.log("🚀 Loading yaLLMa3 workspace runtime...");
console.log(\`📋 Workspace: \${workspaceConfig.name}\`);
console.log(\`📝 Description: \${workspaceConfig.description}\`);
console.log(\`🔑 API Key: \${workspaceConfig.apiKey}\`);
console.log(\`📊 Tasks: \${workspaceConfig.tasks.length}, Agents: \${workspaceConfig.agents.length}, Workflows: \${Object.keys(workflowData).length}\`);
console.log(\`🗣️  Verbose Logging: \${speakMode}\`);
if (isVerbose) {
  console.log("💡 Use '-speak' flag for detailed logging of prompts and results");
  console.log("📝 Example: node workspace.js -speak");
}
console.log("");

// Auto-execute with a default prompt
executeWorkspace(workspaceConfig, \`${prompt}\`, isVerbose)
  .then(results => {
    console.log("\\n🎉 Workspace execution completed!");
    console.log("📊 Execution Summary:");
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    console.log(\`✅ Successful: \${successful}/\${total}\`);
    
    results.forEach(result => {
      const status = result.success ? "✅" : "❌";
      console.log(\`\${status} Step \${result.stepNumber}: \${result.taskName} (\${result.executedBy})\`);
      if (result.success) {
        console.log(\`   Time: \${result.executionTime}ms, Result: \${result.result.substring(0, 100)}...\`);
      } else {
        console.log(\`   Error: \${result.error}\`);
      }
    });
  })
  .catch(error => {
    console.error("\\n❌ Workspace execution failed:", error);
    console.error("\\n💡 Troubleshooting:");
    console.error("1. Check if your API key is valid");
    console.error("2. Ensure you have internet connection");
    console.error("3. Verify your workspace configuration");
  });
`;

  try {
    // Use Tauri dialog to let the user choose where to save the file
    const filePath = await save({
      defaultPath: `${workspaceData.name}.js`,
      filters: [
        {
          name: "JavaScript",
          extensions: ["js"],
        },
      ],
    });

    if (filePath) {
      // Use Tauri file system API to save the file
      await writeTextFile(filePath, jsCode);
      console.log(`Flow exported successfully to ${filePath}`);
      return filePath;
    } else {
      console.log("Export canceled by user");
      return null;
    }
  } catch (error) {
    console.error("Failed to export flow:", error);
    throw error;
  }
};
