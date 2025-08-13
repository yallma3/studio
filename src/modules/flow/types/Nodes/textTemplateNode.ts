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
  TextNode,
  Position,
  ConfigParameterType,
  NodeValue,
  NodeExecutionContext,
} from "../NodeTypes";
import { NodeRegistry } from "../NodeRegistry";

// Template processing utility function - shared across multiple node types
const processTextTemplate = async (
  template: string,
  getInputValue: (socketId: number) => Promise<NodeValue | undefined>,
  nodeId: number
): Promise<string> => {
  // Handle {{input}} variable
  const inputRegex = /\{\{input\}\}/g;
  let result = template;

  if (inputRegex.test(template)) {
    // Get the input value from the first input socket
    const inputValue = await getInputValue(nodeId * 100 + 1);
    // Replace {{input}} with the actual input value, or empty string if undefined
    result = template.replace(
      inputRegex,
      inputValue !== undefined ? String(inputValue) : ""
    );
  }

  return result;
};

export function register(nodeRegistry: NodeRegistry): void {
  function createTextNode(id: number, type: Position): TextNode {
    return {
      id,
      title: "Text",
      nodeValue: "{{input}}",
      nodeType: "Text",
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
      width: 380,
      height: 220,
      selected: false,
      processing: false,
      process: async (context: NodeExecutionContext) => {
        // If the node value is a string and contains template variables, process them
        const n = context.node as TextNode;
        if (typeof n.nodeValue === "string") {
          return processTextTemplate(n.nodeValue, context.getInputValue, n.id);
        }
        return n.nodeValue;
      },
      configParameters: [
        {
          parameterName: "Text Input",
          parameterType: "text",
          defaultValue: "{{input}}",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Text template to interpolate with input",
          isNodeBodyContent: true,
          i18n: {
            en: {
              "Text Input": {
                Name: "Text Input",
                Description: "Text template to interpolate with input",
              },
            },
            ar: {
              "Text Input": {
                Name: "القالب النصي",
                Description: "قالب نصي يُدمج مع البيانات المُدخلة",
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

  nodeRegistry.registerNodeType("Text", createTextNode);
}
