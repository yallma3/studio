import { NodeType, Socket, Node, NodeValue, Connection } from "./NodeTypes";

type NodeExecutionContext = {
  node: Node;
  getInputValue: (socketId: number) => Promise<NodeValue | undefined>;
};

type NodeProcessor = (context: NodeExecutionContext) => Promise<NodeValue>;

/**
 * Process text templates by replacing variables like {{input}} with their values
 */
const processTextTemplate = async (template: string, getInputValue: (socketId: number) => Promise<NodeValue | undefined>, nodeId: number): Promise<string> => {
  // Handle {{input}} variable
  const inputRegex = /\{\{input\}\}/g;
  let result = template;
  
  if (inputRegex.test(template)) {
    // Get the input value from the first input socket
    const inputValue = await getInputValue(nodeId * 100 + 1);
    // Replace {{input}} with the actual input value, or empty string if undefined
    result = template.replace(inputRegex, inputValue !== undefined ? String(inputValue) : "");
  }
  
  return result;
};

const processors: Record<NodeType, NodeProcessor> = {
  Text: async ({ node, getInputValue }) => {
    // If the node value is a string and contains template variables, process them
    if (typeof node.value === 'string') {
      return processTextTemplate(node.value, getInputValue, node.id);
    }
    return node.value;
  },
  Number: async ({ node }) => node.value,
  Boolean: async ({ node }) => node.value,
  Generic: async ({ node }) => node.value,
  Add: async ({ node, getInputValue }) => {
    const a = Number(await getInputValue(node.id * 100 + 1) || 0);
    const b = Number(await getInputValue(node.id * 100 + 2) || 0);
    return a + b;
  },
  Join: async ({ node, getInputValue }) => {
    // Process special separator values
    let separator = String(node.value || "");
    
    // Replace special separator placeholders
    separator = separator
      .replace(/\(new line\)/g, "\n")  // Replace (new line) with actual newline
      .replace(/\\n/g, "\n");          // Also support \n for newlines
      
    // Count input sockets to determine how many inputs to process
    const inputSockets = node.sockets.filter(s => s.type === "input");
    
    // Collect all input values
    const inputValues = await Promise.all(
      inputSockets.map(async (socket) => {
        const value = await getInputValue(socket.id);
        return value !== undefined ? String(value) : "";
      })
    );
    
    // Join all non-empty values with the separator
    return inputValues.filter(val => val !== "").join(separator);
  },
  Image: async ({ node, getInputValue }) => {
    // If there's an input source, use that, otherwise use the node's value
    const sourceValue = await getInputValue(node.id * 100 + 1);
    return sourceValue !== undefined ? sourceValue : node.value;
  },
  Chat: async ({ node, getInputValue }) => {
    // If we have a cached result for this node, use it
    const promptValue = await getInputValue(node.id * 100 + 1);
    const systemPrompt = await getInputValue(node.id * 100 + 2);
    
    const prompt = String(promptValue || "");
    
    // Extract model name from node value
    const modelMatch = String(node.value || "");
    const model = modelMatch ? modelMatch : "llama-3.1-8b-instant"; // Default fallback
    
    // Use system prompt from input, but don't use the node.value (which now contains the model)
    const system = String(systemPrompt || "");
    
    try {
      // Get API key from .env using Vite's environment variable format
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!GROQ_API_KEY) {
        throw new Error("GROQ API key not found. Please check your .env file and ensure it has VITE_GROQ_API_KEY defined.");
      }
      
      console.log(`Using model: ${model}`);
      console.log(`Executing Chat node ${node.id} with prompt: "${prompt.substring(0, 50)}..."`);
      const messages =  system ? [{ role: "user", content: prompt }, { role: "system", content: system }] : [{ role: "user", content: prompt }];
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({ 
          model: model,
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        }),
      });
      
      if (!res.ok) {
        throw new Error(`Chat API returned status ${res.status}`);
      }
      
      const json = await res.json();
      console.log(`Chat node ${node.id} received response:`, json.choices[0].message.content.substring(0, 50) + "...");
      
      // Return an object with both values to support multiple outputs
      return {
        // Socket id 3 is for Response content
        [node.id * 100 + 3]: json.choices[0].message.content,
        // Socket id 4 is for Token count 
        [node.id * 100 + 4]: json.usage?.total_tokens || 0
      };
    } catch (error) {
      console.error("Error in Chat node:", error);
      // Return error in the response output
      return {
        [node.id * 100 + 3]: `Error: ${error instanceof Error ? error.message : String(error)}`,
        [node.id * 100 + 4]: 0
      };
    }
  },
};

