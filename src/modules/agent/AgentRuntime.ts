import {  Agent, Task } from '../workspace/types/Types'
import { ChatRunner } from '../workspace/utils/runtimeUtils';
import { runTool } from "./tools/ToolRunner";

interface ReviewResult {
  isValid: boolean;
  feedback: string;
  isComplete: boolean;
}

export class AgentRuntime {
    private agent: Agent;
    private task: Task;
    private llm: ChatRunner; // must conform to your engine
    private context: string = "";
    private history: string[] = [];
    private maxIterations = 5;
  
    constructor(agent: Agent, task: Task, llm: ChatRunner, dependencyContext?: string) {
      this.agent = agent;
      this.task = task;
      this.llm = llm;
      this.context = dependencyContext || "";
    }
  
    async run(): Promise<string> {
      let iteration = 0;
      let output = "";
      let feedback = "";
  
      while (iteration < this.maxIterations) {
        console.log("Iteration:", iteration)
        
        // Step 1: Generate response
        const systemPrompt = this.buildPrompt(iteration, output, feedback);
        let response = await this.llm.run(this.context, systemPrompt);
        if (!response) {
          response = "Error: No response from LLM";
        }
        console.log("🧠 Agent Response: ", response)
        this.history.push(`🧠 Agent: ${response}`);
  
        // Step 2: Execute tools if requested
        const toolOutput = await this.tryUseToolIfRequested(response);
        const finalResponse = toolOutput || response;
  
        // Step 3: Review the response
        const reviewResult = await this.reviewResponse(finalResponse);
        console.log("🔍 Review Result:", reviewResult);
  
        if (reviewResult.isComplete) {
          output = finalResponse;
          console.log("✅ Task completed successfully!")
          break;
        }
  
        // Step 4: Use feedback for next iteration
        output = finalResponse;
        feedback = reviewResult.feedback;
        if (reviewResult.feedback) {
          console.log("📝 Feedback for next iteration:", reviewResult.feedback);
        }
        
        iteration++;
      }
  
      if (iteration >= this.maxIterations) {
        console.log("⚠️ Max iterations reached. Returning best effort result.");
      }
  
      return output;
    }
  
    private buildPrompt(iteration: number, previousResult: string, feedback: string): string {
      let intro: string;
      
      if (iteration === 0) {
        intro = `You are ${this.agent.name}, a ${this.agent.role}. Your task is: ${this.task.description}`;
      } else {
        intro = `You are ${this.agent.name}, a ${this.agent.role}. Please refine your previous result based on the feedback provided.

PREVIOUS RESULT:
${previousResult}

FEEDBACK FOR IMPROVEMENT:
${feedback}

Please provide an improved version that addresses the feedback while maintaining what was good about the previous result.`;
      }

     
      const completionInstructions = `
Provide a complete, comprehensive solution that fully addresses the task requirements.

Expected Output: ${this.task.expectedOutput}`;
  
      return `${intro}\n${completionInstructions}`;
    }
  
    private async tryUseToolIfRequested(response: string): Promise<string | null> {
      for (const tool of this.agent.tools) {
        if (response.includes(`[use_tool:${tool.name}]`)) {
          const result = await runTool(tool, this.task); // You'll define this
          return `Tool "${tool.name}" executed: ${result}`;
        }
      }
      return null;
    }
  
    private async reviewResponse(response: string): Promise<ReviewResult> {
      const reviewPrompt = this.buildReviewPrompt(response);
      const reviewResponse = await this.llm.run(reviewPrompt, "");
      
      if (!reviewResponse) {
        return {
          isValid: false,
          feedback: "Review failed - no response from LLM",
          isComplete: false
        };
      }
  
      // Parse the review response
      return this.parseReviewResponse(reviewResponse);
    }
  
    private buildReviewPrompt(response: string): string {
      return `You are a quality reviewer. Review the following response against the task requirements.

TASK: ${this.task.name}
DESCRIPTION: ${this.task.description}
EXPECTED OUTPUT: ${this.task.expectedOutput}

RESPONSE TO REVIEW:
${response}

Please evaluate this response and provide your assessment in the following format:

VALID: [YES/NO]
COMPLETE: [YES/NO]
FEEDBACK: [Detailed feedback explaining what's good, what's missing, and what needs improvement]

Guidelines:
- VALID: Does the response address the task requirements?
- COMPLETE: Does the response fully satisfy the expected output?
- FEEDBACK: Provide specific, actionable feedback for improvement

If the response is both VALID and COMPLETE, the task is finished. Otherwise, provide specific feedback for the next iteration.`;
    }
  
    private parseReviewResponse(reviewResponse: string): ReviewResult {
      // Extract VALID status
      const validMatch = reviewResponse.match(/VALID:\s*(YES|NO)/i);
      const isValid = validMatch ? validMatch[1].toUpperCase() === 'YES' : false;
      
      // Extract COMPLETE status
      const completeMatch = reviewResponse.match(/COMPLETE:\s*(YES|NO)/i);
      const isComplete = completeMatch ? completeMatch[1].toUpperCase() === 'YES' : false;
      
      // Extract FEEDBACK
      const feedbackMatch = reviewResponse.match(/FEEDBACK:\s*([\s\S]*?)(?=\n\n|$)/i);
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
  
    private isResponseRelevant(response: string): boolean {
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
  
    private hasCompletionIndicators(response: string): boolean {
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
      const hasStructuredFormat = /\d+\.|•|- |\* |\n\s*[A-Z]/.test(response);
      
      // Check for comprehensive response length (more than 200 words)
      const wordCount = response.split(/\s+/).length;
      const isComprehensive = wordCount > 200;
      
      return hasCompletionPhrase || (hasStructuredFormat && isComprehensive);
    }
}
  

  
  
  
  