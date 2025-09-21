/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
* Copyright (C) 2025 yaLLMa3
* Mozilla Public License v. 2.0
* https://www.mozilla.org/MPL/2.0/
*/

import {
    BaseNode,
    ConfigParameterType,
    NodeValue,
    NodeExecutionContext,
    Socket,
  } from "../NodeTypes";
  import { NodeRegistry } from "../NodeRegistry";
  
  export interface HttpCallNode extends BaseNode {
    nodeType: "HttpCall";
    nodeValue?: NodeValue;
    process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
  }
  
  export function createHttpCallNode(
    id: number,
    position: { x: number; y: number }
  ): HttpCallNode {
    return {
      id,
      title: "HTTP Call",
      nodeType: "HttpCall",
      nodeValue: "GET", // default display
      x: position.x,
      y: position.y,
      width: 300,
      height: 250,
      selected: false,
      processing: false,
      sockets: [
        {
          id: id * 100 + 5,
          title: "Response Body",
          type: "output",
          nodeId: id,
          dataType: "string",
        },
        {
          id: id * 100 + 6,
          title: "Response JSON",
          type: "output",
          nodeId: id,
          dataType: "json",
        },
        {
          id: id * 100 + 7,
          title: "Status Code",
          type: "output",
          nodeId: id,
          dataType: "number",
        },
        {
          id: id * 100 + 8,
          title: "Response Headers",
          type: "output",
          nodeId: id,
          dataType: "json",
        },
      ],
      process: async ({ node }) => {
        const n = node as HttpCallNode;
  
        try {
          // Read values from config
          const method =
            (n.getConfigParameter?.("Method")?.paramValue as string) || "GET";
          const url =
            (n.getConfigParameter?.("URL")?.paramValue as string) || "";
          const headersRaw = n.getConfigParameter?.("Headers")?.paramValue as string;
          const bodyRaw = n.getConfigParameter?.("Body")?.paramValue as string;
  
          // update node label dynamically
          n.nodeValue = method;
  
          if (!url) {
            throw new Error("URL is required");
          }
  
          // Validate URL
          try {
            new URL(url);
          } catch {
            throw new Error(`Invalid URL: ${url}`);
          }
  
          // Process headers
          let headers: Record<string, string> | undefined;
          if (headersRaw) {
            try {
              headers = JSON.parse(headersRaw);
            } catch {
              throw new Error("Invalid JSON format for headers");
            }
          }
  
          // Body
          let body: string | undefined = bodyRaw || undefined;
  
          console.log(`Making HTTP ${method} request to: ${url}`);
  
          const response = await fetch(url, {
            method,
            headers,
            body,
            mode: "cors",
          });
  
          // Get response headers
          const responseHeaders = Object.fromEntries(response.headers.entries());
  
          // Response body & JSON
          let responseBody = await response.text();
          let responseJson: any = null;
  
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json") && responseBody) {
            try {
              responseJson = JSON.parse(responseBody);
            } catch {
              responseJson = null;
            }
          }
  
          console.log(`HTTP request completed with status: ${response.status}`);
  
          return {
            [n.id * 100 + 5]: responseBody,
            [n.id * 100 + 6]: responseJson,
            [n.id * 100 + 7]: response.status,
            [n.id * 100 + 8]: responseHeaders,
          };
        } catch (error) {
          console.error("Error in HTTP Call node:", error);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
  
          return {
            [n.id * 100 + 5]: "",
            [n.id * 100 + 6]: null,
            [n.id * 100 + 7]: 0,
            [n.id * 100 + 8]: {},
          };
        }
      },
      configParameters: [
        {
          parameterName: "Method",
          parameterType: "string",
          defaultValue: "GET",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "HTTP method for the request",
          isNodeBodyContent: true,
          sourceList: [
            { key: "GET", label: "GET" },
            { key: "POST", label: "POST" },
            { key: "PUT", label: "PUT" },
            { key: "DELETE", label: "DELETE" },
          ],
        },
        {
          parameterName: "URL",
          parameterType: "string",
          defaultValue: "",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "URL for the HTTP request",
          isNodeBodyContent: true,
        },
        {
          parameterName: "Headers",
          parameterType: "text",
          defaultValue: "{}",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "HTTP headers as JSON object",
          isNodeBodyContent: false,
        },
        {
          parameterName: "Body",
          parameterType: "text",
          defaultValue: "",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Request body content",
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
  
  export function register(
    nodeRegistry: NodeRegistry,
    category: string = "Advanced"
  ): void {
    console.log(`Registering HTTP Call Node: ${category}`);
    nodeRegistry.registerNodeType("HttpCall", createHttpCallNode, category);
  }
  