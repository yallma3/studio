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

/**
 * Legacy unversioned workflow snapshot with runtime residue, full UI catalogs,
 * execution outputs, and old nodeValue properties.
 */
export const legacyWorkflowSnapshot = {
  graphId: "wf-legacy-999",
  graphName: "Legacy Pipeline",
  nextNodeId: 3,
  nodes: [
    {
      id: 1,
      nodeType: "Prompt",
      category: "Input",
      title: "Custom Prompt Title",
      description: "Static or dynamic user prompt",
      nodeValue: "Tell me a joke about programming", // old nodeValue
      x: 120,
      y: 200,
      width: 250,
      height: 180,
      selected: true, // transient state
      processing: false,
      result: { text: "Tell me a joke about programming" }, // transient state
      sockets: [
        { id: 101, title: "output", type: "output", nodeId: 1, dataType: "string" },
      ],
      configParameters: [
        {
          parameterName: "promptText",
          parameterType: "string",
          defaultValue: "Default prompt body",
          paramValue: "Tell me a joke about programming",
          valueSource: "UserInput",
          isNodeBodyContent: true,
          description: "Text of the prompt",
        },
      ],
    },
    {
      id: 2,
      nodeType: "LLM",
      category: "AI",
      title: "LLM Completion",
      description: "Executes an LLM prompt completion",
      nodeValue: "Why do programmers prefer dark mode? Because light attracts bugs.", // runtime execution residue
      x: 450,
      y: 200,
      width: 280,
      height: 200,
      selected: false,
      processing: true, // transient state
      result: {
        rawOutput: "Why do programmers prefer dark mode? Because light attracts bugs.",
        tokenCount: 42,
      }, // transient residue
      sockets: [
        { id: 201, title: "prompt", type: "input", nodeId: 2, dataType: "string" },
        { id: 202, title: "context", type: "input", nodeId: 2, dataType: "string" },
        { id: 203, title: "response", type: "output", nodeId: 2, dataType: "string" },
      ],
      configParameters: [
        {
          parameterName: "model",
          parameterType: "select",
          defaultValue: "llama3:latest",
          paramValue: "mistral:latest",
          valueSource: "UserInput",
          sourceList: ["llama3:latest", "mistral:latest", "qwen2.5:latest"],
          description: "Target LLM model",
        },
        {
          parameterName: "temperature",
          parameterType: "number",
          defaultValue: 0.7,
          paramValue: 0.2,
          valueSource: "UserInput",
          description: "Sampling temperature",
        },
        {
          parameterName: "systemPrompt",
          parameterType: "string",
          defaultValue: "You are a helpful assistant.",
          paramValue: "You are a witty comedian assistant.",
          valueSource: "UserInput",
          description: "System instructions",
        },
      ],
    },
  ],
  connections: [
    { fromSocket: 101, toSocket: 201 },
  ],
};
