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

import { WorkspaceData } from "../types/Types";
import { getWorkflow } from "./runtimeUtils";
import {
  buildWorkflowRuntimePayload,
  pruneWorkspaceByTaskDependencies,
} from "../../flow/serialization";

export async function enrichWorkspace(
  ws: WorkspaceData
): Promise<Record<string, unknown>> {
  // Prune unreferenced workflows, agents, and MCP tools that lack a dependency in defined tasks (Goal 2)
  const prunedWs = pruneWorkspaceByTaskDependencies(
    ws as unknown as Record<string, unknown>
  ) as unknown as WorkspaceData;

  if (!prunedWs.workflows?.length) {
    return { ...prunedWs };
  }

  const fullWorkflows = await Promise.all(
    prunedWs.workflows.map(async (wf) => {
      const fullWf = await getWorkflow(wf.id);
      const source = fullWf?.canvasState
        ? fullWf
        : (wf as unknown as { canvasState?: unknown; nodes?: unknown })?.canvasState ||
          (wf as unknown as { canvasState?: unknown; nodes?: unknown })?.nodes
        ? wf
        : null;

      if (source) {
        const runtimeWorkflow = buildWorkflowRuntimePayload(source);
        return {
          ...wf,
          nodes: runtimeWorkflow.nodes,
          connections: runtimeWorkflow.connections,
        };
      }
      return wf;
    })
  );

  return { ...prunedWs, workflows: fullWorkflows };
}
