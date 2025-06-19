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
  process?: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
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
export interface TextNode extends BaseNode {
  nodeType: "Text";
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

export interface NumberNode extends BaseNode {
  nodeType: "Number";
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

export interface ChatNode extends BaseNode {
  nodeType: "Chat";
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

export interface JoinNode extends BaseNode {
  nodeType: "Join";
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}

// Define available node types
export type NodeType =
  | BaseNode
  | TextNode
  | NumberNode
  | ChatNode
  | BooleanNode
  | ImageNode
  | GenericNode
  | AddNode
  | JoinNode;

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

export const createGroqChatNode = (
  id: number,
  type: { x: number; y: number }
): ChatNode => ({
  id,
  title: "Chat",
  nodeValue: "Model:",
  nodeType: "Chat",
  sockets: [
    {
      id: id * 100 + 1,
      title: "Prompt",
      type: "input",
      nodeId: id,
      dataType: "string",
    },
    {
      id: id * 100 + 2,
      title: "System Prompt",
      type: "input",
      nodeId: id,
      dataType: "string",
    },
    {
      id: id * 100 + 3,
      title: "Response",
      type: "output",
      nodeId: id,
      dataType: "string",
    },
    {
      id: id * 100 + 4,
      title: "Tokens",
      type: "output",
      nodeId: id,
      dataType: "number",
    },
  ],
  x: type.x,
  y: type.y,
  width: 300, // Wider to accommodate multiple inputs
  height: 240, // Taller to fit multi-line text
  selected: false,
  processing: false,
  process: async ({ node, getInputValue }) => {
    const n = node as ChatNode;
    // If we have a cached result for this node, use it
    const promptValue = await getInputValue(n.id * 100 + 1);
    const systemPrompt = await getInputValue(n.id * 100 + 2);

    const prompt = String(promptValue || "");

    // Extract model name from node value
    const modelMatch = String(n.nodeValue || "");
    const model = modelMatch ? modelMatch : "llama-3.1-8b-instant"; // Default fallback

    // Use system prompt from input, but don't use the node.value (which now contains the model)
    const system = String(systemPrompt || "");

    try {
      // Get API key from .env using Vite's environment variable format
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

      if (!GROQ_API_KEY) {
        throw new Error(
          "GROQ API key not found. Please check your .env file and ensure it has VITE_GROQ_API_KEY defined."
        );
      }

      console.log(`Using model: ${model}`);
      console.log(
        `Executing Chat node ${n.id} with prompt: "${prompt.substring(
          0,
          50
        )}..."`
      );
      const messages = system
        ? [
            { role: "user", content: prompt },
            { role: "system", content: system },
          ]
        : [{ role: "user", content: prompt }];
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Chat API returned status ${res.status}`);
      }

      const json = await res.json();
      console.log(
        `Chat node ${n.id} received response:`,
        json.choices[0].message.content.substring(0, 50) + "..."
      );

      // Return an object with both values to support multiple outputs
      return {
        // Socket id 3 is for Response content
        [n.id * 100 + 3]: json.choices[0].message.content,
        // Socket id 4 is for Token count
        [n.id * 100 + 4]: json.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error("Error in Chat node:", error);
      // Return error in the response output
      return {
        [n.id * 100 + 3]: `Error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        [n.id * 100 + 4]: 0,
      };
    }
  },
  configParameters: [
    {
      parameterName: "Model",
      parameterType: "string",
      defaultValue: "llama-3.1-8b-instant",
      valueSource: "UserInput",
      UIConfigurable: true,
      description: "Initial image URL or base64 string to output",
      isNodeBodyContent: true,
      sourceList: [
        {
          key: "llama-3.1-8b-instant",
          label: "Llama 3.1 8b Instant",
        },
        {
          key: "llama-3.1-8b-instruct",
          label: "Llama 3.1 8b Instruct",
        },
        {
          key: "llama-3.1-8b-chat",
          label: "Llama 3.1 8b Chat",
        },
        {
          key: "llama-3.1-13b-instant",
          label: "Llama 3.1 13b Instant",
        },
        {
          key: "llama-3.1-13b-instruct",
          label: "Llama 3.1 13b Instruct",
        },
        {
          key: "llama-3.1-13b-chat",
          label: "Llama 3.1 13b Chat",
        },
      ],
    },
    {
      parameterName: "API Key",
      parameterType: "string",
      defaultValue: "",
      valueSource: "UserInput",
      UIConfigurable: true,
      description: "Initial image URL or base64 string to output",
      isNodeBodyContent: false,
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

// Join node to combine multiple inputs with a separator
export const createJoinNode = (
  id: number,
  type: { x: number; y: number }
): JoinNode => ({
  id,
  title: "Join",
  nodeValue: " ", // This is the separator between inputs (default is a space)
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
  process: async ({ node, getInputValue }) => {
    const n = node as JoinNode;
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
        const value = await getInputValue(socket.id);
        return value !== undefined ? String(value) : "";
      })
    );

    // Join all non-empty values with the separator
    return inputValues.filter((val) => val !== "").join(separator);
  },
  configParameters: [
    {
      parameterName: "Text separator",
      parameterType: "string",
      defaultValue: false,
      valueSource: "UserInput",
      UIConfigurable: true,
      description: "Separator between inputs",
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
