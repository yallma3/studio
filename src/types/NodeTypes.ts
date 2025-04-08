// Define types for node, socket, and connection
export type Socket = {
    id: number;
    title: string;
    position: "input" | "output";  // Position of the socket on the node
    nodeId: number;  // Reference to the parent node
    dataType?: "string" | "number" | "boolean" | "unknown"; // The type of data this socket accepts/provides
};

// Define available node types
export type NodeType = "Text" | "Number" | "Chat" | "Generic" | "Boolean" | "Image" | "Add" | "Join";

// Define possible value types for nodes
export type NodeValue = string | number | boolean | { [key: string]: unknown } | { [key: number]: NodeValue };

export type Node = {
  id: number;
  title: string;
  value: NodeValue;
  nodeType: NodeType; // Type of the node
  sockets: Socket[];
  x: number;
  y: number;
  width: number;  // Custom width for this node
  height: number; // Custom height for this node
  selected?: boolean; // Whether the node is currently selected
  processing?: boolean; // Whether the node is currently processing
};

export type Connection = {
    fromSocket: number;  // ID of the source socket
    toSocket: number;    // ID of the target socket
}; 

// Node Type Factories - Functions to create specific node types with predefined configuration

export const createTextNode = (id: number, position: {x: number, y: number}, value: string = ""): Node => ({
  id,
  title: "Text",
  value,
  nodeType: "Text",
  sockets: [
    { id: id * 100 + 1, title: "Input", position: "input", nodeId: id, dataType: "unknown" },
    { id: id * 100 + 2, title: "Output", position: "output", nodeId: id, dataType: "string" }
  ],
  x: position.x,
  y: position.y,
  width: 380,
  height: 220,
  selected: false,
  processing: false
});

export const createNumberNode = (id: number, position: {x: number, y: number}, value: number = 0): Node => ({
  id,
  title: "Number",
  value,
  nodeType: "Number",
  sockets: [
    { id: id * 100 + 2, title: "Output", position: "output", nodeId: id, dataType: "number" }
  ],
  x: position.x,
  y: position.y,
  width: 240,
  height: 180,
  selected: false,
  processing: false
});

export const createChatNode = (id: number, position: {x: number, y: number}, value: string = ""): Node => ({
  id,
  title: "Chat",
  value,
  nodeType: "Chat",
  sockets: [
    { id: id * 100 + 1, title: "Prompt", position: "input", nodeId: id, dataType: "string" },
    { id: id * 100 + 2, title: "System Prompt", position: "input", nodeId: id, dataType: "string" },
    { id: id * 100 + 3, title: "Response", position: "output", nodeId: id, dataType: "string" },
    { id: id * 100 + 4, title: "Tokens", position: "output", nodeId: id, dataType: "number" }
  ],
  x: position.x,
  y: position.y,
  width: 300, // Wider to accommodate multiple inputs
  height: 240, // Taller to fit multi-line text
  selected: false,
  processing: false
});

export const createBooleanNode = (id: number, position: {x: number, y: number}, value: boolean = false): Node => ({
  id,
  title: "Boolean",
  value,
  nodeType: "Boolean",
  sockets: [
    { id: id * 100 + 1, title: "Output", position: "output", nodeId: id, dataType: "boolean" }
  ],
  x: position.x,
  y: position.y,
  width: 240,
  height: 180,
  selected: false,
  processing: false
});

export const createImageNode = (id: number, position: {x: number, y: number}, value: string = ""): Node => ({
  id,
  title: "Image",
  value, // URL or base64 string
  nodeType: "Image",
  sockets: [
    { id: id * 100 + 1, title: "Source", position: "input", nodeId: id, dataType: "string" },
    { id: id * 100 + 2, title: "Output", position: "output", nodeId: id, dataType: "string" }
  ],
  x: position.x,
  y: position.y,
  width: 280,
  height: 240, // Taller to display image preview
  selected: false,
  processing: false
});

// For backward compatibility, convert existing nodes to the generic type
export const createGenericNode = (id: number, title: string, position: {x: number, y: number}, value: string = ""): Node => ({
  id,
  title,
  value,
  nodeType: "Generic",
  sockets: [
    { id: id * 100 + 1, title: "Input", position: "input", nodeId: id, dataType: "unknown" },
    { id: id * 100 + 2, title: "Output", position: "output", nodeId: id, dataType: "unknown" }
  ],
  x: position.x,
  y: position.y,
  width: 240,
  height: 180,
  selected: false,
  processing: false
});

// Add node for mathematical addition
export const createAddNode = (id: number, position: {x: number, y: number}): Node => ({
  id,
  title: "Add",
  value: 0,
  nodeType: "Add",
  sockets: [
    { id: id * 100 + 1, title: "Input A", position: "input", nodeId: id, dataType: "number" },
    { id: id * 100 + 2, title: "Input B", position: "input", nodeId: id, dataType: "number" },
    { id: id * 100 + 3, title: "Result", position: "output", nodeId: id, dataType: "number" }
  ],
  x: position.x,
  y: position.y,
  width: 240,
  height: 180,
  selected: false,
  processing: false
});

// Join node to combine multiple inputs with a separator
export const createJoinNode = (id: number, position: {x: number, y: number}, value: string = " "): Node => ({
  id,
  title: "Join",
  value, // This is the separator between inputs (default is a space)
  nodeType: "Join",
  sockets: [
    { id: id * 100 + 1, title: "Input 1", position: "input", nodeId: id, dataType: "unknown" },
    { id: id * 100 + 2, title: "Input 2", position: "input", nodeId: id, dataType: "unknown" },
    { id: id * 100 + 111, title: "Output", position: "output", nodeId: id, dataType: "string" }
  ],
  x: position.x,
  y: position.y,
  width: 240,
  height: 230, // Increased height to accommodate 50px socket spacing
  selected: false,
  processing: false
}); 