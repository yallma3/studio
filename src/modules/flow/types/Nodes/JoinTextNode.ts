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
  
  export interface JoinNode extends BaseNode {
    nodeType: "Join";
    nodeValue?: NodeValue;
    process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
  }

  export function register(nodeRegistry: NodeRegistry, category: string ="Text"): void {
    function createJoinNode(id: number, type: Position): JoinNode {
      return {
        id,
        title: "Join",
        nodeValue: " ",
        nodeType: "Join",
        sockets: [
            {
                id: id * 100 + 1,
                title: "Input 1",
                type: "input",
                nodeId: id,
                dataType: "unknown",
              },
              {
                id: id * 100 + 2,
                title: "Input 2",
                type: "input",
                nodeId: id,
                dataType: "unknown",
              },
              {
                id: id * 100 + 111,
                title: "Output",
                type: "output",
                nodeId: id,
                dataType: "string",
              },
        ],
        x: type.x,
        y: type.y,
        width: 240,
        height: 230, // Increased height to accommodate 50px socket spacing
        selected: false,
        processing: false,
        process: async (context: NodeExecutionContext) => {
            const n = context.node as JoinNode;
            // Process special separator values
            let separator = String(n.nodeValue || "");
        
            // Replace special separator placeholders
            separator = separator
              .replace(/\(new line\)/g, "\n") // Replace (new line) with actual newline
              .replace(/\\n/g, "\n"); // Also support \n for newlines
        
            // Count input sockets to determine how many inputs to process
            const inputSockets = n.sockets.filter((s) => s.type === "input");
        
            // Collect all input values
            const inputValues = await Promise.all(
              inputSockets.map(async (socket) => {
                const value = await context.getInputValue(socket.id);
                return value !== undefined ? String(value) : "";
              })
            );
        
            // Join all non-empty values with the separator
            return inputValues.filter((val) => val !== "").join(separator);
         
        },
        configParameters: [
          {
            parameterName: "Separator",
            parameterType: "text",
            defaultValue: " ",
            valueSource: "UserInput",
            UIConfigurable: true,
            description: "Separator to join the inputs",
            isNodeBodyContent: true,
            i18n: {
              en: {
                "Separator": {
                  Name: "Separator",
                  Description: "Separator to join the inputs",
                },
              },
              ar: {
                "Separator": {
                  Name: "الفاصلة",
                  Description: "فاصلة للدمج بين المدخلات",
                },
              },
            },
          },
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
    console.log(`Registering Join Node under category: ${category}`);
    nodeRegistry.registerNodeType("Join", createJoinNode, category);
  }
  