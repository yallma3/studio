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
  
  export function createNOpenAIChatNode(
    id: number,
    type: { x: number; y: number }
  ): ChatNode {
    return {
      id,
      title: "Chat",
      nodeValue: "gpt-4o-mini",  // Default model
      nodeType: "OpenAIChat",
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
      width: 300,
      height: 240,
      selected: false,
      processing: false,
      process: async ({ node, getInputValue }) => {
        const n = node as ChatNode;
        const promptValue = await getInputValue(n.id * 100 + 1);
        const systemPrompt = await getInputValue(n.id * 100 + 2);
  
        const prompt = String(promptValue || "");
        
        // Sanitize the model value
        const rawModel = n.nodeValue?.toString() || "";
        const modelMatch = rawModel.trim().toLowerCase().replace(/\s+/g, "-");
        const model = modelMatch ? modelMatch : "gpt-4o-mini"; // Fallback to default
  
        const system = String(systemPrompt || "");
  
        try {
          let OPENAI_API_KEY = "";
          if (n.getConfigParameter) {
            OPENAI_API_KEY =
              (n.getConfigParameter("API Key")?.paramValue as string) || "";
          } else {
            throw new Error("API Key not found");
          }
  
          console.log("OPENAI_API_KEY", OPENAI_API_KEY ? "[set]" : "[missing]");
          console.log(`Using model: ${model}`);
          console.log(
            `Executing OpenAI Chat node ${n.id} with prompt: "${prompt.substring(
              0,
              50
            )}..."`
          );
  
          const messages = system
            ? [
                { role: "system", content: system },
                { role: "user", content: prompt },
              ]
            : [{ role: "user", content: prompt }];
  
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              messages,
              max_tokens: 1000,
              temperature: 0.7,
              top_p: 1,
              frequency_penalty: 0,
              presence_penalty: 0,
            }),
          });
  
          if (!res.ok) {
            throw new Error(`OpenAI API returned status ${res.status}`);
          }
  
          const json = await res.json();
          console.log(
            `Chat node ${n.id} received response:`,
            json.choices[0].message.content.substring(0, 50) + "..."
          );
  
          return {
            [n.id * 100 + 3]: json.choices[0].message.content,
            [n.id * 100 + 4]: json.usage?.total_tokens || 0,
          };
        } catch (error) {
          console.error("Error in OpenAI Chat node:", error);
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
          defaultValue: "gpt-4o-mini",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Model name to use for the chat node",
          isNodeBodyContent: true,
          sourceList: [
            { key: "gpt-5", label: "GPT-5" },
            { key: "gpt-5-mini", label: "GPT-5 Mini" },
            { key: "gpt-5-nano", label: "GPT-5 Nano" },
            { key: "o4-mini", label: "o4 Mini" },
            { key: "o3", label: "o3" },
            { key: "o3-mini", label: "o3 Mini" },
            { key: "gpt-4.1", label: "GPT-4.1" },
            { key: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
            { key: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
            { key: "gpt-4o", label: "GPT-4o" },
            { key: "gpt-4o-mini", label: "GPT-4o Mini" },
            { key: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
          ],
        },
        {
          parameterName: "API Key",
          parameterType: "string",
          defaultValue: "",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "API Key for the OpenAI service",
          isNodeBodyContent: false,
        },
      ],
      getConfigParameters: function (): ConfigParameterType[] {
        return this.configParameters || [];
      },
      getConfigParameter(parameterName: string): ConfigParameterType | undefined {
        return (this.configParameters ?? []).find(
          (param) => param.parameterName === parameterName
        );
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
  
  export function register(nodeRegistry: NodeRegistry, category: string = "AI"): void {
    console.log(`Registering OpenAI Chat Node under category: ${category}`);
    nodeRegistry.registerNodeType("OpenAIChat", createNOpenAIChatNode, category);
  }