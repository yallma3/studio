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

import { BaseNode } from "@/modules/flow/types/NodeTypes";

export const sampleRegistryNodes: Record<string, BaseNode> = {
  LLM: {
    id: 0,
    nodeType: "LLM",
    category: "AI",
    title: "LLM Completion",
    description: "Executes an LLM prompt completion",
    x: 0,
    y: 0,
    width: 260,
    height: 180,
    sockets: [
      { id: 1, title: "prompt", type: "input", nodeId: 0, dataType: "string" },
      { id: 2, title: "context", type: "input", nodeId: 0, dataType: "string" },
      { id: 3, title: "response", type: "output", nodeId: 0, dataType: "string" },
    ],
    configParameters: [
      {
        parameterName: "model",
        parameterType: "string",
        defaultValue: "llama3:latest",
        valueSource: "UserInput",
        sourceList: [
          { key: "llama3:latest", label: "Llama 3 Latest" },
          { key: "mistral:latest", label: "Mistral Latest" },
          { key: "qwen2.5:latest", label: "Qwen 2.5 Latest" },
        ],
        description: "Target LLM model",
      },
      {
        parameterName: "temperature",
        parameterType: "number",
        defaultValue: 0.7,
        valueSource: "UserInput",
        description: "Sampling temperature",
      },
      {
        parameterName: "systemPrompt",
        parameterType: "string",
        defaultValue: "You are a helpful assistant.",
        valueSource: "UserInput",
        description: "System instructions",
      },
    ],
    selected: false,
    processing: false,
  },
  Prompt: {
    id: 0,
    nodeType: "Prompt",
    category: "Input",
    title: "Prompt Input",
    description: "Static or dynamic user prompt",
    x: 0,
    y: 0,
    width: 240,
    height: 160,
    sockets: [
      { id: 1, title: "output", type: "output", nodeId: 0, dataType: "string" },
    ],
    configParameters: [
      {
        parameterName: "promptText",
        parameterType: "string",
        defaultValue: "Default prompt body",
        valueSource: "UserInput",
        isNodeBodyContent: true,
        description: "Text of the prompt",
      },
    ],
    selected: false,
    processing: false,
  },
  Delay: {
    id: 0,
    nodeType: "Delay",
    category: "Control",
    title: "Delay",
    description: "Pauses execution for a duration",
    x: 0,
    y: 0,
    width: 200,
    height: 120,
    sockets: [
      { id: 1, title: "in", type: "input", nodeId: 0, dataType: "unknown" },
      { id: 2, title: "out", type: "output", nodeId: 0, dataType: "unknown" },
    ],
    configParameters: [
      {
        parameterName: "delayMs",
        parameterType: "number",
        defaultValue: 1000,
        valueSource: "UserInput",
        description: "Delay in milliseconds",
      },
    ],
    selected: false,
    processing: false,
  },
  JoinText: {
    id: 0,
    nodeType: "JoinText",
    category: "Transform",
    title: "Join Text",
    description: "Joins text from multiple inputs",
    x: 0,
    y: 0,
    width: 220,
    height: 160,
    sockets: [
      { id: 1, title: "input 1", type: "input", nodeId: 0, dataType: "string" },
      { id: 2, title: "output", type: "output", nodeId: 0, dataType: "string" },
    ],
    configParameters: [
      {
        parameterName: "inputCount",
        parameterType: "number",
        defaultValue: 1,
        valueSource: "UserInput",
        description: "Number of input sockets",
      },
    ],
    selected: false,
    processing: false,
  },
};
