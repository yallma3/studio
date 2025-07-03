/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { NodeType, Socket, NodeValue, Connection, NodeExecutionContext } from "./NodeTypes";


export async function executeNode(node: NodeType, allNodes: NodeType[], connections: Connection[], cache?: Map<number, Promise<NodeValue>>): Promise<NodeValue> {
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

    // Use the node's process function directly instead of via the processors object
    if (!node.process) {
      throw new Error(`Node ${node.nodeType} (ID: ${node.id}) does not have a process function`);
    }

    // Execute the node's process function
    console.log(`Executing processor for node ${node.id} (${node.title})`);
    const context: NodeExecutionContext = { node, getInputValue };
    const result = await node.process(context);
    console.log(`Completed execution of node ${node.id} (${node.title})`);
    
    return result;
  })();
  
  // Store the promise in the cache, using node.id as the key to ensure each node's result is cached
  executionCache.set(node.id, executionPromise as Promise<NodeValue>);
  
  // Await and return the result
  return await executionPromise as NodeValue;
}

export function findNodeById(id: number, nodes: NodeType[]): NodeType | undefined {
  return nodes.find(n => n.id === id);
}

export function findSocketById(id: number, nodes: NodeType[]): Socket | undefined {
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
export function topologicalSort(nodes: NodeType[], connections: Connection[]): NodeType[] {
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
  
  
  