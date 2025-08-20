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

export function createNGroqChatNode(
  id: number,
  type: { x: number; y: number }
): ChatNode {
  return {
    id,
    title: "Chat",
    nodeValue: "llama 3.1 8b instant",
    nodeType: "GroqChat",
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

      const model = modelMatch ? modelMatch : "llama-3.1-8b-instant"; // Default fallback

      // Use system prompt from input, but don't use the node.value (which now contains the model)
      const system = String(systemPrompt || "");

      try {
        // Get API key from .env using Vite's environment variable format
        // const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

        // if (!GROQ_API_KEY) {
        //   throw new Error(
        //     "GROQ API key not found. Please check your .env file and ensure it has VITE_GROQ_API_KEY defined."
        //   );
        // }
        let GROQ_API_KEY = "";
        if(n.getConfigParameter){
          GROQ_API_KEY = n.getConfigParameter("API Key")?.paramValue as string || "";
        }
        else{
          throw new Error("API Key not found");
        }

        console.log("GROQ_API_KEY", GROQ_API_KEY);
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
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${GROQ_API_KEY}`,
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
          json.choices[0].message.content.substring(0, 50) + "..."
        );

        // Return an object with both values to support multiple outputs
        return {
          // Socket id 3 is for Response content
          [n.id * 100 + 3]: json.choices[0].message.content,
          // Socket id 4 is for Token count
          [n.id * 100 + 4]: json.usage?.total_tokens || 0,
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
        defaultValue: "llama-3.1-8b-instant",
        valueSource: "UserInput",
        UIConfigurable: true,
        description: "Model name to use for the chat node",
        isNodeBodyContent: true,
        sourceList: [
          {
            key: "llama-3.1-8b-instant",
            label: "Llama 3.1 8b Instant",
          },
          {
            key: "llama-3.1-8b-instruct",
            label: "Llama 3.1 8b Instruct",
          },
          {
            key: "llama-3.1-8b-chat",
            label: "Llama 3.1 8b Chat",
          },
          {
            key: "llama-3.1-13b-instant",
            label: "Llama 3.1 13b Instant",
          },
          {
            key: "llama-3.1-13b-instruct",
            label: "Llama 3.1 13b Instruct",
          },
          {
            key: "llama-3.1-13b-chat",
            label: "Llama 3.1 13b Chat",
          },
        ],
      },
      {
        parameterName: "API Key",
        parameterType: "string",
        defaultValue: "",
        valueSource: "UserInput",
        UIConfigurable: true,
        description: "API Key for the Groq service",
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
  console.log("Registering Groq Chat Node");
  nodeRegistry.registerNodeType("GroqChat", createNGroqChatNode);
}
