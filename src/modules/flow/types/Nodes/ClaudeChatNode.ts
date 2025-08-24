/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import {
  BaseNode,
  ConfigParameterType,
  NodeValue,
  NodeExecutionContext,
} from "../NodeTypes";
import { NodeRegistry } from "../NodeRegistry";
export interface ChatNode extends BaseNode {
  nodeType: string;
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

export function createNClaudeChatNode(
  id: number,
  type: { x: number; y: number }
): ChatNode {
  return {
    id,
    title: "Chat",
    nodeValue: "claude-3-haiku-20240307",
    nodeType: "ClaudeChat",
    sockets: [
      {
        id: id * 100 + 1,
        title: "Prompt",
        type: "input",
        nodeId: id,
        dataType: "string",
      },
      {
        id: id * 100 + 2,
        title: "System Prompt",
        type: "input",
        nodeId: id,
        dataType: "string",
      },
      {
        id: id * 100 + 3,
        title: "Response",
        type: "output",
        nodeId: id,
        dataType: "string",
      },
      {
        id: id * 100 + 4,
        title: "Tokens",
        type: "output",
        nodeId: id,
        dataType: "number",
      },
    ],
    x: type.x,
    y: type.y,
    width: 300, // Wider to accommodate multiple inputs
    height: 240, // Taller to fit multi-line text
    selected: false,
    processing: false,
    process: async ({ node, getInputValue }) => {
      const n = node as ChatNode;
      // If we have a cached result for this node, use it
      const promptValue = await getInputValue(n.id * 100 + 1);
      const systemPrompt = await getInputValue(n.id * 100 + 2);

      const prompt = String(promptValue || "");

      // Extract model name from node value
      const modelMatch = n.nodeValue?.toString().trim().toLowerCase().replace(/\s+/g, "-") || "";
      console.log("n.nodeValue", n.nodeValue);
      console.log("modelMatch", modelMatch);

      const model = modelMatch ? modelMatch : "claude-3-haiku-20240307"; // Default fallback

      // Use system prompt from input, but don't use the node.value (which now contains the model)
      const system = String(systemPrompt || "");

      try {
        // Get API key from config parameters
        let CLAUDE_API_KEY = "";
        if(n.getConfigParameter){
          CLAUDE_API_KEY = n.getConfigParameter("API Key")?.paramValue as string || "";
        }
        else{
          throw new Error("API Key not found");
        }

        console.log("CLAUDE_API_KEY", CLAUDE_API_KEY);
        console.log(`Using model: ${model}`);
        console.log(
          `Executing Chat node ${n.id} with prompt: "${prompt.substring(
            0,
            50
          )}..."`
        );
        const messages = system
          ? [
              { role: "user", content: prompt },
              { role: "system", content: system },
            ]
          : [{ role: "user", content: prompt }];
        const res = await fetch(
          "https://api.anthropic.com/v1/messages",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "anthropic-version": "2023-06-01",
              Authorization: `Bearer ${CLAUDE_API_KEY}`,
            },
            body: JSON.stringify({
              model: model,
              messages: messages,
              max_tokens: 1000,
              temperature: 0.7,
              top_p: 1,
              frequency_penalty: 0,
              presence_penalty: 0,
            }),
          }
        );

        if (!res.ok) {
          throw new Error(`Chat API returned status ${res.status}`);
        }

        const json = await res.json();
        console.log(
          `Chat node ${n.id} received response:`,
          json.content[0].text.substring(0, 50) + "..."
        );

        // Return an object with both values to support multiple outputs
        return {
          // Socket id 3 is for Response content
          [n.id * 100 + 3]: json.content[0].text,
          // Socket id 4 is for Token count
          [n.id * 100 + 4]: json.usage?.input_tokens || 0,
        };
      } catch (error) {
        console.error("Error in Chat node:", error);
        // Return error in the response output
        return {
          [n.id * 100 + 3]: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
          [n.id * 100 + 4]: 0,
        };
      }
    },
    configParameters: [
      {
        parameterName: "Model",
        parameterType: "string",
        defaultValue: "claude-3-haiku-20240307",
        valueSource: "UserInput",
        UIConfigurable: true,
        description: "Model name to use for the chat node",
        isNodeBodyContent: true,
        sourceList: [
          {
            key: "claude-3-haiku-20240307",
            label: "Claude 3 Haiku",
          },
          {
            key: "claude-3-sonnet-20240229",
            label: "Claude 3 Sonnet",
          },
          {
            key: "claude-3-opus-20240229",
            label: "Claude 3 Opus",
          },
          {
            key: "claude-3-5-sonnet-20240620",
            label: "Claude 3.5 Sonnet",
          },
        ],
      },
      {
        parameterName: "API Key",
        parameterType: "string",
        defaultValue: "",
        valueSource: "UserInput",
        UIConfigurable: true,
        description: "API Key for the Claude service",
        isNodeBodyContent: false,
      },
    ],
    getConfigParameters: function (): ConfigParameterType[] {
      return this.configParameters || [];
    },
    getConfigParameter(parameterName: string): ConfigParameterType | undefined {
      const parameter = (this.configParameters ?? []).find(
        (param) => param.parameterName === parameterName
      );
      return parameter;
    },
    setConfigParameter(parameterName, value): void {
      const parameter = (this.configParameters ?? []).find(
        (param) => param.parameterName === parameterName
      );
      if (parameter) {
        parameter.paramValue = value;
      }
    },
  };
}

export function register(nodeRegistry: NodeRegistry): void {
  console.log("Registering Claude Chat Node");
  nodeRegistry.registerNodeType("ClaudeChat", createNClaudeChatNode);
}