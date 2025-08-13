/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { NodeType, Connection, NodeValue, Socket } from "../types/NodeTypes";
import { executeNode } from "../types/NodeProcessor";
import { buildExecutionGraph } from "./socketUtils";

// Types for the runtime
export interface FlowExecutionOptions {
  onProgress?: (progress: number, total: number) => void;
  onNodeStart?: (nodeId: number, nodeTitle: string) => void;
  onNodeComplete?: (nodeId: number, nodeTitle: string, result: NodeValue) => void;
  onNodeError?: (nodeId: number, nodeTitle: string, error: string) => void;
  onComplete?: (results: FlowExecutionResult[]) => void;
  onError?: (error: string) => void;
}

export interface FlowExecutionResult {
  nodeId: number;
  title: string;
  result?: NodeValue;
  error?: string;
  executionTime?: number;
}

export interface FlowExecutionStatus {
  isExecuting: boolean;
  progress: number;
  total: number;
}

export interface FlowRuntime {
  execute: (options?: FlowExecutionOptions) => Promise<FlowExecutionResult[]>;
  getStatus: () => FlowExecutionStatus;
  cancel: () => void;
  getNodes: () => NodeType[];
}

/**
 * Create a reusable flow runtime for executing node graphs
 */
export class FlowRuntimeImpl implements FlowRuntime {
  private nodes: NodeType[];
  private connections: Connection[];
  private status: FlowExecutionStatus;
  private isCancelled: boolean = false;

  constructor(nodes: NodeType[], connections: Connection[]) {
    this.nodes = nodes;
    this.connections = connections;
    this.status = {
      isExecuting: false,
      progress: 0,
      total: 0,
    };
  }

