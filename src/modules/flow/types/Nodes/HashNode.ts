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
  import * as crypto from "crypto-js";
  
  export type HashAlgorithm = "MD5" | "SHA1" | "SHA256" | "SHA512";
  
  export interface HashNode extends BaseNode {
    nodeType: "Hash";
    nodeValue?: NodeValue; // holds current algorithm or hash
    algorithm: HashAlgorithm;
    process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
  }
  
  export function register(nodeRegistry: NodeRegistry, category: string = "Data"): void {
    function createHashNode(id: number, type: Position): HashNode {
      return {
        id,
        title: "Hash",
        nodeType: "Hash",
        algorithm: "SHA256", // default algorithm
        nodeValue: "SHA256", // visible in body
  
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
            title: "Hash",
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
          const n = context.node as HashNode;
  
          const inputValue = await context.getInputValue(n.id * 100 + 1);
          const inputText = inputValue !== undefined ? String(inputValue) : "";
  
          // get selected algorithm (default SHA256)
          const algo =
            (n.getConfigParameter?.("Algorithm")?.paramValue as HashAlgorithm) ||
            n.algorithm ||
            "SHA256";
  
          let hash: string;
          switch (algo) {
            case "MD5":
              hash = crypto.MD5(inputText).toString();
              break;
            case "SHA1":
              hash = crypto.SHA1(inputText).toString();
              break;
            case "SHA512":
              hash = crypto.SHA512(inputText).toString();
              break;
            case "SHA256":
            default:
              hash = crypto.SHA256(inputText).toString();
          }
  
  
          return { [n.id * 100 + 2]: hash };
        },
  
        configParameters: [
          {
            parameterName: "Algorithm",
            parameterType: "string",
            defaultValue: "SHA256",
            valueSource: "UserInput",
            UIConfigurable: true,
            description: "Hashing algorithm to use (MD5, SHA1, SHA256, SHA512)",
            isNodeBodyContent: true,
            sourceList: [
              { key: "MD5", label: "MD5" },
              { key: "SHA1", label: "SHA1" },
              { key: "SHA256", label: "SHA256" },
              { key: "SHA512", label: "SHA512" },
            ],
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
  
        setConfigParameter(parameterName: string, value: string | number | boolean): void {
            if (parameterName === "Algorithm") {
              this.algorithm = value as HashAlgorithm;
              this.nodeValue = String(value); // ensure it's stored as string
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
  
    console.log(`Registering Hash Node under category: ${category}`);
    nodeRegistry.registerNodeType("Hash", createHashNode, category);
  }
  