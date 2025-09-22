/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
* Copyright (C) 2025 yaLLMa3
* Licensed under MPL 2.0: https://www.mozilla.org/MPL/2.0/
*/

import {
    BaseNode,
    Position,
    ConfigParameterType,
    NodeValue,
    NodeExecutionContext,
  } from "../NodeTypes";
  import { NodeRegistry } from "../NodeRegistry";
  
  export interface UrlReferenceNode extends BaseNode {
    nodeType: "UrlReference";
    nodeValue?: NodeValue; // body content (shows the URL or marker text)
    url: string;
    useUrlInput?: boolean;
    process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
  }
  
  export function register(nodeRegistry: NodeRegistry, category: string = "Data"): void {
    function createUrlReferenceNode(id: number, type: Position): UrlReferenceNode {
      return {
        id,
        title: "URL Reference",
        nodeType: "UrlReference",
        url: "",
        useUrlInput: false,
        nodeValue: "(No URL)",
  
        sockets: [
          {
            id: id * 100 + 1,
            title: "URL",
            type: "input",
            nodeId: id,
            dataType: "string",
          },
          {
            id: id * 100 + 2,
            title: "URL Reference",
            type: "output",
            nodeId: id,
            dataType:"url",
          },
        ],
  
        x: type.x,
        y: type.y,
        width: 300,
        height: 200,
        selected: false,
        processing: false,
  
        process: async (context: NodeExecutionContext) => {
          const n = context.node as UrlReferenceNode;
  
          let finalUrl = n.url;
  
          if (n.useUrlInput) {
            const inputValue = await context.getInputValue(id * 100 + 1);
            if (inputValue !== undefined) {
              finalUrl = String(inputValue);
            }
          }
  
          // Update node body
          n.nodeValue = finalUrl || "(No URL)";
  
          // Return output object
          return {
            [id * 100 + 2]: { type: "url_reference", url: finalUrl },
          };
        },
  
        configParameters: [
          {
            parameterName: "URL",
            parameterType: "string",
            defaultValue: "",
            valueSource: "UserInput",
            UIConfigurable: true,
            description: "Directly set the URL if not using input",
            isNodeBodyContent: true,
          },
          {
            parameterName: "Use URL Input",
            parameterType: "boolean",
            defaultValue: false,
            valueSource: "UserInput",
            UIConfigurable: true,
            description: "If true, the URL will come from the input socket",
          },
        ],
  
        getConfigParameters: function (): ConfigParameterType[] {
          return this.configParameters || [];
        },
  
        getConfigParameter(parameterName: string) {
          return (this.configParameters ?? []).find(
            (param) => param.parameterName === parameterName
          );
        },
  
        setConfigParameter(parameterName: string, value: string | number | boolean) {
          if (parameterName === "URL") {
            this.url = value as string;
            this.nodeValue = value as string;
          }
          if (parameterName === "Use URL Input") {
            this.useUrlInput = Boolean(value);
            this.nodeValue = this.useUrlInput ? "(URL Using Input)" : this.url;
          }
          const parameter = (this.configParameters ?? []).find(
            (param) => param.parameterName === parameterName
          );
          if (parameter) {
            parameter.paramValue = value;
          }
        },
      };
    }
  
    console.log(`Registering URL Reference Node under category: ${category}`);
    nodeRegistry.registerNodeType("UrlReference", createUrlReferenceNode, category);
  }
  