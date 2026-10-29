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

import { BaseNode, ConfigParameterType, Connection, DataType, NodeValue, Socket } from "../types/NodeTypes";
import { CanvasState } from "../utils/storageUtils";
import { nodeRegistry } from "../types/NodeRegistry";
import { StoredSocket } from "./types";

export type NodeRegistrySource = Record<string, BaseNode> | { getNode: (type: string) => BaseNode | undefined };

function resolveTemplate(nodeType: string, registrySource?: NodeRegistrySource): BaseNode | undefined {
  if (registrySource) {
    if ("getNode" in registrySource && typeof registrySource.getNode === "function") {
      return registrySource.getNode(nodeType);
    }
    return (registrySource as Record<string, BaseNode>)[nodeType];
  }
  return nodeRegistry.getNode(nodeType);
}

function bindNodeHelpers(node: BaseNode): BaseNode {
  Object.defineProperties(node, {
    getConfigParameters: {
      value: function (): ConfigParameterType[] {
        return this.configParameters ?? [];
      },
      writable: true,
      configurable: true,
      enumerable: false,
    },
    getConfigParameter: {
      value: function (parameterName: string) {
        return (this.configParameters ?? []).find(
          (param: ConfigParameterType) => param.parameterName === parameterName
        );
      },
      writable: true,
      configurable: true,
      enumerable: false,
    },
    setConfigParameter: {
      value: function (parameterName: string, value: unknown) {
        const parameter = (this.configParameters ?? []).find(
          (param: ConfigParameterType) => param.parameterName === parameterName
        );
        if (parameter) {
          if (
            value !== undefined &&
            typeof value !== "string" &&
            typeof value !== "number" &&
            typeof value !== "boolean" &&
            typeof value !== "object"
          ) {
            throw new Error(
              `Invalid type for paramValue: ${typeof value}. Must be string, number, boolean, object, or undefined.`
            );
          }
          parameter.paramValue = value as string | number | boolean | undefined;
        }
      },
      writable: true,
      configurable: true,
      enumerable: false,
    },
  });

  return node;
}

/**
 * Rehydrates a stored node against the node registry.
 * Implements Option B for nodeValue: re-derives strictly from isNodeBodyContent param.
 */
