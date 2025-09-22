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
*/

import {
    BaseNode,
    ConfigParameterType,
    NodeExecutionContext,
    NodeValue,
  } from "../NodeTypes";
  import { NodeRegistry } from "../NodeRegistry";
  
  export interface DelayNode extends BaseNode {
    nodeType: string;
    process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
  }
  
  export function createDelayNode(
    id: number,
    type: { x: number; y: number }
  ): DelayNode {
    return {
      id,
      title: "Delay",
      nodeType: "Delay",
      sockets: [
        {
          id: id * 100 + 1,
          title: "Input",
          type: "input",
          nodeId: id,
          dataType: "unknown", // ✅ replaced "any" with "unknown"
        },
        {
          id: id * 100 + 2,
          title: "Output",
          type: "output",
          nodeId: id,
          dataType: "unknown", // ✅ replaced "any" with "unknown"
        },
      ],
      x: type.x,
      y: type.y,
      width: 240,
      height: 180,
      selected: false,
      processing: false,
      nodeValue: "1000 ms",
      // Process logic: wait N ms, then pass input to output
      process: async ({ node, getInputValue }) => {
        const n = node as DelayNode;
  
        const inputValue = await getInputValue(n.id * 100 + 1);
  
       // Resolve delay from config; fall back to default (1000ms); clamp to >= 0
        const delayParam = n.getConfigParameter?.("Delay (ms)");
        const raw = delayParam?.paramValue ?? delayParam?.defaultValue ?? 1000;
        const delayMs = Number.isFinite(Number(raw)) ? Math.max(0, Number(raw)) : 1000;
        n.nodeValue = `${delayMs} ms`;

        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
  
        return {
          [n.id * 100 + 2]: inputValue,
        };
      },
  
      configParameters: [
        {
          parameterName: "Delay (ms)",
          parameterType: "number",
          defaultValue: 1000,
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "How long to wait before passing the value through (in ms).",
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
          if (parameterName === "Delay (ms)") {
            this.nodeValue = `${value} ms`;
          }
        }
      },
    };
  }
  
  export function register(
    nodeRegistry: NodeRegistry,
    category: string = "Logic"
  ): void {
    console.log(`Registering Delay Node under category: ${category}`);
    nodeRegistry.registerNodeType("Delay", createDelayNode, category);
  }
  