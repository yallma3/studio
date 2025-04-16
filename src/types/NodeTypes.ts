export interface GraphState {
  id: string;
  name: string;
  path: string;
  lastModified: number;
}

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
    type: SocketDirection;  // type of the socket on the node
    nodeId: number;  // Reference to the parent node
    dataType?: DataType; // The type of data this socket accepts/provides
};

// Define possible value types for nodes
export type NodeValue = string | number | boolean | Record<string, unknown> | null;



export interface BaseNode {
  id: number;
  title: string;
  nodeType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sockets: Socket[];
  selected?: boolean;
  processing?: boolean;
}

export interface TextNode extends BaseNode {
  nodeType: "Text";
  value?: NodeValue;
}

export interface NumberNode extends BaseNode {
  nodeType: "Number";
  value?: NodeValue;
}

export interface ChatNode extends BaseNode {
  nodeType: "Chat";
  value?: NodeValue;
}

export interface BooleanNode extends BaseNode {
  nodeType: "Boolean";
  value?: NodeValue;
}

export interface ImageNode extends BaseNode {
  nodeType: "Image";
  value?: NodeValue;
}

export interface GenericNode extends BaseNode {
  nodeType: "Generic";
  value?: NodeValue;
}

export interface AddNode extends BaseNode {
  nodeType: "Add";
  value?: NodeValue;
} 

export interface JoinNode extends BaseNode {
  nodeType: "Join";
  value?: NodeValue;
}


// Define available node types
export type NodeType = TextNode | NumberNode | ChatNode | BooleanNode | ImageNode | GenericNode | AddNode | JoinNode;




export type Connection = {
  fromSocket: number;
  toSocket: number;
  label?: string; // Optional label like "context", "trigger", etc.
}; 

// Node Type Factories - Functions to create specific node types with predefined configuration

export const createTextNode = (id: number, type: {x: number, y: number}, value: string = ""): TextNode => ({
  id,
  title: "Text",
  value,
  nodeType: "Text",
  sockets: [
    { id: id * 100 + 1, title: "Input", type: "input", nodeId: id, dataType: "string" },
    { id: id * 100 + 2, title: "Output", type: "output", nodeId: id, dataType: "string" }
  ],
  x: type.x,
  y: type.y,
  width: 380,
  height: 220,
  selected: false,
  processing: false
});

export const createNumberNode = (id: number, type: {x: number, y: number}, value: number = 0): NumberNode => ({
  id,
  title: "Number",
  value,
  nodeType: "Number",
  sockets: [
    { id: id * 100 + 2, title: "Output", type: "output", nodeId: id, dataType: "number" }
  ],
  x: type.x,
  y: type.y,
  width: 240,
  height: 180,
  selected: false,
  processing: false
});

export const createChatNode = (id: number, type: {x: number, y: number}, value: string = ""): ChatNode => ({
  id,
  title: "Chat",
  value,
  nodeType: "Chat",
  sockets: [
    { id: id * 100 + 1, title: "Prompt", type: "input", nodeId: id, dataType: "string" },
    { id: id * 100 + 2, title: "System Prompt", type: "input", nodeId: id, dataType: "string" },
    { id: id * 100 + 3, title: "Response", type: "output", nodeId: id, dataType: "string" },
    { id: id * 100 + 4, title: "Tokens", type: "output", nodeId: id, dataType: "number" }
  ],
  x: type.x,
  y: type.y,
  width: 300, // Wider to accommodate multiple inputs
  height: 240, // Taller to fit multi-line text
  selected: false,
  processing: false
});

export const createBooleanNode = (id: number, type: {x: number, y: number}, value: boolean = false): BooleanNode => ({
  id,
  title: "Boolean",
  value,
  nodeType: "Boolean",
  sockets: [
    { id: id * 100 + 1, title: "Output", type: "output", nodeId: id, dataType: "boolean" }
  ],
  x: type.x,
  y: type.y,
  width: 240,
  height: 180,
  selected: false,
  processing: false
});

export const createImageNode = (id: number, type: {x: number, y: number}, value: string = ""): ImageNode => ({
  id,
  title: "Image",
  value, // URL or base64 string
  nodeType: "Image",
  sockets: [
    { id: id * 100 + 1, title: "Source", type: "input", nodeId: id, dataType: "string" },
    { id: id * 100 + 2, title: "Output", type: "output", nodeId: id, dataType: "string" }
  ],
  x: type.x,
  y: type.y,
  width: 280,
  height: 240, // Taller to display image preview
  selected: false,
  processing: false
});

// For backward compatibility, convert existing nodes to the generic type
export const createGenericNode = (id: number, title: string, type: {x: number, y: number}, value: string = ""): GenericNode => ({
  id,
  title,
  value,
  nodeType: "Generic",
  sockets: [
    { id: id * 100 + 1, title: "Input", type: "input", nodeId: id, dataType: "unknown" },
    { id: id * 100 + 2, title: "Output", type: "output", nodeId: id, dataType: "unknown" }
  ],
  x: type.x,
  y: type.y,
  width: 240,
  height: 180,
  selected: false,
  processing: false
});

// Add node for mathematical addition
export const createAddNode = (id: number, type: {x: number, y: number}): AddNode => ({
  id,
  title: "Add",
  value: 0,
  nodeType: "Add",
  sockets: [
    { id: id * 100 + 1, title: "Input A", type: "input", nodeId: id, dataType: "number" },
    { id: id * 100 + 2, title: "Input B", type: "input", nodeId: id, dataType: "number" },
    { id: id * 100 + 3, title: "Result", type: "output", nodeId: id, dataType: "number" }
  ],
  x: type.x,
  y: type.y,
  width: 240,
  height: 180,
  selected: false,
  processing: false
});

// Join node to combine multiple inputs with a separator
export const createJoinNode = (id: number, type: {x: number, y: number}, value: string = " "): JoinNode => ({
  id,
  title: "Join",
  value, // This is the separator between inputs (default is a space)
  nodeType: "Join",
  sockets: [
    { id: id * 100 + 1, title: "Input 1", type: "input", nodeId: id, dataType: "unknown" },
    { id: id * 100 + 2, title: "Input 2", type: "input", nodeId: id, dataType: "unknown" },
    { id: id * 100 + 111, title: "Output", type: "output", nodeId: id, dataType: "string" }
  ],
  x: type.x,
  y: type.y,
  width: 240,
  height: 230, // Increased height to accommodate 50px socket spacing
  selected: false,
  processing: false
}); 