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
// import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
// import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

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
        let url = "";
        let transportType = "http"; // Default transport type
        
        if (n.getConfigParameter) {
          url = (n.getConfigParameter("MCP Server URL")?.paramValue as string) || "";
          transportType = (n.getConfigParameter("Transport Type")?.paramValue as string) || "sse";
        }

        if (!url) {
          throw new Error("MCP Server URL not configured");
        }

        console.log(`Executing MCP Client node ${n.id} with input: "${inputValue}"`);
        console.log(`Connecting to MCP server at: ${url} using ${transportType} transport`);

        const mcpServerUrl = new URL(url);

        // Create MCP client based on transport type
        let client: Client|undefined = undefined


        if (transportType === "Stdio") {
          // For stdio transport, we would need to spawn a process
          // Browser Limitation: Browsers can't execute system commands or spawn processes


          // const transport = new StdioClientTransport({
          //   command: "npx",
          //   args: [
          //         "-y",
          //         "@modelcontextprotocol/server-puppeteer"
          //       ]
          // });

          // client = new Client(
          //   {
          //     name: "example-client",
          //     version: "1.0.0"
          //   }
          // );
          
          // await client.connect(transport);

          throw new Error("Stdio transport not yet implemented");

        } else if (transportType === "StreamableHttp") {     
          
          // Browser Limitation Browsers do not allow full duplex streaming POST connections (they buffer, enforce CORS, etc).
          // That breaks StreamableHttp, because the handshake relies on keeping a stream open.
          
            // client = new Client({
            //   name: "streamable-http-client",
            //   version: "1.0.0",
            // });

            // // Pass string or URL directly — don’t double wrap
            // const transport = new StreamableHTTPClientTransport(mcpServerUrl);

            // console.log("Connecting...");
            
            // await client.connect(transport);

            // console.log("✅ Connected using Streamable HTTP transport");

            throw new Error("StreambaleHttp transport not yet implemented");

          
        } else if( transportType == "SSE" || transportType == "sse") {

          client = new Client({
            name: "streamable-http-client",
            version: "1.0.0",
          });

          const transport = new SSEClientTransport(mcpServerUrl)

          console.log("Connecting...");
          
          await client.connect(transport);

          console.log("✅ Connected using Streamable SSE transport");
         
        } else {

          throw new Error("Unsupported Transport Type:" + transportType)
        }



        if (client) {
          console.log("listing capabilities")
          const tools = await client.listTools()

          console.log("Tools:", tools);

          const formattedResponse = JSON.stringify(tools, null, 2);

          

          console.log(
            `MCP Client node ${n.id} received response:`,
            formattedResponse
          );
  
          // Return an object with the output value
         
        // Close the connection
          await client.close();

          return {
            [n.id * 100 + 2]: formattedResponse,
          };
        } else {
          return "Failed to create Client"
        }

        // Process the response
        
       

       
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
          { key: "http", label: "StreamableHttp" },
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