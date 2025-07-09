/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { BaseNode, Position, ConfigParameterType } from "../NodeTypes";
import { NodeRegistry } from "../NodeRegistry";
export interface MathExpressionNode extends BaseNode {
  nodeType: "MathExpression";
}

export function register(nodeRegistry: NodeRegistry): void {
  function createMathExpressionNode(
    id: number,
    position: Position,
    nodeValue: number = 0
  ): BaseNode {
    return {
      id,
      title: "Math Expression",
      nodeValue: 0,
      nodeType: "MathExpression",
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
      x: position.x,
      y: position.y,
      width: 300,
      height: 220,
      selected: false,
      processing: false,
      process: async ({ node, getInputValue }: any): Promise<number> => {
        const a = Number((await getInputValue(node.id * 100 + 1)) || 0);
        const b = Number((await getInputValue(node.id * 100 + 2)) || 0);
        nodeValue = a + b;
        return nodeValue;
      },
      configParameters: [
        {
          parameterName: "Expression",
          parameterType: "number",
          defaultValue: false,
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Default Number output",
          isNodeBodyContent: true,
        },
      ],
      getConfigParameters: function (): ConfigParameterType[] {
        return this.configParameters || [];
      },
      getConfigParameter(
        parameterName: string
      ): ConfigParameterType | undefined {
        const parameter = (this.configParameters ?? []).find(
          (param) => param.parameterName === parameterName
        );
        return parameter;
      },
      setConfigParameter(parameterName: string, value: any): void {
        const parameter = (this.configParameters ?? []).find(
          (param) => param.parameterName === parameterName
        );
        if (parameter) {
          parameter.paramValue = value;
        }
      },
    };
  }
  nodeRegistry.registerNodeType("MathExpression", createMathExpressionNode);
}
