/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { NodeType, Connection } from "../types/NodeTypes";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";


/**
 * Exports the current flow as a standalone JavaScript file that can be run with Node.js
 * @param nodes The current nodes in the flow
 * @param connections The current connections between nodes
 * @returns Promise<void> - Saves a file using Tauri's file system API
 */
export const exportFlowRunner = async (
  nodes: NodeType[],
  connections: Connection[],
  exportToText: boolean
) => {
  // Create a simplified version of the flow to avoid circular references
  const flowExport = {
    nodes: nodes.map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
      nodeType: node.nodeType,
      title: node.title,
      nodeValue: node.nodeValue,
      sockets: node.sockets.map((socket) => ({
        id: socket.id,
        title: socket.title,
        type: socket.type,
        nodeId: socket.nodeId,
        dataType: socket.dataType,
      })),
    })),
    connections: connections.map((conn) => ({
      fromSocket: conn.fromSocket,
      toSocket: conn.toSocket,
    })),
  };
  // Dynamically build processors object from the actual nodes
  const processors: Record<string, string> = {};
  for (const node of nodes) {
    // Check if the node has a processText property (for custom nodes)
    console.log("Node from the flow export", node.process?.toString() || "No process found")
    processors[node.nodeType] = node.process?.toString() || "";
    
    // For built-in nodes, we'll define them in the generated code below
  }
  let processorsString = "";
  for (const processor of Object.keys(processors)) {
    processorsString += `
    ${processor}: ${processors[processor]},
    `;
  }
  console.log("Processors", processorsString)

  // Generate the JavaScript code with self-executing functionality
  const jsCode = `
// Flow Runner - Generated from NodeCanvas
const flowData = ${JSON.stringify(flowExport, null, 2)};

// Global configuration object that can be accessed by all processors
const globalConfig = {
  apiKey: null,
  debug: false
};

// Process text templates by replacing variables like {{input}} with their values
const processTextTemplate = async (template, getInputValue, nodeId) => {
  // Handle {{input}} variable
  const inputRegex = /\\{\\{input\\}\\}/g;
  let result = template;
  
  if (inputRegex.test(template)) {
    // Get the input value from the first input socket
    const inputValue = await getInputValue(nodeId * 100 + 1);
    // Replace {{input}} with the actual input value, or empty string if undefined
    result = template.replace(inputRegex, inputValue !== undefined ? String(inputValue) : "");
  }
  
  return result;
};

// Define processors for each node type
const processors = {
  Number: async ({ node }) => node.value,
  Boolean: async ({ node }) => node.value,
  Generic: async ({ node }) => node.value,
  Add: async ({ node, getInputValue }) => {
    const a = Number(await getInputValue(node.id * 100 + 1) || 0);
    const b = Number(await getInputValue(node.id * 100 + 2) || 0);
    return a + b;
  },  
  // Dynamic processors from the flow
  ${processorsString}
};

// Helper functions
const findNodeById = (id, nodes) => {
  return nodes.find(n => n.id === id);
};

const findSocketById = (socketId, nodes) => {
  for (const node of nodes) {
    const socket = node.sockets.find(s => s.id === socketId);
    if (socket) return socket;
  }
  return undefined;
};

// NodeProcessor and execution logic
async function executeNode(node, allNodes, connections, cache) {
  const executionCache = cache || /* @__PURE__ */ new Map();
  if (executionCache.has(node.id)) {
    console.log(
      \`Waiting for cached result for node \${node.id} (\${node.title})\`
    );
    return await executionCache.get(node.id);
  }
  console.log(\`Starting execution of node \${node.id} (\${node.title})\`);
  const executionPromise = (async () => {
    const getInputValue = async (inputSocketId) => {
      const incomingConnection = connections.find(
        (c) => c.toSocket === inputSocketId
      );
      if (!incomingConnection) return void 0;
      const fromSocketId = incomingConnection.fromSocket;
      const fromSocket = findSocketById(fromSocketId, allNodes);
      if (!fromSocket) return void 0;
      const fromNode = findNodeById(fromSocket.nodeId, allNodes);
      if (!fromNode) return void 0;
      const result2 = await executeNode(
        fromNode,
        allNodes,
        connections,
        executionCache
      );
      if (
        typeof result2 === "object" &&
        result2 !== null &&
        !Array.isArray(result2)
      ) {
        const socketIds = Object.keys(result2)
          .map(Number)
          .filter((id) => !isNaN(id));
        if (socketIds.length > 0) {
          if (fromSocketId in result2) {
            const numericResult = result2;
            return numericResult[fromSocketId];
          }
        }
      }
      return result2;
    };
    if (!processors[node.nodeType]) {
      throw new Error(
        \`Node \${node.nodeType} (ID: \${node.id}) does not have a process function\`
      );
    }
    console.log(\`Executing processor for node \${node.id} (\${node.title})\`);
    const context = { node, getInputValue };
    const result = await processors[node.nodeType](context);
    console.log(\`Completed execution of node \${node.id} (\${node.title})\`);
    return result;
  })();
  executionCache.set(node.id, executionPromise);
  return await executionPromise;
}

// Main execution function
async function runFlow(inputOverrides = {}) {
  // Apply any input overrides
  const nodes = flowData.nodes.map(node => {
    if (inputOverrides[node.id]) {
      return { ...node, value: inputOverrides[node.id] };
    }
    return node;
  });
  
  // Set up result cache
  const nodeResultCache = new Map();
  
  // Find end nodes
  const endNodes = nodes.filter(node => {
    return node.sockets
      .filter(socket => socket.type === "output")
      .every(socket => 
        !flowData.connections.some(conn => conn.fromSocket === socket.id)
      );
  });
  
  if (endNodes.length === 0) {
    throw new Error("No end nodes found in flow");
  }
  
  // Execute flow
  const results = await Promise.all(
    endNodes.map(async (node) => {
      try {
        const result = await executeNode(node, nodes, flowData.connections, nodeResultCache);
        return { nodeId: node.id, title: node.title, result };
      } catch (error) {
        return { nodeId: node.id, title: node.title, error: error.message };
      }
    })
  );
  
  return results;
}

// Export for use as a module
if (typeof module !== 'undefined') {
  module.exports = { runFlow };
}

// Self-executing section when run directly with Node.js
if (require.main === module) {
  console.log("Flow Runner - Starting execution...");
  console.log("-----------------------------------");
  
  // Get input overrides and global config from command line arguments
  // Format: node flow-runner.js nodeId=value --api-key=YOUR_API_KEY
  const inputOverrides = {};
  
  if (process.argv.length > 2) {
    process.argv.slice(2).forEach(arg => {
      // Handle special command line flags with -- prefix
      if (arg.startsWith('--api-key=')) {
        globalConfig.apiKey = arg.substring('--api-key='.length);
        console.log("API key provided");
      }
      else if (arg === '--debug') {
        globalConfig.debug = true;
        console.log("Debug mode enabled");
      }
      // Handle node overrides with nodeId=value format
      else if (arg.includes('=')) {
        const [nodeId, value] = arg.split('=');
        // Try to parse the value as a number or boolean if possible
        let parsedValue = value;
        if (value === 'true') parsedValue = true;
        else if (value === 'false') parsedValue = false;
        else if (!isNaN(Number(value))) parsedValue = Number(value);
        
        inputOverrides[Number(nodeId)] = parsedValue;
      }
    });
    
    if (Object.keys(inputOverrides).length > 0) {
      console.log("Using input overrides:", inputOverrides);
    }
  }
  
  // Run the flow
  runFlow(inputOverrides)
    .then(results => {
      console.log("\\nExecution Results:");
      console.log("------------------");
      results.forEach(result => {
        console.log(\`Node "\${result.title}" (ID: \${result.nodeId}):\`);
        if ('error' in result) {
          console.log(\`  Error: \${result.error}\`);
        } else {
          // Pretty print the result but handle both primitive values and objects
          const resultOutput = typeof result.result === 'object' && result.result !== null
            ? JSON.stringify(result.result, null, 2)
            : result.result;
          console.log(\`  Result: \${resultOutput}\`);
        }
        console.log("");
      });
    })
    .catch(error => {
      console.error("Error executing flow:", error);
      process.exit(1);
    });
    ${exportToText ? `
    // IMPORTANT: Return the flow execution results when called as a function
    return await runFlow();` : ""}
}
  `;
 if (exportToText) {
  return jsCode;
  } else {
    try {
      // Use Tauri dialog to let the user choose where to save the file
      const filePath = await save({
        defaultPath: "flow-runner.js",
        filters: [
          {
            name: "JavaScript",
            extensions: ["js"],
          },
        ],
      });

      if (filePath) {
        // Use Tauri file system API to save the file
        await writeTextFile(filePath, jsCode);
        console.log(`Flow exported successfully to ${filePath}`);
        return filePath;
      } else {
        console.log("Export canceled by user");
        return null;
      }
    } catch (error) {
      console.error("Failed to export flow:", error);
      throw error;
    }
  }
};