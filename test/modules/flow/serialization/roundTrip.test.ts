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
import { serializeCanvasForStorage } from "@/modules/flow/serialization/storageSerializer";
import { deserializeCanvasFromStorage } from "@/modules/flow/serialization/storageDeserializer";
import { sampleRegistryNodes } from "./fixtures/sampleRegistryFixture";
import { BaseNode } from "@/modules/flow/types/NodeTypes";
import { CanvasState } from "@/modules/flow/utils/storageUtils";

describe("Round-Trip Serialization (Studio Save -> Export -> Load Back)", () => {
  it("should faithfully round-trip an active canvas without errors or loss of user configuration", () => {
    // 1. Arrange a realistic live canvas with user configuration & execution residue
    const promptNode: BaseNode = {
      id: 1,
      nodeType: "Prompt",
      category: "Input",
      title: "Story Input",
      x: 100,
      y: 150,
      width: 240,
      height: 160,
      selected: true,
      processing: false,
      result: { ok: true },
      nodeValue: "Write a poem about the ocean",
      sockets: [
        { id: 101, title: "output", type: "output", nodeId: 1, dataType: "string" },
      ],
      configParameters: [
        {
          parameterName: "promptText",
          parameterType: "string",
          defaultValue: "Default prompt body",
          paramValue: "Write a poem about the ocean",
          valueSource: "UserInput",
          isNodeBodyContent: true,
          description: "Text of the prompt",
        },
      ],
    };

    const delayNode: BaseNode = {
      id: 2,
      nodeType: "Delay",
      category: "Control",
      title: "Wait 2s",
      x: 380,
      y: 150,
      width: 200,
      height: 120,
      selected: false,
      processing: true,
      result: null,
      sockets: [
        { id: 201, title: "in", type: "input", nodeId: 2, dataType: "unknown" },
        { id: 202, title: "out", type: "output", nodeId: 2, dataType: "unknown" },
      ],
      configParameters: [
        {
          parameterName: "delayMs",
          parameterType: "number",
          defaultValue: 1000,
          paramValue: 2000,
          valueSource: "UserInput",
          description: "Delay in milliseconds",
        },
      ],
    };

    const llmNode: BaseNode = {
      id: 3,
      nodeType: "LLM",
      category: "AI",
      title: "Poet LLM",
      x: 650,
      y: 150,
      width: 260,
      height: 180,
      selected: false,
      processing: false,
      result: {
        rawOutput: "The ocean waves crash on the shore...",
        model: "llama3:latest",
      },
      nodeValue: "The ocean waves crash on the shore...", // Runtime residue
      sockets: [
        { id: 301, title: "prompt", type: "input", nodeId: 3, dataType: "string" },
        { id: 302, title: "context", type: "input", nodeId: 3, dataType: "string" },
        { id: 303, title: "response", type: "output", nodeId: 3, dataType: "string" },
      ],
      configParameters: [
        {
          parameterName: "model",
          parameterType: "string",
          defaultValue: "llama3:latest",
          paramValue: "mistral:latest",
          valueSource: "UserInput",
          sourceList: [
            { key: "llama3:latest", label: "Llama 3 Latest" },
            { key: "mistral:latest", label: "Mistral Latest" },
            { key: "qwen2.5:latest", label: "Qwen 2.5 Latest" },
          ],
          description: "Target LLM model",
        },
        {
          parameterName: "temperature",
          parameterType: "number",
          defaultValue: 0.7,
          paramValue: 0.9,
          valueSource: "UserInput",
          description: "Sampling temperature",
        },
        {
          parameterName: "systemPrompt",
          parameterType: "string",
          defaultValue: "You are a helpful assistant.",
          paramValue: "You are a sea poet.",
          valueSource: "UserInput",
          description: "System instructions",
        },
      ],
    };

    const originalCanvas: CanvasState = {
      graphId: "graph-round-trip-1",
      graphName: "Ocean Poem Generator",
      nextNodeId: 4,
      nodes: [promptNode, delayNode, llmNode],
      connections: [
        { fromSocket: 101, toSocket: 201 },
        { fromSocket: 202, toSocket: 301 },
      ],
    };

    // 2. Act: Step A - Serialize for storage / export
    const storedObject = serializeCanvasForStorage(originalCanvas);
    const jsonString = JSON.stringify(storedObject, null, 2);

    // 3. Verify Minimal Disk Footprint (Goal 1 hygiene)
    const parsedBackFromDisk = JSON.parse(jsonString);
    expect(parsedBackFromDisk.schemaVersion).toBe(1);
    expect(parsedBackFromDisk.nodes.length).toBe(3);

    // Verify disk payload strictly omits runtime residue and UI catalogs
    parsedBackFromDisk.nodes.forEach((n: any) => {
      expect(n.nodeValue).toBeUndefined();
      expect(n.result).toBeUndefined();
      expect(n.processing).toBeUndefined();
      expect(n.selected).toBeUndefined();
      expect(n.category).toBeUndefined();
      expect(n.description).toBeUndefined();
    });

    // 4. Act: Step B - Studio re-imports / re-loads the saved JSON
    const rehydratedCanvas = deserializeCanvasFromStorage(parsedBackFromDisk, sampleRegistryNodes);

    // 5. Assert: Complete restoration of canvas state without errors
    expect(rehydratedCanvas.graphId).toBe("graph-round-trip-1");
    expect(rehydratedCanvas.graphName).toBe("Ocean Poem Generator");
    expect(rehydratedCanvas.nextNodeId).toBe(4);
    expect(rehydratedCanvas.nodes.length).toBe(3);
    expect(rehydratedCanvas.connections.length).toBe(2);
    expect(rehydratedCanvas.connections).toEqual(originalCanvas.connections);

    // Check Prompt Node
    const rehydratedPrompt = rehydratedCanvas.nodes.find((n) => n.id === 1)!;
    expect(rehydratedPrompt.nodeType).toBe("Prompt");
    expect(rehydratedPrompt.category).toBe("Input"); // Fully restored from registry
    expect(rehydratedPrompt.title).toBe("Story Input");
    expect(rehydratedPrompt.x).toBe(100);
    expect(rehydratedPrompt.y).toBe(150);
    expect(rehydratedPrompt.width).toBe(240);
    expect(rehydratedPrompt.height).toBe(160);
    expect(rehydratedPrompt.selected).toBe(false); // Clean initial state
    expect(rehydratedPrompt.processing).toBe(false);
    expect(rehydratedPrompt.result).toBeUndefined();
    // Option B: nodeValue re-derived from isNodeBodyContent param
    expect(rehydratedPrompt.nodeValue).toBe("Write a poem about the ocean");

    // Check Delay Node
    const rehydratedDelay = rehydratedCanvas.nodes.find((n) => n.id === 2)!;
    expect(rehydratedDelay.nodeType).toBe("Delay");
    expect(rehydratedDelay.category).toBe("Control");
    expect(rehydratedDelay.getConfigParameter!("delayMs")?.paramValue).toBe(2000);

    // Check LLM Node
    const rehydratedLLM = rehydratedCanvas.nodes.find((n) => n.id === 3)!;
    expect(rehydratedLLM.nodeType).toBe("LLM");
    expect(rehydratedLLM.category).toBe("AI");
    expect(rehydratedLLM.title).toBe("Poet LLM");
    // Option B: LLM has no body param, so stale output is cleanly eliminated
    expect(rehydratedLLM.nodeValue).toBeUndefined();
    expect(rehydratedLLM.getConfigParameter!("model")?.paramValue).toBe("mistral:latest");
    expect(rehydratedLLM.getConfigParameter!("temperature")?.paramValue).toBe(0.9);
    expect(rehydratedLLM.getConfigParameter!("systemPrompt")?.paramValue).toBe("You are a sea poet.");
    // Catalog options fully available for editing
    expect(rehydratedLLM.getConfigParameter!("model")?.sourceList?.length).toBe(3);

    // Sockets intact
    expect(rehydratedPrompt.sockets.length).toBe(1);
    expect(rehydratedDelay.sockets.length).toBe(2);
    expect(rehydratedLLM.sockets.length).toBe(3);
  });
});
