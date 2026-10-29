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

export const CANVAS_SCHEMA_VERSION = 1;

/**
 * Persisted configuration parameter value delta (Goal 1).
 * Immutable catalog definitions (sourceList, i18n, descriptions) are stripped.
 */
export interface StoredConfigParam {
  parameterName: string;
  paramValue: string | number | boolean | object | undefined | null;
}

/**
 * Socket representation used for persistence and dynamic socket tracking.
 */
export interface StoredSocket {
  id: number;
  title: string;
  type: "input" | "output";
  nodeId: number;
  dataType?: string;
}

/**
 * Minimal persisted node delta (Goal 1).
 * Presentation geometry and user configuration deltas are preserved.
 * Immutable NodeType definitions and runtime execution residues (nodeValue, processing, result) are stripped.
 */
export interface StoredNode {
  id: number;
  nodeType: string;
  title?: string;
  customTitle?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  configParameters?: StoredConfigParam[];
  dynamicSockets?: StoredSocket[];
}

/**
 * Wire/storage connection representation.
 */
export interface StoredConnection {
  fromSocket: number;
  toSocket: number;
  label?: string;
}

/**
 * Versioned workflow persistence format (Goal 1).
 */
export interface StoredWorkflow {
  schemaVersion: number;
  graphId: string;
  graphName: string | null;
  nodes: StoredNode[];
  connections: StoredConnection[];
  nextNodeId: number;
}

/**
 * Lean semantic config parameter representation for runtime execution (Goal 2).
 */
export interface RuntimeConfigParam {
  parameterName: string;
  parameterType: string;
  paramValue: unknown;
  defaultValue?: unknown;
  description?: string;
}

/**
 * Lean node representation sent to sidecar/LLM inference (Goal 2).
 * Visual coordinates (x, y, width, height) and UI presentation catalogs are stripped.
 */
export interface RuntimeNodePayload {
  id: number;
  nodeType: string;
  title: string;
  sockets: StoredSocket[];
  configParameters: RuntimeConfigParam[];
  dynamicSockets?: StoredSocket[];
}

/**
 * Lean workflow payload sent over WebSocket to sidecar for execution (Goal 2).
 */
export interface RuntimeWorkflowPayload {
  id: string;
  name: string;
  nodes: RuntimeNodePayload[];
  connections: StoredConnection[];
}

/**
 * Lean workspace payload sent over WebSocket to sidecar for execution (Goal 2).
 */
export interface RuntimeWorkspacePayload {
  id: string;
  name: string;
  description?: string;
  workflows: RuntimeWorkflowPayload[];
  [key: string]: unknown;
}