  /**
   * Execute the flow with optional progress callbacks
   */
  async execute(options: FlowExecutionOptions = {}): Promise<FlowExecutionResult[]> {
    if (this.status.isExecuting) {
      throw new Error("Flow is already executing");
    }

    this.isCancelled = false;
    this.status.isExecuting = true;
    this.status.progress = 0;
    this.status.total = 0;

    try {
      // Create a promise-based cache to store calculated node results
      const nodeResultCache = new Map<number, Promise<NodeValue>>();
      
      // Create a map to collect all node results during execution
      const allNodeResults = new Map<number, NodeValue>();

      // Find end nodes (nodes with no outgoing connections)
      const endNodes = this.findEndNodes();

      if (endNodes.length === 0) {
        const error = "No end nodes found. Your flow needs at least one node with unused outputs.";
        this.status.isExecuting = false;
        options.onError?.(error);
        throw new Error(error);
      }

      console.log(`Found ${endNodes.length} end nodes to execute`);

      // Create a counter to track execution progress
      let completedNodes = 0;

      // Override the map set method to track progress and collect results
      const originalSet = nodeResultCache.set.bind(nodeResultCache);
      nodeResultCache.set = (key: number, value: Promise<NodeValue>) => {
        // Count the total number of nodes in the execution graph
        if (nodeResultCache.size === 0) {
          // First node being executed, estimate total nodes
          const graph = buildExecutionGraph(this.nodes, this.connections);
          const totalNodes = new Set(graph.flatMap(([from, to]) => [from, to])).size;
          this.status.total = totalNodes;
          options.onProgress?.(this.status.progress, this.status.total);
        }

        // Track when the promise completes to update progress
        value
          .then((result) => {
            if (this.isCancelled) return;
            
            completedNodes++;
            this.status.progress = completedNodes;
            options.onProgress?.(this.status.progress, this.status.total);

            // Store the result for this node
            allNodeResults.set(key, result);
            
            // Find the node for callback
            const node = this.nodes.find(n => n.id === key);
            if (node) {
              options.onNodeComplete?.(node.id, node.title, result);
            }
          })
          .catch((error) => {
            if (this.isCancelled) return;
            
            // Still count failed nodes in progress
            completedNodes++;
            this.status.progress = completedNodes;
            options.onProgress?.(this.status.progress, this.status.total);
            
            // Find the node for error callback
            const node = this.nodes.find(n => n.id === key);
            if (node) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              options.onNodeError?.(node.id, node.title, errorMessage);
            }
          });

        return originalSet(key, value);
      };

      // Execute only the end nodes - the dependency tracing will handle executing
      // all required upstream nodes in the correct order
      const results = await Promise.all(
        endNodes.map(async (node) => {
          if (this.isCancelled) {
            return {
              nodeId: node.id,
              title: node.title,
              error: "Execution cancelled",
            };
          }

          const startTime = Date.now();
          
          try {
            options.onNodeStart?.(node.id, node.title);

            // Execute the node and its dependencies
            const result = await executeNode(
              node,
              this.nodes,
              this.connections,
              nodeResultCache
            );

            const executionTime = Date.now() - startTime;

            return {
              nodeId: node.id,
              title: node.title,
              result,
              executionTime,
            };
          } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`Error executing node ${node.id}:`, error);

            return {
              nodeId: node.id,
              title: node.title,
              error: error instanceof Error ? error.message : String(error),
              executionTime,
            };
          }
        })
      );

      // Update all nodes with their results that were processed during execution
      const finalNodes = this.nodes.map((node) => {
        // If this node was executed and has a result
        if (allNodeResults.has(node.id)) {
          const result = allNodeResults.get(node.id);
          const processedResult =
            result === null
              ? undefined
              : typeof result === "boolean" && result === false
              ? "false" // Convert false to string 'false'
              : result;

          return {
            ...node,
            processing: false,
            result: processedResult,
          };
        }
        // If this node is an end node with an error (not in allNodeResults)
        const endNodeWithError = results.find(
          (r) => r.nodeId === node.id && "error" in r
        );
        if (endNodeWithError && "error" in endNodeWithError) {
          return {
            ...node,
            processing: false,
            result: `Error: ${endNodeWithError.error}`,
          };
        }

        return node;
      });

      // Update the nodes array with results
      this.nodes = finalNodes;

      // Reset execution status
      this.status.isExecuting = false;
      this.status.progress = 0;
      this.status.total = 0;

      options.onComplete?.(results);
      return results;

    } catch (error) {
      this.status.isExecuting = false;
      this.status.progress = 0;
      this.status.total = 0;

      const errorMessage = error instanceof Error ? error.message : String(error);
      options.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Get current execution status
   */
  getStatus(): FlowExecutionStatus {
    return { ...this.status };
  }

  /**
   * Cancel the current execution
   */
  cancel(): void {
    this.isCancelled = true;
    this.status.isExecuting = false;
  }

  /**
   * Find end nodes (nodes with no outgoing connections)
   */
  private findEndNodes(): NodeType[] {
    return this.nodes.filter((node) => {
      return node.sockets
        .filter((socket: Socket) => socket.type === "output")
        .every(
          (socket: Socket) =>
            !this.connections.some((conn) => conn.fromSocket === socket.id)
        );
    });
  }

  /**
   * Get the updated nodes with results
   */
  getNodes(): NodeType[] {
    return this.nodes;
  }
}

/**
 * Create a flow runtime instance
 */
export function createFlowRuntime(nodes: NodeType[], connections: Connection[]): FlowRuntime {
  return new FlowRuntimeImpl(nodes, connections);
}

/**
 * Execute a flow with a simple interface
 */
export async function executeFlow(
  nodes: NodeType[], 
  connections: Connection[], 
  options?: FlowExecutionOptions
): Promise<FlowExecutionResult[]> {
  const runtime = createFlowRuntime(nodes, connections);
  return await runtime.execute(options);
}

/**
 * Execute a flow and return updated nodes with results
 */
export async function executeFlowWithResults(
  nodes: NodeType[], 
  connections: Connection[], 
  options?: FlowExecutionOptions
): Promise<{ results: FlowExecutionResult[]; updatedNodes: NodeType[] }> {
  const runtime = createFlowRuntime(nodes, connections);
  const results = await runtime.execute(options);
  return {
    results,
    updatedNodes: runtime.getNodes(),
  };
} 