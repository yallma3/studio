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
    NodeValue,
    NodeExecutionContext,
  } from "../NodeTypes";
  import { NodeRegistry } from "../NodeRegistry";
  
  export interface IfElseNode extends BaseNode {
    nodeType: string;
    process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
  }
  
  export function createIfElseNode(
    id: number,
    type: { x: number; y: number }
  ): IfElseNode {
    return {
      id,
      title: "If/Else",
      nodeType: "IfElse",
      nodeValue: null,
      sockets: [
        {
            id: id * 100 + 1,
            title: "Condition",
            type: "input",
            nodeId: id,
            dataType: "boolean", 
          },
          {
            id: id * 100 + 2,
            title: "True",
            type: "input",
            nodeId: id,
            dataType: "unknown",
          },
          {
            id: id * 100 + 3,
            title: "False",
            type: "input",
            nodeId: id,
            dataType: "unknown",
          },
          {
            id: id * 100 + 4,
            title: "Output",
            type: "output",
            nodeId: id,
            dataType: "unknown",
          },
      ],
      x: type.x,
      y: type.y,
      width: 300, // Wider to accommodate multiple inputs
      height: 240, // Taller to fit multi-line text
      selected: false,
      processing: false,
  
      process: async ({ node, getInputValue }) => {
        const n = node as IfElseNode;
  
        const condition = await getInputValue(n.id * 100 + 1);
        const trueValue = await getInputValue(n.id * 100 + 2);
        const falseValue = await getInputValue(n.id * 100 + 3);
  
        const strictParam = n.getConfigParameter?.("Strict Mode");
        const strictMode = strictParam?.paramValue ?? false;
  
        let result: any;
  
        if (strictMode) {
          // only accept exact booleans
          result = condition === true ? trueValue : falseValue;
        } else {
          // general truthiness
          const isTruthy = (val: any): boolean => {
            if (val === undefined || val === null) return false;
            if (typeof val === "boolean") return val;
            if (typeof val === "string") return val.length > 0;
            if (Array.isArray(val)) return val.length > 0;
            if (typeof val === "object") return Object.keys(val).length > 0;
            return Boolean(val);
          };
          result = isTruthy(condition) ? trueValue : falseValue;
        }
        n.nodeValue = result;
        return {
          [n.id * 100 + 4]: result,
        };
      },
  
      configParameters: [
        {
          parameterName: "Strict Mode",
          parameterType: "boolean",
          defaultValue: false,
          valueSource: "UserInput",
          UIConfigurable: true,
          description:
            "If enabled, only exact `true` or `false` boolean values will be accepted as condition.",
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
    category: string = "Logic"
  ): void {
    console.log(`Registering IfElse Node under category: ${category}`);
    nodeRegistry.registerNodeType("IfElse", createIfElseNode, category);
  }
  