export async function executeNode(node: Node, allNodes: Node[], connections: Connection[], cache?: Map<number, Promise<NodeValue>>): Promise<NodeValue> {
  // Use cache if provided to avoid redundant calculations
  const executionCache = cache || new Map<number, Promise<NodeValue>>();
  
  // Check if we already have a pending or completed execution for this node
  if (executionCache.has(node.id)) {
    console.log(`Waiting for cached result for node ${node.id} (${node.title})`);
    // Await the cached promise to get the actual value
    return await executionCache.get(node.id)!;
  }
  
  console.log(`Starting execution of node ${node.id} (${node.title})`);
  
  // Create a promise for this node's execution and store it in the cache immediately
  // This ensures that any subsequent requests for this node's value during recursion
  // will wait for the actual value rather than use a placeholder
  const executionPromise = (async () => {
    const getInputValue = async (inputSocketId: number): Promise<NodeValue | undefined> => {
      // Find connection coming into this socket
      const incomingConnection = connections.find(c => c.toSocket === inputSocketId);
      if (!incomingConnection) return undefined;

      // Find source socket and node
      const fromSocketId = incomingConnection.fromSocket;
      const fromSocket = findSocketById(fromSocketId, allNodes);
      if (!fromSocket) return undefined;
      
      const fromNode = findNodeById(fromSocket.nodeId, allNodes);
      if (!fromNode) return undefined;

      // Execute the source node to get its output value, passing along the cache
      const result = await executeNode(fromNode, allNodes, connections, executionCache);
      
      // If result is an object with socket IDs as keys, return the value for the output socket
      if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
        // Check if this is a multi-output value object
        const socketIds = Object.keys(result).map(Number).filter(id => !isNaN(id));
        if (socketIds.length > 0) {
          // Return the value for the specific output socket if it exists
          if (fromSocketId in result) {
            // Use a type guard to ensure we can access numeric indices
            const numericResult = result as { [key: number]: NodeValue };
            return numericResult[fromSocketId];
          }
        }
      }
      
      return result;
    };

    // Get processor for this node type
    const processor = processors[node.nodeType];
    if (!processor) throw new Error(`Processor for node type ${node.nodeType} not found`);

    // Execute node processor
    console.log(`Executing processor for node ${node.id} (${node.title})`);
    const result = await processor({ node, getInputValue });
    console.log(`Completed execution of node ${node.id} (${node.title})`);
    
    return result;
  })();
  
  // Store the promise in the cache
  executionCache.set(node.id, executionPromise);
  
  // Await and return the result
  return await executionPromise;
}

export function findNodeById(id: number, nodes: Node[]): Node | undefined {
  return nodes.find(n => n.id === id);
}

export function findSocketById(id: number, nodes: Node[]): Socket | undefined {
  for (const node of nodes) {
    const socket = node.sockets.find(s => s.id === id);
    if (socket) return socket;
  }
  return undefined;
}

/**
 * Sort nodes in topological order based on their connections
 * This ensures that nodes are executed in the correct dependency order
 */
export function topologicalSort(nodes: Node[], connections: Connection[]): Node[] {
  // Create an adjacency list representation of the dependency graph
  // Where node A depends on node B if B's output is connected to A's input
  const dependencyGraph: Map<number, number[]> = new Map();
  
  // Initialize the graph with all nodes having empty dependency lists
  nodes.forEach(node => {
    dependencyGraph.set(node.id, []);
  });
  
  // Build the dependency graph from connections
  connections.forEach(conn => {
    // Find source and target nodes for this connection
    const fromSocket = nodes.flatMap(n => n.sockets).find(s => s.id === conn.fromSocket);
    const toSocket = nodes.flatMap(n => n.sockets).find(s => s.id === conn.toSocket);
    
    if (fromSocket && toSocket) {
      const sourceNodeId = fromSocket.nodeId;
      const targetNodeId = toSocket.nodeId;
      
      // Target node depends on source node
      const dependencies = dependencyGraph.get(targetNodeId) || [];
      if (!dependencies.includes(sourceNodeId)) {
        dependencies.push(sourceNodeId);
        dependencyGraph.set(targetNodeId, dependencies);
      }
    }
  });
  
  // Track which nodes have been visited in our topological sort
  const visited = new Set<number>();
  const tempVisiting = new Set<number>();
  const result: number[] = [];
  
  // Detect cycles and perform topological sort using DFS
  const dfs = (nodeId: number): boolean => {
    // Skip if already processed
    if (visited.has(nodeId)) return true;
    
    // Detect cycles (node is currently being visited)
    if (tempVisiting.has(nodeId)) return false;
    
    // Mark node as being visited
    tempVisiting.add(nodeId);
    
    // Visit all dependencies
    const dependencies = dependencyGraph.get(nodeId) || [];
    for (const dependency of dependencies) {
      if (!dfs(dependency)) return false; // Cycle detected
    }
    
    // Processing complete - add to result and mark as visited
    visited.add(nodeId);
    tempVisiting.delete(nodeId);
    result.push(nodeId);
    return true;
  };
  
  // Perform DFS for each node
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (!dfs(node.id)) {
        console.warn("Cycle detected in node graph! Falling back to left-to-right (x-position) ordering.");
        return [...nodes].sort((a, b) => a.x - b.x);
      }
    }
  }
  
  // Convert node IDs back to nodes in reverse order (to get dependencies first)
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const sortedNodes = result.map(id => nodeMap.get(id)!).reverse();
  
  console.log(`Topological sort order: ${sortedNodes.map(n => `${n.title} (${n.id})`).join(' -> ')}`);
  
  // As a final step, within each dependency level, sort by x-position
  // This ensures a more intuitive left-to-right flow within each level
  return sortedNodes;
}
  
  
  