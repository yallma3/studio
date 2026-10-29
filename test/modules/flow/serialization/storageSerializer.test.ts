/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 * 
 * Copyright (C) 2025 yaLLMa3
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 * 
 * This software is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect } from "vitest";
import {
  serializeWorkflowForStorage,
  serializeCanvasForStorage,
} from "@/modules/flow/serialization/storageSerializer";
import { CANVAS_SCHEMA_VERSION } from "@/modules/flow/serialization/types";
import { BaseNode } from "@/modules/flow/types/NodeTypes";
import { CanvasState } from "@/modules/flow/utils/storageUtils";

describe("storageSerializer (Goal 1: Persistence Fidelity & Hygiene)", () => {
  const createMockNode = (overrides: Partial<BaseNode> = {}): BaseNode => ({
    id: 1,
    nodeType: "LLM",
    category: "AI",
    title: "LLM Completion",
    description: "Executes LLM",
    nodeValue: "Old runtime execution text", // Should be stripped (Option B)
    x: 100,
    y: 150,
    width: 250,
    height: 180,
    selected: true, // Should be stripped
    processing: true, // Should be stripped
    result: { tokenCount: 45, text: "output" }, // Should be stripped
    sockets: [
      { id: 101, title: "prompt", type: "input", nodeId: 1, dataType: "string" },
      { id: 102, title: "response", type: "output", nodeId: 1, dataType: "string" },
    ],
    configParameters: [
      {
        parameterName: "model",
        parameterType: "string",
        defaultValue: "llama3:latest",
        paramValue: "mistral:latest",
        valueSource: "UserInput",
        sourceList: [{ key: "llama3:latest", label: "Llama 3" }],
        description: "Target model",
      },
      {
        parameterName: "temperature",
        parameterType: "number",
        defaultValue: 0.7,
        paramValue: 0.2,
        valueSource: "UserInput",
        description: "Temperature",
      },
      {
        parameterName: "unusedParam",
        parameterType: "string",
        defaultValue: "default",
        paramValue: undefined, // Unset param should NOT be serialized
        valueSource: "UserInput",
        description: "Unset",
      },
    ],
    ...overrides,
  });

  const mockCanvasState: CanvasState = {
    graphId: "graph-123",
    graphName: "Test Workflow",
    nextNodeId: 2,
    nodes: [createMockNode()],
    connections: [{ fromSocket: 101, toSocket: 102 }],
  };

  it("should serialize canvas state with schemaVersion = 1", () => {
    const result = serializeCanvasForStorage(mockCanvasState);
    expect(result.schemaVersion).toBe(CANVAS_SCHEMA_VERSION);
    expect(result.graphId).toBe("graph-123");
    expect(result.graphName).toBe("Test Workflow");
    expect(result.nextNodeId).toBe(2);
    expect(result.connections).toEqual([{ fromSocket: 101, toSocket: 102 }]);
  });

  it("should strip immutable NodeType definitions from stored nodes", () => {
    const result = serializeCanvasForStorage(mockCanvasState);
    const node: any = result.nodes[0];

    // Preserved fields
    expect(node.id).toBe(1);
    expect(node.nodeType).toBe("LLM");
    expect(node.x).toBe(100);
    expect(node.y).toBe(150);
    expect(node.width).toBe(250);
    expect(node.height).toBe(180);

    // Stripped immutable NodeType fields
    expect(node.category).toBeUndefined();
    expect(node.description).toBeUndefined();
    expect(node.i18n).toBeUndefined();
  });

  it("should strip runtime execution state and residue (nodeValue, processing, result, selected)", () => {
    const result = serializeCanvasForStorage(mockCanvasState);
    const node: any = result.nodes[0];

    // Strictly stripped per Option B and matrix
    expect(node.nodeValue).toBeUndefined();
    expect(node.processing).toBeUndefined();
    expect(node.result).toBeUndefined();
    expect(node.selected).toBeUndefined();
  });

  it("should persist only explicit user config parameter deltas and strip catalog options", () => {
    const result = serializeCanvasForStorage(mockCanvasState);
    const node = result.nodes[0];

    expect(node.configParameters).toEqual([
      { parameterName: "model", paramValue: "mistral:latest" },
      { parameterName: "temperature", paramValue: 0.2 },
    ]);

    // Ensure catalog arrays/descriptions are stripped from configParameters
    const modelParam: any = node.configParameters?.[0];
    expect(modelParam.sourceList).toBeUndefined();
    expect(modelParam.description).toBeUndefined();
    expect(modelParam.parameterType).toBeUndefined();
  });

  it("should preserve custom title if user changed node title", () => {
    const customNode = createMockNode({
      title: "My Custom LLM Analyzer",
      customTitle: "My Custom LLM Analyzer",
    });
    const result = serializeCanvasForStorage({
      ...mockCanvasState,
      nodes: [customNode],
    });
    expect(result.nodes[0].title).toBe("My Custom LLM Analyzer");
  });

  it("should serialize WorkflowFile objects gracefully", () => {
    const workflowFile = {
      id: "wf-456",
      name: "File Workflow",
      createdAt: 1000,
      updatedAt: 2000,
      canvasState: mockCanvasState,
    };
    const result = serializeWorkflowForStorage(workflowFile);
    expect(result.schemaVersion).toBe(CANVAS_SCHEMA_VERSION);
    expect(result.graphId).toBe("graph-123");
    expect(result.nodes.length).toBe(1);
  });
});
