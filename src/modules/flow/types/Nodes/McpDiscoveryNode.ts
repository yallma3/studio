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
import { McpHttpClient, McpStdioClient } from "../../../api/McpClient";

export interface McpDiscoveryNode extends BaseNode {
  nodeType: string;
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

export function createNMcpDiscoveryNode(
  id: number,
  type: { x: number; y: number }
): McpDiscoveryNode {
  return {
    id,
    title: "MCP Discovery",
    nodeValue: "",
    nodeType: "McpDiscovery",
    sockets: [
      {
        id: id * 100 + 1,
        title: "Input",
        type: "input",
        nodeId: id,
        dataType: "string",
      },
      {
        id: id * 100 + 2,
        title: "Tools",
        type: "output",
        nodeId: id,
        dataType: "string",
      },
      {
        id: id * 100 + 3,
        title: "Prompts",
        type: "output",
        nodeId: id,
        dataType: "string",
      },
      {
        id: id * 100 + 4,
        title: "Resources",
        type: "output",
        nodeId: id,
        dataType: "string",
      },
    ],
    x: type.x,
    y: type.y,
    width: 300,
    height: 250,
    selected: false,
    processing: false,
    process: async ({ node, getInputValue }) => {
      const n = node as McpDiscoveryNode;
      const inputValue = await getInputValue(n.id * 100 + 1);

      try {
        // Extract MCP server configuration from config parameters
        let url = "";
        let command = ""
        let args = ""
        let transportType = "Http"; // Default transport type
        
        if (n.getConfigParameter) {
          url = (n.getConfigParameter("MCP Server URL")?.paramValue as string) || "";
          command = (n.getConfigParameter("Command")?.paramValue as string) || "";
          args = (n.getConfigParameter("Args")?.paramValue as string) || "";
          transportType = (n.getConfigParameter("Transport Type")?.paramValue as string) || "Http";
        }

        if (!url && transportType == "Http") {
          throw new Error("MCP Server URL not configured");
        }

        console.log(`Executing MCP Discovery node ${n.id} with input: "${inputValue}"`);
        console.log(`Connecting to MCP server at: ${url} using ${transportType} transport`);

        let client = null
                

        if (transportType === "Stdio") {
          if(!command){
            throw "Command Required"
          }
          const argsArray = args ? args.split(" ") : [];
          console.log(argsArray)
          const serverConfig = {
            command: command,
            args: argsArray
          }
          console.log("Creating STDIO Client")
          client = new McpStdioClient(serverConfig)
          console.log("STDIO Client Created")

        } else if (transportType === "Http") {     
          client = new McpHttpClient(url)
        } else {
          throw new Error("Unsupported Transport Type:" + transportType)
        }



        if (client) {
          console.log("listing capabilities")
          let tools = await client.listTools()
          let prompts = await client.listPrompts()
          let resources = await client.listResources()



          tools = JSON.stringify(tools, null, 2);
          prompts = JSON.stringify(prompts, null, 2);
          resources = JSON.stringify(resources, null, 2);
  

          return {
            [n.id * 100 + 2]: tools,
            [n.id * 100 + 3]: prompts,
            [n.id * 100 + 4]: resources,
          };
        } else {
          return "Failed to create Discovery"
        }

        // Process the response
        
       

       
      } catch (error) {
        console.error("Error in MCP Discovery node:", error);
        // Return error in the response output
        return {
          [n.id * 100 + 2]: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }
    },
    configParameters: [
      {
        parameterName: "Transport Type",
        parameterType: "string",
        defaultValue: "Http",
        valueSource: "UserInput",
        UIConfigurable: true,
        sourceList: [
          { key: "http", label: "Http" },
          { key: "stdio", label: "Stdio" }
        ],
        description: "Transport mechanism to use for communication",
        isNodeBodyContent: false,
      },
      {
        parameterName: "MCP Server URL",
        parameterType: "string",
        defaultValue: "",
        valueSource: "UserInput",
        UIConfigurable: true,
        description: "URL of the MCP server to connect to",
        isNodeBodyContent: false,
      },
      {
        parameterName: "Authentication Token",
        parameterType: "string",
        defaultValue: "",
        valueSource: "UserInput",
        UIConfigurable: true,
        description: "Authentication token for the MCP server (if required)",
        isNodeBodyContent: false,
      },
      {
        parameterName: "Command",
        parameterType: "string",
        defaultValue: "",
        valueSource: "UserInput",
        UIConfigurable: true,
        description: "Command to run MCP server",
        isNodeBodyContent: false,
      },
      {
        parameterName: "Args",
        parameterType: "string",
        defaultValue: "",
        valueSource: "UserInput",
        UIConfigurable: true,
        description: "Command Args separated by ','",
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
  console.log("Registering MCP Discovery Node");
  nodeRegistry.registerNodeType("McpDiscovery", createNMcpDiscoveryNode);
}