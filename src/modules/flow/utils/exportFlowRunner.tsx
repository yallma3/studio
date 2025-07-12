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
import { executeNode } from "../types/NodeProcessor";
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
  connections: Connection[]
) => {
  // Create a simplified version of the flow to avoid circular references
  const flowExport = {
    nodes: nodes.map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
      nodeType: node.nodeType,
      title: node.title,
      value: node.nodeValue,
      sockets: node.sockets.map((socket) => ({
        id: socket.id,
        title: socket.title,
        position: socket.type,
        nodeId: socket.nodeId,
        dataType: socket.dataType,
      })),
    })),
    connections: connections.map((conn) => ({
      fromSocket: conn.fromSocket,
      toSocket: conn.toSocket,
    })),
  };

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
      .replace(/\\(new line\\)/g, "\\n")  // Replace (new line) with actual newline
      .replace(/\\\\n/g, "\\n");          // Also support \\n for newlines
      
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
    // Get input values
    const promptValue = await getInputValue(node.id * 100 + 1);
    const systemPrompt = await getInputValue(node.id * 100 + 2);
    
    const prompt = String(promptValue || "");
    
    // Extract model name from node value
    const modelMatch = String(node.value || "");
    const model = modelMatch ? modelMatch : "llama-3.1-8b-instant"; // Default fallback
    
    // Use system prompt from input, but don't use the node.value (which now contains the model)
    const system = String(systemPrompt || "");
    
    try {
      console.log(\`Using model: \${model}\`);
      console.log(\`Executing Chat node \${node.id} with prompt: "\${prompt.substring(0, 50)}..."\`);
      
      // Look for API key in global config
      if (!globalConfig.apiKey) {
        console.log("Note: No API key provided. Using simulated response.");
        // Create a simulated response based on the prompt
        const simulatedResponse = \`[Simulated \${model} response to prompt: \${prompt.substring(0, 30)}...]\n\nThis is a simulated response as no API key was provided. To use with real AI services, run with --api-key=YOUR_API_KEY parameter.\`;
        
        // Return an object with both values to support multiple outputs
        return {
          // Socket id 3 is for Response content
          [node.id * 100 + 3]: simulatedResponse,
          // Socket id 4 is for Token count 
          [node.id * 100 + 4]: prompt.length + simulatedResponse.length
        };
      }
      
      // Use real API with provided key
      console.log("Using real API with provided key");
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${globalConfig.apiKey}\`
        },
        body: JSON.stringify({ 
          model: model,
          messages: system ? 
            [{ role: "user", content: prompt }, { role: "system", content: system }] : 
            [{ role: "user", content: prompt }],
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        }),
      });
      
      if (!res.ok) {
        throw new Error(\`Chat API returned status \${res.status}\`);
      }
      
      const json = await res.json();
      console.log(\`Chat node \${node.id} received response:\`, json.choices[0].message.content.substring(0, 50) + "...");
      
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
        [node.id * 100 + 3]: \`Error: \${error instanceof Error ? error.message : String(error)}\`,
        [node.id * 100 + 4]: 0
      };
    }
  },
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
${executeNode.toString()}

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
}
  `;

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
};
