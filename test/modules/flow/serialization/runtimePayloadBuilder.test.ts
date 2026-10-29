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
  buildWorkflowRuntimePayload,
  buildWorkspaceRuntimePayload,
} from "@/modules/flow/serialization/runtimePayloadBuilder";
import { BaseNode } from "@/modules/flow/types/NodeTypes";
import { CanvasState } from "@/modules/flow/utils/storageUtils";

describe("runtimePayloadBuilder (Goal 2: Lean Wire Payload for Sidecar / LLM)", () => {
  const sampleLiveNode: BaseNode = {
    id: 1,
    nodeType: "LLM",
    category: "AI", // Should be stripped
    title: "LLM Completion",
    description: "Executes LLM", // Stripped from node root
    x: 450, // Should be stripped
    y: 200, // Should be stripped
    width: 280, // Should be stripped
    height: 180, // Should be stripped
    selected: true, // Should be stripped
    processing: false, // Should be stripped
    result: { tokenCount: 100 }, // Should be stripped
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
        sourceList: [
          { key: "llama3:latest", label: "Llama 3" },
          { key: "mistral:latest", label: "Mistral" },
        ], // Should be stripped
        description: "Target model",
        UIConfigurable: true, // Should be stripped
        acceptedFileTypes: "text/*", // Should be stripped
        i18n: { ar: { model: { Name: "نموذج", Description: "النموذج" } } }, // Should be stripped
      },
      {
        parameterName: "temperature",
        parameterType: "number",
        defaultValue: 0.7,
        paramValue: undefined, // Should fallback to defaultValue in runtime payload
        valueSource: "UserInput",
        description: "Sampling temperature",
      },
    ],
  };

  const sampleCanvas: CanvasState = {
    graphId: "wf-runtime-1",
    graphName: "Inference Graph",
    nextNodeId: 2,
    nodes: [sampleLiveNode],
    connections: [{ fromSocket: 101, toSocket: 102 }],
  };

  it("should strip visual layout coordinates and dimensions from runtime nodes", () => {
    const payload = buildWorkflowRuntimePayload(sampleCanvas);
    const node: any = payload.nodes[0];

    expect(node.x).toBeUndefined();
    expect(node.y).toBeUndefined();
    expect(node.width).toBeUndefined();
    expect(node.height).toBeUndefined();
  });

  it("should strip UI presentation catalogs and transient residue", () => {
    const payload = buildWorkflowRuntimePayload(sampleCanvas);
    const node: any = payload.nodes[0];

    expect(node.category).toBeUndefined();
    expect(node.selected).toBeUndefined();
    expect(node.processing).toBeUndefined();
    expect(node.result).toBeUndefined();
  });

  it("should enrich configParameters with semantic type, fallback, and resolved value while stripping UI catalogs", () => {
    const payload = buildWorkflowRuntimePayload(sampleCanvas);
    const node = payload.nodes[0];

    expect(node.configParameters.length).toBe(2);

    const modelParam: any = node.configParameters.find((p) => p.parameterName === "model");
    expect(modelParam).toBeDefined();
    expect(modelParam.parameterType).toBe("string");
    expect(modelParam.paramValue).toBe("mistral:latest");
    expect(modelParam.defaultValue).toBe("llama3:latest");
    expect(modelParam.description).toBe("Target model");

    // UI catalogs stripped
    expect(modelParam.sourceList).toBeUndefined();
    expect(modelParam.UIConfigurable).toBeUndefined();
    expect(modelParam.acceptedFileTypes).toBeUndefined();
    expect(modelParam.i18n).toBeUndefined();

    // Fallback resolution for unset temperature
    const tempParam = node.configParameters.find((p) => p.parameterName === "temperature");
    expect(tempParam).toBeDefined();
    expect(tempParam?.paramValue).toBe(0.7); // Fallback resolved
    expect(tempParam?.defaultValue).toBe(0.7);
  });

  it("should build workspace runtime payload across multiple workflows", () => {
    const workspaceData = {
      id: "ws-999",
      name: "Autonomous Agent Suite",
      description: "Multi-agent workspace",
      activeWorkflowId: "wf-runtime-1",
    };

    const payload = buildWorkspaceRuntimePayload(workspaceData, [sampleCanvas]);

    expect(payload.id).toBe("ws-999");
    expect(payload.name).toBe("Autonomous Agent Suite");
    expect(payload.workflows.length).toBe(1);
    expect(payload.workflows[0].id).toBe("wf-runtime-1");
    expect(payload.workflows[0].nodes.length).toBe(1);
    expect((payload.workflows[0].nodes[0] as any).x).toBeUndefined();
  });
});
