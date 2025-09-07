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
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export interface McpClientNode extends BaseNode {
  nodeType: string;
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

export function createNMcpClientNode(
  id: number,
  type: { x: number; y: number }
): McpClientNode {
  return {
    id,
    title: "MCP Client",
    nodeValue: "",
    nodeType: "McpClient",
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
        title: "Output",
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
      const n = node as McpClientNode;
      const inputValue = await getInputValue(n.id * 100 + 1);

      try {
        // Extract MCP server configuration from config parameters
        let mcpServerUrl = "";
        let transportType = "sse"; // Default transport type
        
        if (n.getConfigParameter) {
          mcpServerUrl = (n.getConfigParameter("MCP Server URL")?.paramValue as string) || "";
          transportType = (n.getConfigParameter("Transport Type")?.paramValue as string) || "sse";
        }

        if (!mcpServerUrl) {
          throw new Error("MCP Server URL not configured");
        }

        console.log(`Executing MCP Client node ${n.id} with input: "${inputValue}"`);
        console.log(`Connecting to MCP server at: ${mcpServerUrl} using ${transportType} transport`);

        // Create MCP client based on transport type
        let client: Client;
        if (transportType === "stdio") {
          // For stdio transport, we would need to spawn a process
          // This is a simplified implementation
          throw new Error("Stdio transport not yet implemented");
        } else {
          // Default to SSE transport
          const transport = new SSEClientTransport(new URL(mcpServerUrl));
          client = new Client({
            name: "yaLLMa3 MCP Client",
            version: "1.0.0"
          });
          await client.connect(transport);
        }

        // Connect to the MCP server
        // Connection is already established in the constructor

        // Make a request to the MCP server using the appropriate method
        // For now, we'll use callTool as an example, but this should be configurable
        const result = await client.callTool({
          name: "sampling/createMessage",
          arguments: {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: inputValue || ""
                }
              }
            ]
          }
        });

        // Close the connection
        await client.close();

        // Process the response
        let formattedResponse = "";
        if (result && typeof result === "object" && "content" in result) {
          const content = result.content as Array<{ type: string; text?: string }>;
          formattedResponse = content
            .filter(item => item.type === "text" && item.text)
            .map(item => item.text)
            .join("\n");
        } else {
          formattedResponse = JSON.stringify(result, null, 2);
        }

        console.log(
          `MCP Client node ${n.id} received response:`,
          formattedResponse.substring(0, 100) + "..."
        );

        // Return an object with the output value
        return {
          [n.id * 100 + 2]: formattedResponse,
        };
      } catch (error) {
        console.error("Error in MCP Client node:", error);
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
        parameterName: "Transport Type",
        parameterType: "string",
        defaultValue: "sse",
        valueSource: "UserInput",
        UIConfigurable: true,
        sourceList: [
          { key: "sse", label: "SSE" },
          { key: "stdio", label: "Stdio" }
        ],
        description: "Transport mechanism to use for communication",
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
  console.log("Registering MCP Client Node");
  nodeRegistry.registerNodeType("McpClient", createNMcpClientNode);
}