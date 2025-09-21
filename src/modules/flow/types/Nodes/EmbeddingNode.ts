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

export interface EmbeddingNode extends BaseNode {
  nodeType: string;
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

export function createEmbeddingNode(
  id: number,
  type: { x: number; y: number }
): EmbeddingNode {
  return {
    id,
    title: "Embedding",
    nodeValue: "gemini-embedding-001",
    nodeType: "Embedding",
    sockets: [
      {
        id: id * 100 + 1,
        title: "Input JSON",
        type: "input",
        nodeId: id,
        dataType: "string",
      },
      {
        id: id * 100 + 2,
        title: "Embeddings",
        type: "output",
        nodeId: id,
        dataType: "string",
      },
      {
        id: id * 100 + 3,
        title: "Status",
        type: "output",
        nodeId: id,
        dataType: "string",
      },
    ],
    x: type.x,
    y: type.y,
    width: 300,
    height: 200,
    selected: false,
    processing: false,
    process: async ({ node, getInputValue }) => {
      const n = node as EmbeddingNode;

      try {
        // Get input value
        const inputValue = await getInputValue(n.id * 100 + 1);
        console.log("INPUT:", inputValue);

        // Handle both string and JSON inputs
        let chunks: string[] = [];
        let isSingleString = false;

        if (!inputValue) {
          throw new Error("Input is required");
        }

        const inputString =
          typeof inputValue === "string"
            ? inputValue
            : JSON.stringify(inputValue);

        // Try to parse as JSON first
        try {
          // Check if it's a direct string input (not JSON)
          if (
            typeof inputValue === "string" &&
            (!inputValue.trim().startsWith("{") ||
              !inputValue.trim().endsWith("}"))
          ) {
            // Handle as a single string input
            chunks = [inputValue.trim()];
            isSingleString = true;
            console.log("Processing single string input");
          } else {
            // Parse as JSON
            const inputData = JSON.parse(inputString);

            // Check if it has chunks array
            if (inputData.chunks && Array.isArray(inputData.chunks)) {
              chunks = inputData.chunks;
              console.log(`Processing JSON input with ${chunks.length} chunks`);
            } else {
              // If JSON doesn't have chunks array, treat the whole JSON as a single string
              chunks = [inputString];
              isSingleString = true;
              console.log("Processing JSON input as a single string");
            }
          }
        } catch (parseError) {
          // If JSON parsing fails, treat as a single string
          chunks = [inputString];
          isSingleString = true;
          console.log("Processing as single string due to JSON parse error");
        }

        if (chunks.length === 0) {
          throw new Error("No text content to embed");
        }

        console.log(
          `Executing Embedding node ${n.id} with ${chunks.length} chunks`
        );

        // Get API key from config
        let API_KEY = "";
        if (n.getConfigParameter) {
          API_KEY =
            (n.getConfigParameter("Google API Key")?.paramValue as string) ||
            "";
        }

        if (!API_KEY) {
          throw new Error(
            "Google API Key not found. Please configure the Google API Key in node settings."
          );
        }

        // Get model from node value or config
        const model = n.getConfigParameter
          ? (n.getConfigParameter("Model")?.paramValue as string) ||
            n.nodeValue?.toString() ||
            "gemini-embedding-001"
          : n.nodeValue?.toString() || "gemini-embedding-001";

        console.log(
          `Making API request to Google Gemini embeddings with model: ${model}`
        );

        // Use Google's batch embedding API for efficiency
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${API_KEY}`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: chunks.map((text: string) => ({
              model: `models/${model}`,
              content: { parts: [{ text }] },
            })),
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Batch embedding failed: ${errorText}`);
        }

        const data = await response.json();

        // Map the results back
        const embeddings = data.embeddings.map(
          (embedding: { values: number[] }) =>
            embedding.values // Google returns embedding vectors in .values
        );

        console.log(
          `Embedding node ${n.id} processed ${embeddings.length} chunks in batch`
        );

        // Return the results - for single string input, return just the embedding vector
        return {
          // Socket id 2 is for Embeddings output
          [n.id * 100 + 2]:
            isSingleString && embeddings.length === 1
              ? JSON.stringify(embeddings[0], null, 2)
              : JSON.stringify({ embeddings }, null, 2),
          // Socket id 3 is for Status
          [n.id * 100 + 3]: `Success: Generated embeddings for ${
            chunks.length
          } ${isSingleString ? "text input" : "chunks"} using Google Gemini`,
        };
      } catch (error) {
        console.error("Error in Embedding node:", error);

        // Return error in the outputs
        return {
          [n.id * 100 + 2]: "",
          [n.id * 100 + 3]: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }
    },
    configParameters: [
      {
        parameterName: "Model",
        parameterType: "string",
        defaultValue: "models/gemini-embedding-001",
        valueSource: "UserInput",
        UIConfigurable: true,
        description: "Google Gemini embedding model to use",
        isNodeBodyContent: true,
        sourceList: [
          {
            key: "models/gemini-embedding-001",
            label: "Gemini Embedding 001",
          },
        ],
      },
      {
        parameterName: "Google API Key",
        parameterType: "string",
        defaultValue: "",
        valueSource: "UserInput",
        UIConfigurable: true,
        description: "Google API Key for Gemini embedding service",
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

export function register(nodeRegistry: NodeRegistry, category: string = "Input/Output"): void {
  console.log(`Registering Embedding Node: ${category}`);
  nodeRegistry.registerNodeType("Embedding", createEmbeddingNode, category);
}
