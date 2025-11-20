/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

export interface GraphState {
  id: string;
  name: string;
  path: string;
  lastModified: number;
}

export type Position = {
  x: number;
  y: number;
};

export type DataType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "html"
  | "embedding"
  | "url"
  | "unknown";

export type SocketDirection = "input" | "output";
// Define types for node, socket, and connection
export type Socket = {
  id: number;
  title: string;
  type: SocketDirection; // type of the socket on the node
  nodeId: number; // Reference to the parent node
  dataType?: DataType; // The type of data this socket accepts/provides
};

// Define possible value types for nodes
export type NodeValue =
  | string
  | number
  | boolean
  | string[]
  | Record<string, unknown>
  | null;

// Define a type for the context used in node processing
export type NodeExecutionContext = {
  node: NodeType;
  getInputValue: (socketId: number) => Promise<NodeValue | undefined>;
};

export type ConfigParameterType = {
  parameterName: string;
  parameterType: "string" | "text" | "number" | "boolean";
  defaultValue: string | number | boolean;
  UIConfigurable?: boolean; // Whether the parameter is configurable in the UI, needs to be True if ValueSource is UserInput
  sourceList?: Array<{ key: string; label: string }>; // Optional list of key-value pairs for dropdowns
  valueSource: "UserInput" | "Env" | "Default" | "RuntimeVault"; // Source of the value
  paramValue?: string | number | boolean; // The value of the parameter
  isNodeBodyContent?: boolean; // Whether to notify the node when the parameter changes
  description: string;
  i18n?: Record<string, Record<string, { Name: string; Description: string }>>;
};

export interface BaseNode {
  id: number;
  category: string;
  title: string;
  nodeType: string;
  description?: string;
  nodeValue?: NodeValue;
  x: number;
  y: number;
  width: number;
  height: number;
  sockets: Socket[];
  selected?: boolean;
  processing?: boolean;
  result?: NodeValue;
  process?: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
  configParameters?: ConfigParameterType[];
  i18n?: Record<string, {
    category?: string;
    title?: string;
    description?: string;
     nodeType?: string; 
  }>; 
  getConfigParameters?: () => Array<ConfigParameterType>;
  getConfigParameter?: (
    parameterName: string
  ) => ConfigParameterType | undefined;
  setConfigParameter?: (
    parameterName: string,
    value: string | number | boolean
  ) => void;
}

export interface NumberNode extends BaseNode {
  nodeType: "Number";
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

export interface BooleanNode extends BaseNode {
  nodeType: "Boolean";
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

export interface ImageNode extends BaseNode {
  nodeType: "Image";
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

export interface GenericNode extends BaseNode {
  nodeType: "Generic";
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

export interface AddNode extends BaseNode {
  nodeType: "Add";
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

// Define available node types
export type NodeType =
  | BaseNode
  | NumberNode
  | BooleanNode
  | ImageNode
  | GenericNode
  | AddNode;

export type Connection = {
  fromSocket: number;
  toSocket: number;
  label?: string; // Optional label like "context", "trigger", etc.
};

export function createNode(
  id: number,
  position: Position,
  node: BaseNode,
  duplicate: boolean = false
): BaseNode {
  const sockets: Socket[] = node.sockets.map((socket, idx) => ({
    ...socket,
    id: id * 100 + (idx + 1),
    nodeId: id,
  }));
  let configParam = null;
  if (!duplicate) {
    configParam = node.configParameters?.map((param) => ({
      ...param,
      paramValue: param.defaultValue,
    }));
  } else {
    configParam = node.configParameters?.map((param) => ({ ...param }));
  }

  return {
    id,
    category: node.category,
    title: node.title,
    nodeValue: node.nodeValue,
    nodeType: node.nodeType,
    sockets: sockets,
    x: position.x,
    y: position.y,
    width: node.width,
    height: node.height,
    selected: false,
    processing: false,
    i18n: node.i18n,

    configParameters: configParam as ConfigParameterType[] | undefined,
    getConfigParameters: function (): ConfigParameterType[] {
      return this.configParameters ?? [];
    },
    getConfigParameter(parameterName: string) {
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
        if (value !== undefined && typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
          throw new Error(`Invalid type for paramValue: ${typeof value}. Must be string, number, boolean, or undefined.`);
        }
        parameter.paramValue = value;
      }
    },
  };
}

export const getConfigParameters = (node: BaseNode): ConfigParameterType[] => {
  return node.configParameters || [];
};

export const getConfigParameter = (node: BaseNode, parameterName: string) => {
  const parameter = (node.configParameters ?? []).find(
    (param) => param.parameterName === parameterName
  );
  return parameter;
};

export const setConfigParameter = (
  node: BaseNode,
  parameterName: string,
  value: unknown
) => {
  const parameter = (node.configParameters ?? []).find(
    (param) => param.parameterName === parameterName
  );
  if (parameter) {
    // Only assign value if it matches the allowed types
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "undefined"
    ) {
      parameter.paramValue = value;
    } else {
      throw new Error(
        `Invalid type for paramValue: ${typeof value}. Must be string, number, boolean, or undefined.`
      );
    }
  }
};
