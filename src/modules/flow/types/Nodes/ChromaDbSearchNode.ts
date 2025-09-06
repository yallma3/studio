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
  Position,
  ConfigParameterType,
  NodeValue,
  NodeExecutionContext,
} from "../NodeTypes";
import { NodeRegistry } from "../NodeRegistry";

export interface ChromaDbSearchNode extends BaseNode {
  nodeType: "ChromaDbSearch";
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

// Interface for ChromaDB Search API request
interface ChromaDbSearchRequest {
  embeddings: number[];
  top_k: number;
}

export function register(nodeRegistry: NodeRegistry): void {
  function createChromaDbSearchNode(id: number, type: Position): ChromaDbSearchNode {
    return {
      id,
      title: "ChromaDB Search",
      nodeValue: "Ready",
      nodeType: "ChromaDbSearch",
      sockets: [
        {
          id: id * 100 + 1,
          title: "Query Embedding",
          type: "input",
          nodeId: id,
          dataType: "json",
        },
        {
          id: id * 100 + 2,
          title: "Search Results",
          type: "output",
          nodeId: id,
          dataType: "json",
        },
        {
          id: id * 100 + 3,
          title: "Status",
          type: "output",
          nodeId: id,
          dataType: "string",
        }
      ],
      x: type.x,
      y: type.y,
      width: 400,
      height: 320,
      selected: false,
      processing: false,
      process: async (context: NodeExecutionContext) => {
        const n = context.node as ChromaDbSearchNode;
        
        try {
          // Get input data
          const inputValue = await context.getInputValue(n.id * 100 + 1);
          if (!inputValue) {
            throw new Error("Query embedding is required");
          }
          
          // Parse input data
          let inputData;
          try {
            inputData = typeof inputValue === 'string' ? JSON.parse(inputValue) : inputValue;
          } catch (parseError) {
            throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
          }
          
        
          
          // Get configuration parameters
          const serverUrlParam = n.getConfigParameter?.("Server URL");
          const endpointParam = n.getConfigParameter?.("Endpoint");
          const topKParam = n.getConfigParameter?.("Top K");
          
          const serverUrl = serverUrlParam?.paramValue as string || "http://localhost:8000";
          const endpoint = endpointParam?.paramValue as string || "/search";
          const topK = topKParam?.paramValue ? parseInt(topKParam.paramValue as string) : 5;
          
          // Prepare request data
          const requestData: ChromaDbSearchRequest = {
            embeddings: inputData,
            top_k: topK
          };
          
          console.log(`Sending search request to ChromaDB at ${serverUrl}${endpoint}`);
          console.log(`Request data: ${JSON.stringify(requestData)}`);
          
          // Update node status
          context.node.nodeValue = `Searching...`;
          
          // Send request to ChromaDB
          const response = await fetch(`${serverUrl}${endpoint}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            mode: "cors",
            body: JSON.stringify(requestData),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ChromaDB search failed: ${response.status} ${response.statusText} - ${errorText}`);
          }
          
          const responseData = await response.json();
          
          // Update node status
          context.node.nodeValue = `Found ${responseData.ids?.length || 0} result(s)`;
          
          // Return the results
          return {
            // Socket id 2 is for Search Results output
            [n.id * 100 + 2]: responseData,
            // Socket id 3 is for Status
            [n.id * 100 + 3]: `Success: Found ${responseData.ids?.length || 0} matching documents`,
          };
          
        } catch (error) {
          console.error("Error in ChromaDB Search node:", error);
          
          // Update node status
          context.node.nodeValue = "Error occurred";
          
          // Return error in the outputs
          return {
            [n.id * 100 + 2]: { status: "error" },
            [n.id * 100 + 3]: `Error: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      },
      configParameters: [
        {
          parameterName: "Server URL",
          parameterType: "string",
          defaultValue: "http://localhost:8000",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "URL of the ChromaDB server",
          isNodeBodyContent: false,
          i18n: {
            en: {
              "Server URL": {
                Name: "Server URL",
                Description: "URL of the ChromaDB server",
              },
            },
            ar: {
              "Server URL": {
                Name: "عنوان الخادم",
                Description: "عنوان خادم ChromaDB",
              },
            },
          },
        },
        {
          parameterName: "Endpoint",
          parameterType: "string",
          defaultValue: "/search",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "API endpoint for searching documents",
          isNodeBodyContent: false,
          i18n: {
            en: {
              "Endpoint": {
                Name: "Endpoint",
                Description: "API endpoint for searching documents",
              },
            },
            ar: {
              "Endpoint": {
                Name: "نقطة النهاية",
                Description: "نقطة نهاية API للبحث عن المستندات",
              },
            },
          },
        },
        {
          parameterName: "Top K",
          parameterType: "number",
          defaultValue: "5",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Number of top results to return",
          isNodeBodyContent: false,
          i18n: {
            en: {
              "Top K": {
                Name: "Top K",
                Description: "Number of top results to return",
              },
            },
            ar: {
              "Top K": {
                Name: "أفضل K",
                Description: "عدد أفضل النتائج للعرض",
              },
            },
          },
        }
      ],

      getConfigParameters: function (): ConfigParameterType[] {
        return this.configParameters || [];
      },
      getConfigParameter(parameterName) {
        const parameter = (this.configParameters ?? []).find(
          (param) => param.parameterName === parameterName
        );
        return parameter;
      },
      setConfigParameter(parameterName, value) {
        const parameter = (this.configParameters ?? []).find(
          (param) => param.parameterName === parameterName
        );
        if (parameter) {
          parameter.paramValue = value;
        }
      },
    };
  }

  nodeRegistry.registerNodeType("ChromaDbSearch", createChromaDbSearchNode);
}