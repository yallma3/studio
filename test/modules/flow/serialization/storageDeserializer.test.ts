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
  deserializeWorkflowFromStorage,
  deserializeCanvasFromStorage,
} from "@/modules/flow/serialization/storageDeserializer";
import { StoredWorkflow } from "@/modules/flow/serialization/types";
import { sampleRegistryNodes } from "./fixtures/sampleRegistryFixture";
import { legacyWorkflowSnapshot } from "./fixtures/legacyWorkflowFixture";

describe("storageDeserializer (Goal 1: Rehydration & Compatibility)", () => {
  const minimalStoredWorkflow: StoredWorkflow = {
    schemaVersion: 1,
    graphId: "wf-saved-100",
    graphName: "Saved Flow",
    nextNodeId: 3,
    nodes: [
      {
        id: 1,
        nodeType: "Prompt",
        title: "User Prompt",
        x: 100,
        y: 100,
        width: 240,
        height: 160,
        configParameters: [
          { parameterName: "promptText", paramValue: "Explain quantum computing" },
        ],
      },
      {
        id: 2,
        nodeType: "LLM",
        x: 400,
        y: 100,
        width: 260,
        height: 180,
        configParameters: [
          { parameterName: "model", paramValue: "mistral:latest" },
          { parameterName: "temperature", paramValue: 0.1 },
        ],
      },
    ],
    connections: [
      { fromSocket: 101, toSocket: 201 },
    ],
  };

  it("should rehydrate nodes against nodeRegistry with full catalog properties", () => {
    const canvas = deserializeCanvasFromStorage(minimalStoredWorkflow, sampleRegistryNodes);

    expect(canvas.graphId).toBe("wf-saved-100");
    expect(canvas.graphName).toBe("Saved Flow");
    expect(canvas.nodes.length).toBe(2);

    const promptNode = canvas.nodes.find((n) => n.id === 1)!;
    expect(promptNode.nodeType).toBe("Prompt");
    expect(promptNode.category).toBe("Input"); // Restored from registry
    expect(promptNode.description).toBe("Static or dynamic user prompt"); // Restored from registry

    const llmNode = canvas.nodes.find((n) => n.id === 2)!;
    expect(llmNode.nodeType).toBe("LLM");
    expect(llmNode.category).toBe("AI"); // Restored from registry

    const modelParam = llmNode.configParameters?.find((p) => p.parameterName === "model");
    expect(modelParam).toBeDefined();
    expect(modelParam?.paramValue).toBe("mistral:latest"); // Restored user value
    expect(modelParam?.sourceList?.length).toBe(3); // Restored catalog dropdown
    expect(modelParam?.parameterType).toBe("string");
  });

  it("should re-derive nodeValue for body-content nodes strictly on load (Option B)", () => {
    const canvas = deserializeCanvasFromStorage(minimalStoredWorkflow, sampleRegistryNodes);

    const promptNode = canvas.nodes.find((n) => n.id === 1)!;
    // Prompt has isNodeBodyContent: true on promptText, so nodeValue is restored
    expect(promptNode.nodeValue).toBe("Explain quantum computing");

    const llmNode = canvas.nodes.find((n) => n.id === 2)!;
    // LLM has no body-content parameter, so nodeValue remains clean (no stale execution output)
    expect(llmNode.nodeValue).toBeUndefined();
  });

  it("should re-bind helper methods (getConfigParameter, setConfigParameter) on nodes", () => {
    const canvas = deserializeCanvasFromStorage(minimalStoredWorkflow, sampleRegistryNodes);
    const llmNode = canvas.nodes.find((n) => n.id === 2)!;

    expect(typeof llmNode.getConfigParameters).toBe("function");
    expect(typeof llmNode.getConfigParameter).toBe("function");
    expect(typeof llmNode.setConfigParameter).toBe("function");

    expect(llmNode.getConfigParameter!("model")?.paramValue).toBe("mistral:latest");

    llmNode.setConfigParameter!("model", "llama3:latest");
    expect(llmNode.getConfigParameter!("model")?.paramValue).toBe("llama3:latest");
  });

  it("should handle unknown/unregistered node types gracefully with a fallback placeholder", () => {
    const workflowWithUnknownNode: StoredWorkflow = {
      schemaVersion: 1,
      graphId: "wf-unknown",
      graphName: "Unknown Node Test",
      nextNodeId: 2,
      nodes: [
        {
          id: 1,
          nodeType: "FutureExperimentalNode",
          title: "Future Experimental Node",
          x: 200,
          y: 200,
          width: 220,
          height: 140,
        },
      ],
      connections: [],
    };

    const canvas = deserializeCanvasFromStorage(workflowWithUnknownNode, sampleRegistryNodes);
    expect(canvas.nodes.length).toBe(1);

    const fallbackNode = canvas.nodes[0];
    expect(fallbackNode.id).toBe(1);
    expect(fallbackNode.nodeType).toBe("FutureExperimentalNode");
    expect(fallbackNode.title).toBe("Future Experimental Node");
    expect(fallbackNode.x).toBe(200);
    expect(fallbackNode.y).toBe(200);
  });

  it("should drop unknown/orphaned config parameters gracefully with fallback", () => {
    const workflowWithOrphanedParam: StoredWorkflow = {
      schemaVersion: 1,
      graphId: "wf-orphaned",
      graphName: "Orphaned Param Test",
      nextNodeId: 2,
      nodes: [
        {
          id: 1,
          nodeType: "Delay",
          x: 100,
          y: 100,
          configParameters: [
            { parameterName: "delayMs", paramValue: 5000 },
            { parameterName: "removedOldFeatureParam", paramValue: "old value" },
          ],
        },
      ],
      connections: [],
    };

    const canvas = deserializeCanvasFromStorage(workflowWithOrphanedParam, sampleRegistryNodes);
    const delayNode = canvas.nodes[0];
    const delayParam = delayNode.configParameters?.find((p) => p.parameterName === "delayMs");
    expect(delayParam?.paramValue).toBe(5000);

    const orphanedParam = delayNode.configParameters?.find((p) => p.parameterName === "removedOldFeatureParam");
    expect(orphanedParam).toBeUndefined(); // Dropped cleanly
  });

  it("should migrate legacy unversioned full snapshots (v0) safely", () => {
    const canvas = deserializeWorkflowFromStorage(legacyWorkflowSnapshot, sampleRegistryNodes);

    expect(canvas.graphId).toBe("wf-legacy-999");
    expect(canvas.nodes.length).toBe(2);

    // Prompt node had execution result and stale selected state in v0
    const promptNode = canvas.nodes.find((n) => n.id === 1)!;
    expect(promptNode.selected).toBe(false);
    expect(promptNode.processing).toBe(false);
    expect(promptNode.result).toBeUndefined();
    expect(promptNode.nodeValue).toBe("Tell me a joke about programming");

    // LLM node had execution output stored in nodeValue in v0, but LLM has no body param
    // so stale execution output is cleared upon rehydration
    const llmNode = canvas.nodes.find((n) => n.id === 2)!;
    expect(llmNode.selected).toBe(false);
    expect(llmNode.processing).toBe(false);
    expect(llmNode.result).toBeUndefined();
    expect(llmNode.nodeValue).toBeUndefined();
    expect(llmNode.getConfigParameter!("model")?.paramValue).toBe("mistral:latest");
  });
});
