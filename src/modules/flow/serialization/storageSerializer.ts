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

import { BaseNode, ConfigParameterType, Connection, Socket } from "../types/NodeTypes";
import { CanvasState } from "../utils/storageUtils";
import {
  CANVAS_SCHEMA_VERSION,
  StoredConfigParam,
  StoredConnection,
  StoredNode,
  StoredSocket,
  StoredWorkflow,
} from "./types";

/**
 * Sanitizes a single node into a minimal stored node delta (Goal 1).
 * Strips immutable NodeType definitions (category, description, sourceList, i18n, etc.)
 * and transient runtime residue (nodeValue, processing, result, selected).
 */
export function sanitizeNodeForStorage(node: BaseNode): StoredNode {
  const configParameters: StoredConfigParam[] = [];
  const params: ConfigParameterType[] = node.configParameters ?? [];

  for (const p of params) {
    if (p.paramValue !== undefined && p.paramValue !== null) {
      configParameters.push({
        parameterName: p.parameterName,
        paramValue: p.paramValue,
      });
    }
  }

  // Preserve dynamic sockets if present
  let dynamicSockets: StoredSocket[] | undefined = undefined;
  if (Array.isArray(node.sockets) && node.sockets.length > 0) {
    // If node explicitly has dynamic sockets recorded or customized
    dynamicSockets = node.sockets.map((s: Socket) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      nodeId: s.nodeId,
      dataType: s.dataType,
    }));
  }

  const storedNode: StoredNode = {
    id: node.id,
    nodeType: node.nodeType,
    title: node.title,
    customTitle: node.customTitle || node.title,
    x: typeof node.x === "number" ? node.x : 0,
    y: typeof node.y === "number" ? node.y : 0,
    width: typeof node.width === "number" ? node.width : 200,
    height: typeof node.height === "number" ? node.height : 100,
  };

  if (configParameters.length > 0) {
    storedNode.configParameters = configParameters;
  }

  if (dynamicSockets && dynamicSockets.length > 0) {
    storedNode.dynamicSockets = dynamicSockets;
  }

  return storedNode;
}

/**
 * Serializes a CanvasState into the versioned StoredWorkflow format (Goal 1).
 */
export function serializeCanvasForStorage(canvasState: CanvasState): StoredWorkflow {
  const nodes = (canvasState.nodes ?? []).map((node) => sanitizeNodeForStorage(node));
  const connections: StoredConnection[] = (canvasState.connections ?? []).map((c: Connection) => ({
    fromSocket: c.fromSocket,
    toSocket: c.toSocket,
    ...(c.label ? { label: c.label } : {}),
  }));

  return {
    schemaVersion: CANVAS_SCHEMA_VERSION,
    graphId: canvasState.graphId || "",
    graphName: canvasState.graphName ?? null,
    nodes,
    connections,
    nextNodeId: typeof canvasState.nextNodeId === "number" ? canvasState.nextNodeId : nodes.length + 1,
  };
}

/**
 * Serializes either a direct CanvasState or a wrapped WorkflowFile into StoredWorkflow.
 */
export function serializeWorkflowForStorage(
  rawWorkflow: Record<string, unknown> | null | undefined
): StoredWorkflow {
  if (!rawWorkflow || typeof rawWorkflow !== "object") {
    return {
      schemaVersion: CANVAS_SCHEMA_VERSION,
      graphId: "",
      graphName: null,
      nodes: [],
      connections: [],
      nextNodeId: 1,
    };
  }

  const canvasState: CanvasState = (rawWorkflow.canvasState as CanvasState) ?? (rawWorkflow as unknown as CanvasState);
  const serialized = serializeCanvasForStorage(canvasState);

  // If the parent workflow file had a name or id, ensure consistency
  if (typeof rawWorkflow.name === "string" && !serialized.graphName) {
    serialized.graphName = rawWorkflow.name;
  }
  if (typeof rawWorkflow.id === "string" && !serialized.graphId) {
    serialized.graphId = rawWorkflow.id;
  }

  return serialized;
}