export function rehydrateNode(
  rawNodeInput: unknown,
  registrySource?: NodeRegistrySource
): BaseNode {
  const rawNode = (rawNodeInput && typeof rawNodeInput === "object") ? (rawNodeInput as Record<string, unknown>) : {};
  const id = typeof rawNode.id === "number" ? rawNode.id : 0;
  const nodeType = typeof rawNode.nodeType === "string" ? rawNode.nodeType : "Generic";
  const template = resolveTemplate(nodeType, registrySource);

  if (template) {
    // 1. Reconstruct sockets
    let sockets: Socket[] = [];
    const storedSockets: StoredSocket[] | null =
      Array.isArray(rawNode.dynamicSockets) && rawNode.dynamicSockets.length > 0
        ? (rawNode.dynamicSockets as StoredSocket[])
        : Array.isArray(rawNode.sockets) && rawNode.sockets.length > 0
        ? (rawNode.sockets as StoredSocket[])
        : null;

    if (storedSockets) {
      sockets = storedSockets.map((s: StoredSocket, idx: number) => ({
        id: typeof s.id === "number" ? s.id : id * 100 + (idx + 1),
        title: s.title || `socket_${idx + 1}`,
        type: s.type === "output" ? "output" : "input",
        nodeId: id,
        dataType: s.dataType as DataType | undefined,
      }));
    } else if (Array.isArray(template.sockets)) {
      sockets = template.sockets.map((socket: Socket, idx: number) => ({
        ...socket,
        id: id * 100 + (idx + 1),
        nodeId: id,
      }));
    }

    // 2. Reconstruct config parameters & merge saved values
    let configParameters: ConfigParameterType[] | undefined = undefined;
    if (Array.isArray(template.configParameters) && template.configParameters.length > 0) {
      configParameters = template.configParameters.map((param) => {
        const cloned: ConfigParameterType = {
          ...param,
          paramValue: param.defaultValue,
        };

        // Find saved delta
        if (Array.isArray(rawNode.configParameters)) {
          const savedDelta = rawNode.configParameters.find(
            (p: unknown) => p && typeof p === "object" && (p as { parameterName?: string }).parameterName === param.parameterName
          ) as { paramValue?: string | number | boolean } | undefined;

          if (savedDelta && savedDelta.paramValue !== undefined) {
            cloned.paramValue = savedDelta.paramValue;
          }
        }
        return cloned;
      });
    }

    // 3. Option B for nodeValue: Re-derive strictly from param where isNodeBodyContent === true
    let derivedNodeValue: NodeValue | undefined = undefined;
    if (configParameters) {
      const bodyParam = configParameters.find((p) => p.isNodeBodyContent === true);
      if (bodyParam) {
        derivedNodeValue = (bodyParam.paramValue ?? bodyParam.defaultValue) as NodeValue;
      }
    }

    const customTitle = typeof rawNode.customTitle === "string"
      ? rawNode.customTitle
      : typeof rawNode.title === "string"
      ? rawNode.title
      : template.title;

    const rehydrated: BaseNode = {
      ...template,
      id,
      nodeType,
      category: template.category,
      title: customTitle,
      x: typeof rawNode.x === "number" ? rawNode.x : 0,
      y: typeof rawNode.y === "number" ? rawNode.y : 0,
      width: typeof rawNode.width === "number" ? rawNode.width : template.width ?? 200,
      height: typeof rawNode.height === "number" ? rawNode.height : template.height ?? 100,
      sockets,
      selected: false,
      processing: false,
    };

    if (template.description) {
      rehydrated.description = template.description;
    }
    if (template.i18n) {
      rehydrated.i18n = template.i18n;
    }
    if (configParameters && configParameters.length > 0) {
      rehydrated.configParameters = configParameters;
    }
    if (derivedNodeValue !== undefined) {
      rehydrated.nodeValue = derivedNodeValue;
    }

    return bindNodeHelpers(rehydrated);
  }

  // Fallback placeholder node for unregistered/unknown types
  console.warn(`Unregistered nodeType "${nodeType}" encountered during deserialization. Creating fallback node.`);

  const rawSocketList = Array.isArray(rawNode.sockets)
    ? rawNode.sockets
    : Array.isArray(rawNode.dynamicSockets)
    ? rawNode.dynamicSockets
    : [];

  const fallbackSockets: Socket[] = rawSocketList.map((s: unknown, idx: number) => {
    const socketObj = (s && typeof s === "object") ? (s as Record<string, unknown>) : {};
    return {
      id: typeof socketObj.id === "number" ? socketObj.id : id * 100 + (idx + 1),
      title: typeof socketObj.title === "string" ? socketObj.title : `socket_${idx + 1}`,
      type: socketObj.type === "output" ? "output" : "input",
      nodeId: id,
      dataType: typeof socketObj.dataType === "string" ? (socketObj.dataType as DataType) : undefined,
    };
  });

  const fallbackParams: ConfigParameterType[] | undefined = Array.isArray(rawNode.configParameters)
    ? rawNode.configParameters.map((p: unknown) => {
        const paramObj = (p && typeof p === "object") ? (p as Record<string, unknown>) : {};
        return {
          parameterName: typeof paramObj.parameterName === "string" ? paramObj.parameterName : "param",
          parameterType: "string" as const,
          defaultValue: "",
          valueSource: "UserInput" as const,
          paramValue: paramObj.paramValue as string | number | boolean | undefined,
          description: "",
        };
      })
    : undefined;

  const fallbackTitle = typeof rawNode.customTitle === "string"
    ? rawNode.customTitle
    : typeof rawNode.title === "string"
    ? rawNode.title
    : nodeType;

  const fallbackNode: BaseNode = {
    id,
    nodeType,
    category: typeof rawNode.category === "string" ? rawNode.category : "Unknown",
    title: fallbackTitle,
    x: typeof rawNode.x === "number" ? rawNode.x : 0,
    y: typeof rawNode.y === "number" ? rawNode.y : 0,
    width: typeof rawNode.width === "number" ? rawNode.width : 200,
    height: typeof rawNode.height === "number" ? rawNode.height : 100,
    sockets: fallbackSockets,
    selected: false,
    processing: false,
  };

  if (typeof rawNode.description === "string") {
    fallbackNode.description = rawNode.description;
  }
  if (fallbackParams && fallbackParams.length > 0) {
    fallbackNode.configParameters = fallbackParams;
  }
  if (rawNode.nodeValue !== undefined) {
    fallbackNode.nodeValue = rawNode.nodeValue as NodeValue;
  }

  return bindNodeHelpers(fallbackNode);
}

