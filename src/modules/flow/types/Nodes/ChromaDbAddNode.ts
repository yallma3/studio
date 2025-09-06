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

export interface ChromaDbAddNode extends BaseNode {
  nodeType: "ChromaDbAdd";
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

// Interface for ChromaDB API request
interface ChromaDbAddRequest {
  documents: string[];
  ids: string[];
  embeddings?: number[][];
}

export function register(nodeRegistry: NodeRegistry): void {
  function createChromaDbNode(id: number, type: Position): ChromaDbAddNode {
    return {
      id,
      title: "ChromaDB Add",
      nodeValue: "Ready",
      nodeType: "ChromaDbAdd",
      sockets: [
        {
        id: id * 100 + 1,
        title: "Title",
        type: "input",
        nodeId: id,
        dataType: "string",
      },
      {
        id: id * 100 + 2,
        title: "Chunks",
        type: "input",
        nodeId: id,
        dataType: "string",
      },
      {
        id: id * 100 + 3,
        title: "embeddings",
        type: "input",
        nodeId: id,
        dataType: "string",
      },
        {
          id: id * 100 + 4,
          title: "Result",
          type: "output",
          nodeId: id,
          dataType: "json",
        },
        {
          id: id * 100 + 5,
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
        const n = context.node as ChromaDbAddNode;
        
        try {
          // Get input data
          // Get input JSON
        const title = await context.getInputValue(n.id * 100 + 1);
        const chunks = await context.getInputValue(n.id * 100 + 2);
        const embeddings = await context.getInputValue(n.id * 100 + 3);

        let chunksObj = null;
        let embeddingsObj = null;

        if (typeof title !== 'string'){
           throw new Error(`Invalid Title`);
        }

        if(!chunks || !embeddings){
          throw new Error(`Chunks & Embeddings must be provided`);
        }

        
          try {
            chunksObj = typeof chunks === 'string' ? JSON.parse(chunks) : chunks;
           } catch (parseError) {
            throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
          }
        
        
          try {
            embeddingsObj = typeof embeddings === 'string' ? JSON.parse(embeddings) : embeddings;
          } catch (parseError) {
            throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
          }
        
      
       
        const ids = [];
        for (let i = 0; i < chunksObj.chunks.length; i++) {
          ids.push(`${title}_chunk_${i}`);
        }

        console.log("Chunks",chunksObj.chunks)
        console.log("EMBB", embeddingsObj.embeddings)
        console.log("Ids",ids)
       
          
        // Get configuration parameters
        const serverUrlParam = n.getConfigParameter?.("Server URL");
        const endpointParam = n.getConfigParameter?.("Endpoint");
        const collectionNameParam = n.getConfigParameter?.("Collection Name");
          
        const serverUrl = serverUrlParam?.paramValue as string || "http://localhost:8001";
        const endpoint = endpointParam?.paramValue as string || "/add";
        const collectionName = collectionNameParam?.paramValue as string || "default_collection";
          
          // Prepare request data
        const requestData: ChromaDbAddRequest = {
          documents: chunksObj.chunks,
          ids: ids,
          embeddings: embeddingsObj.embeddings || []
        };
          
        console.log(`Sending request to ChromaDB at ${serverUrl}${endpoint}`);
        console.log(`Request data: ${JSON.stringify(requestData)}`);
          
        // Update node status
        context.node.nodeValue = `Processing: ${requestData.documents.length} documents`;
          
        // Send request to ChromaDB
        const response = await fetch(`${serverUrl}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Disable CORS preflight by avoiding custom headers
            "Accept": "application/json",
          },
            // Use node-fetch or similar in backend to avoid CORS issues
            mode: "cors",
            body: JSON.stringify(requestData),
        });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ChromaDB request failed: ${response.status} ${response.statusText} - ${errorText}`);
          }
          
          const responseData = await response.json();
          
          // Update node status
          context.node.nodeValue = `Added ${requestData.documents.length} documents`;
          
          // Return the results
          return {
            // Socket id 2 is for Result output
            [n.id * 100 + 2]: responseData,
            // Socket id 3 is for Status
            [n.id * 100 + 3]: `Success: Added ${requestData.documents.length} documents to ChromaDB`,
          };
          
        } catch (error) {
          console.error("Error in ChromaDB node:", error);
          
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
          defaultValue: "http://localhost:8001",
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
          defaultValue: "/add",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "API endpoint for adding documents",
          isNodeBodyContent: false,
          i18n: {
            en: {
              "Endpoint": {
                Name: "Endpoint",
                Description: "API endpoint for adding documents",
              },
            },
            ar: {
              "Endpoint": {
                Name: "نقطة النهاية",
                Description: "نقطة نهاية API لإضافة المستندات",
              },
            },
          },
        },
        {
          parameterName: "Collection Name",
          parameterType: "string",
          defaultValue: "default_collection",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Name of the ChromaDB collection",
          isNodeBodyContent: false,
          i18n: {
            en: {
              "Collection Name": {
                Name: "Collection Name",
                Description: "Name of the ChromaDB collection",
              },
            },
            ar: {
              "Collection Name": {
                Name: "اسم المجموعة",
                Description: "اسم مجموعة ChromaDB",
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

  nodeRegistry.registerNodeType("ChromaDbAdd", createChromaDbNode);
}