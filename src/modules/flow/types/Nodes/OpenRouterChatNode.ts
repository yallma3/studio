/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 *
 * Copyright (C) 2025 yaLLMa3
 * Licensed under MPL 2.0
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

export function createNOpenRouterChatNode(
  id: number,
  type: { x: number; y: number }
): ChatNode {
  return {
    id,
    title: "OpenRouter Chat",
    nodeValue: "qwen/qwen2-7b-instruct:free",
    nodeType: "OpenRouterChat",
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
      const system = String(systemPrompt || "");

      // Extract model name from node value
      const model =
        n.nodeValue?.toString().trim() || "qwen/qwen2-7b-instruct:free";
      console.log("n.nodeValue", n.nodeValue);
      console.log(`Using model: ${model}`);

      let OPENROUTER_API_KEY = "";
      if (n.getConfigParameter) {
        OPENROUTER_API_KEY =
          (n.getConfigParameter("API Key")?.paramValue as string) || "";
      } else {
        throw new Error("API Key not found");
      }

      console.log(
        "OPENROUTER_API_KEY",
        OPENROUTER_API_KEY ? "[set]" : "[missing]"
      );
      console.log(
        `Executing OpenRouter Chat node ${
          n.id
        } with prompt: "${prompt.substring(0, 50)}..."`
      );

      try {
        const messages = system
          ? [
              { role: "system", content: system },
              { role: "user", content: prompt },
            ]
          : [{ role: "user", content: prompt }];

        const res = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              messages,
              max_tokens: 1000,
              temperature: 0.7,
              top_p: 1,
            }),
          }
        );

        if (!res.ok) {
          throw new Error(`OpenRouter API returned status ${res.status}`);
        }

        const json = await res.json();
        const content = json?.choices?.[0]?.message?.content || "";

        console.log(
          `Chat node ${n.id} received response:`,
          content.substring(0, 50) + "..."
        );

        return {
          [n.id * 100 + 3]: content,
          [n.id * 100 + 4]: json.usage?.total_tokens || 0,
        };
      } catch (error) {
        console.error("Error in OpenRouter Chat node:", error);
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
        defaultValue: "qwen/qwen2-7b-instruct:free",
        valueSource: "UserInput",
        UIConfigurable: true,
        description: "Model name to use for the OpenRouter chat node",
        isNodeBodyContent: true,
        sourceList: [
          {
            key: "qwen/qwen2-7b-instruct:free",
            label: "Qwen2 7B Instruct (Free)",
          },
          {
            key: "mistral/mistral-7b-instruct",
            label: "Mistral 7B Instruct",
          },
          {
            key: "meta-llama/llama-3-8b-instruct",
            label: "Llama 3 8B Instruct",
          },
          {
            key: "anthropic/claude-3-haiku",
            label: "Claude 3 Haiku",
          },
        ],
      },
      {
        parameterName: "API Key",
        parameterType: "string",
        defaultValue: "",
        valueSource: "UserInput",
        UIConfigurable: true,
        description: "API Key for OpenRouter",
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

export function register(nodeRegistry: NodeRegistry, category: string = "AI"): void {
  console.log(`Registering OpenRouter Chat Node under category: ${category}`);
  nodeRegistry.registerNodeType("OpenRouterChat", createNOpenRouterChatNode, category);
}