/**
 * Normalizes connections and filters invalid or orphaned connections.
 */
function normalizeConnections(rawConnections: unknown, validSocketIds: Set<number>): Connection[] {
  if (!Array.isArray(rawConnections)) return [];

  const result: Connection[] = [];
  for (const c of rawConnections) {
    if (!c || typeof c !== "object") continue;
    const connObj = c as Record<string, unknown>;
    const fromSocket = typeof connObj.fromSocket === "number" ? connObj.fromSocket : null;
    const toSocket = typeof connObj.toSocket === "number" ? connObj.toSocket : null;
    if (fromSocket === null || toSocket === null) continue;

    if (validSocketIds.size > 0 && (!validSocketIds.has(fromSocket) || !validSocketIds.has(toSocket))) {
      console.warn(`Connection from ${fromSocket} to ${toSocket} references missing socket.`);
    }

    result.push({
      fromSocket,
      toSocket,
      ...(typeof connObj.label === "string" ? { label: connObj.label } : {}),
    });
  }

  return result;
}

/**
 * Deserializes storage content into a fully usable CanvasState.
 * Supports StoredWorkflow (v1), legacy unversioned files (v0), and wrapped WorkflowFile objects.
 */
export function deserializeCanvasFromStorage(
  raw: unknown,
  registrySource?: NodeRegistrySource
): CanvasState {
  if (!raw || typeof raw !== "object") {
    return {
      graphId: "",
      graphName: null,
      nodes: [],
      connections: [],
      nextNodeId: 1,
    };
  }

  const root = raw as Record<string, unknown>;
  const obj: Record<string, unknown> = (root.canvasState && typeof root.canvasState === "object")
    ? (root.canvasState as Record<string, unknown>)
    : root;

  const rawNodes = Array.isArray(obj.nodes) ? obj.nodes : [];
  const nodes: BaseNode[] = rawNodes.map((n: unknown) => rehydrateNode(n, registrySource));

  const validSocketIds = new Set<number>();
  for (const node of nodes) {
    if (Array.isArray(node.sockets)) {
      for (const s of node.sockets) {
        validSocketIds.add(s.id);
      }
    }
  }

  const connections = normalizeConnections(obj.connections, validSocketIds);

  const nextNodeId = typeof obj.nextNodeId === "number"
    ? obj.nextNodeId
    : nodes.reduce((max, n) => Math.max(max, n.id), 0) + 1;

  const graphId = typeof obj.graphId === "string"
    ? obj.graphId
    : typeof root.id === "string"
    ? root.id
    : "";

  const graphName = (typeof obj.graphName === "string" || obj.graphName === null)
    ? (obj.graphName as string | null)
    : typeof root.name === "string"
    ? root.name
    : null;

  return {
    graphId,
    graphName,
    nodes,
    connections,
    nextNodeId,
  };
}

/**
 * Alias for deserializeCanvasFromStorage for full workflow deserialization.
 */
export function deserializeWorkflowFromStorage(
  raw: unknown,
  registrySource?: NodeRegistrySource
): CanvasState {
  return deserializeCanvasFromStorage(raw, registrySource);
}
