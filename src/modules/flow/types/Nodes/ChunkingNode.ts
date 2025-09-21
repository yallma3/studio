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

export interface ChunkingNode extends BaseNode {
  nodeType: "Chunking";
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

// Simple tokenizer implementation for chunking
// This is a basic word-based tokenizer as a substitute for the transformer tokenizer
const simpleTokenize = (text: string): string[] => {
  // Split by whitespace and punctuation, filter out empty strings
  return text.split(/\s+|(?=[.,!?;:])|(?<=[.,!?;:])/).filter(token => token.trim().length > 0);
};

const simpleDetokenize = (tokens: string[]): string => {
  return tokens.join(' ').replace(/\s+([.,!?;:])/g, '$1');
};

// Token-based chunking utility function
const chunkByTokens = (
  text: string,
  maxTokens: number = 200,
  overlap: number = 50
): string[] => {
  const tokens = simpleTokenize(text);
  const chunks: string[] = [];
  
  for (let i = 0; i < tokens.length; i += maxTokens - overlap) {
    const chunk = tokens.slice(i, i + maxTokens);
    const decoded = simpleDetokenize(chunk);
    chunks.push(decoded);
    
    // If we've reached the end of tokens, break
    if (i + maxTokens >= tokens.length) {
      break;
    }
  }
  
  return chunks;
};

export function register(nodeRegistry: NodeRegistry,category: string = "Text"): void {
  function createChunkingNode(id: number, type: Position): ChunkingNode {
    return {
      id,
      title: "Text Chunking",
      nodeValue: "Chunks: 0",
      nodeType: "Chunking",
      sockets: [
        {
          id: id * 100 + 1,
          title: "Input Text",
          type: "input",
          nodeId: id,
          dataType: "string",
        },
        {
          id: id * 100 + 2,
          title: "Chunks",
          type: "output",
          nodeId: id,
          dataType: "json",
        },
      ],
      x: type.x,
      y: type.y,
      width: 380,
      height: 280,
      selected: false,
      processing: false,
      process: async (context: NodeExecutionContext) => {
        const n = context.node as ChunkingNode;
        
        // Get input text
        const inputValue = await context.getInputValue(n.id * 100 + 1);
        if (!inputValue || typeof inputValue !== "string") {
          return { chunks: [] };
        }
        
        // Get configuration parameters
        const maxTokensParam = n.getConfigParameter?.("Max Tokens");
        const overlapParam = n.getConfigParameter?.("Overlap");
        
        const maxTokens = maxTokensParam?.paramValue ? parseInt(maxTokensParam.paramValue as string) : 200;
        const overlap = overlapParam?.paramValue ? parseInt(overlapParam.paramValue as string) : 50;
        
        // Perform chunking
        const chunks = chunkByTokens(inputValue, maxTokens, overlap);
        
        // Update node value
        context.node.nodeValue = `Chunks: ${chunks.length}`;
        return { chunks };
      },
      configParameters: [
        {
          parameterName: "Max Tokens",
          parameterType: "number",
          defaultValue: "200",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Maximum number of tokens per chunk",
          isNodeBodyContent: false,
          i18n: {
            en: {
              "Max Tokens": {
                Name: "Max Tokens",
                Description: "Maximum number of tokens per chunk",
              },
            },
            ar: {
              "Max Tokens": {
                Name: "الحد الأقصى للرموز",
                Description: "الحد الأقصى لعدد الرموز في كل جزء",
              },
            },
          },
        },
        {
          parameterName: "Overlap",
          parameterType: "number",
          defaultValue: "50",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Number of overlapping tokens between chunks",
          isNodeBodyContent: false,
          i18n: {
            en: {
              "Overlap": {
                Name: "Overlap",
                Description: "Number of overlapping tokens between chunks",
              },
            },
            ar: {
              "Overlap": {
                Name: "التداخل",
                Description: "عدد الرموز المتداخلة بين الأجزاء",
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
  console.log(`Registering Chunking Node under category: ${category}`);
  nodeRegistry.registerNodeType("Chunking", createChunkingNode,category);
}