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
  title: string;
  nodeType: string;
  nodeValue?: NodeValue;
  x: number;
  y: number;
  width: number;
  height: number;
  sockets: Socket[];
  selected?: boolean;
  processing?: boolean;
  result?: string | number | true | Record<string, unknown>;
  process?: (context: NodeExecutionContext) => Promise<NodeValue | string | string[] | undefined>;
  configParameters?: ConfigParameterType[]; // Configuration parameters for the node
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
  | AddNode

export type Connection = {
  fromSocket: number;
  toSocket: number;
  label?: string; // Optional label like "context", "trigger", etc.
};

export const createNumberNode = (
  id: number,
  type: { x: number; y: number }
): NumberNode => ({
  id,
  title: "Number",
  nodeValue: 0,
  nodeType: "Number",
  sockets: [
    {
      id: id * 100 + 2,
      title: "Output",
      type: "output",
      nodeId: id,
      dataType: "number",
    },
  ],
  x: type.x,
  y: type.y,
  width: 240,
  height: 180,
  selected: false,
  processing: false,
  process: async ({ node }) => {
    const n = node as NumberNode;
    return n.nodeValue;
  },
  configParameters: [
    {
      parameterName: "Number Output",
      parameterType: "number",
      defaultValue: 0,
      valueSource: "UserInput",
      UIConfigurable: true,
      description: "Constant number to output",
      isNodeBodyContent: true,
    },
  ],
  getConfigParameters: function () {
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
});

export const createBooleanNode = (
  id: number,
  type: { x: number; y: number }
): BooleanNode => ({
  id,
  title: "Boolean",
  nodeValue: false,
  nodeType: "Boolean",
  sockets: [
    {
      id: id * 100 + 1,
      title: "Output",
      type: "output",
      nodeId: id,
      dataType: "boolean",
    },
  ],
  x: type.x,
  y: type.y,
  width: 240,
  height: 180,
  selected: false,
  processing: false,
  process: async ({ node }) => {
    const n = node as BooleanNode;
    return n.nodeValue;
  },
  configParameters: [
    {
      parameterName: "Boolean Output",
      parameterType: "boolean",
      defaultValue: false,
      valueSource: "UserInput",
      UIConfigurable: true,
      description: "Constant boolean to output",
      isNodeBodyContent: true,
    },
  ],
  getConfigParameters: function () {
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
});

export const createImageNode = (
  id: number,
  type: { x: number; y: number }
): ImageNode => ({
  id,
  title: "Image",
  nodeValue: "", // URL or base64 string
  nodeType: "Image",
  sockets: [
    {
      id: id * 100 + 1,
      title: "Source",
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
  width: 280,
  height: 240, // Taller to display image preview
  selected: false,
  processing: false,
  process: async ({ node, getInputValue }) => {
    const n = node as ImageNode;
    // If there's an input source, use that, otherwise use the node's value
    const sourceValue = await getInputValue(n.id * 100 + 1);
    return sourceValue !== undefined ? sourceValue : n.nodeValue;
  },
  configParameters: [
    {
      parameterName: "Image Output",
      parameterType: "string",
      defaultValue: "",
      valueSource: "UserInput",
      UIConfigurable: true,
      description: "Initial image URL or base64 string to output",
      isNodeBodyContent: true,
    },
  ],
  getConfigParameters: function () {
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
});

// Add node for mathematical addition
export const createAddNode = (
  id: number,
  type: { x: number; y: number }
): AddNode => ({
  id,
  title: "Add",
  nodeValue: 0,
  nodeType: "Add",
  sockets: [
    {
      id: id * 100 + 1,
      title: "Input A",
      type: "input",
      nodeId: id,
      dataType: "number",
    },
    {
      id: id * 100 + 2,
      title: "Input B",
      type: "input",
      nodeId: id,
      dataType: "number",
    },
    {
      id: id * 100 + 3,
      title: "Result",
      type: "output",
      nodeId: id,
      dataType: "number",
    },
  ],
  x: type.x,
  y: type.y,
  width: 240,
  height: 180,
  selected: false,
  processing: false,
  process: async ({ node, getInputValue }) => {
    const n = node as AddNode;
    const a = Number((await getInputValue(n.id * 100 + 1)) || 0);
    const b = Number((await getInputValue(n.id * 100 + 2)) || 0);
    return a + b;
  },
  configParameters: [
    {
      parameterName: "Add Output",
      parameterType: "number",
      defaultValue: false,
      valueSource: "UserInput",
      UIConfigurable: true,
      description: "Default Number output",
      isNodeBodyContent: true,
    },
  ],
  getConfigParameters: function () {
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
});
