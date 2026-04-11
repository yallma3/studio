/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, {
  useState,
  useRef,
  MouseEvent,
  useEffect,
  useCallback,
} from "react";
import { NodeComponent } from "./components/NodeComponent";
import { BaseNode, NodeType } from "./types/NodeTypes";
import CanvasContextMenu from "./components/CanvasContextMenu";
import NodeContextMenu from "./components/NodeContextMenu";
import NodeEditPanel from "./components/NodeEditPanel";
import GraphNameDialog from "./components/GraphNameDialog";
import {
  Play,
  Save,
  ArrowLeft,
  Menu,
  CheckCircle,
  AlertCircle,
  FileDown,
  Code,
  Square,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { exportFlowRunner } from "./utils/exportFlowRunner";
import { useTranslation } from "react-i18next";
import { createJson } from "./utils/flowRuntime";
import { screenToCanvas } from "./utils/canvasTransforms";
import {
  findSocketById,
  getNodeBySocketId,
  getSocketPosition,
} from "./utils/socketUtils";
import { saveCanvasState, CanvasState } from "./utils/storageUtils";
import { generateConnectionPath } from "./utils/connectionUtils";
import { duplicateNode } from "./utils/nodeOperations";
import { useCanvasState } from "./hooks/useCanvasState";
import { useCanvasTransform } from "./hooks/useCanvasTransform";
import { useConnectionDrag } from "./hooks/useConnectionDrag";
import { useContextMenu } from "./hooks/useContextMenu";
import { ResultDialog } from "./components/ResultDialog";
import { WorkflowFile } from "../workspace/utils/workflowStorageUtils";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { sidecarClient, SidecarCommand } from "../api/SidecarClient";

interface IterationEntry {
  index: number;
  results: Record<string, unknown>;
  timestamp: number;
}

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  isClosing?: boolean;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  isClosing = false,
}) => {
  useEffect(() => {
    if (!isClosing) {
      const autoHideTimer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(autoHideTimer);
    }
  }, [onClose, isClosing]);

  return (
    <div
      className={`
        fixed bottom-8 left-1/2 transform -translate-x-1/2 
        py-2 px-4 rounded-md shadow-lg flex items-center gap-2 z-50
        transition-all duration-200 ease-out
        ${isClosing ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}
        ${
          type === "success"
            ? "bg-[#27272A] text-[#FFC72C]"
            : "bg-[#272724] text-red-400"
        }
      `}
    >
      {type === "success" ? (
        <CheckCircle size={18} className="text-green-400" />
      ) : (
        <AlertCircle size={18} className="text-red-400" />
      )}
      <span>{message}</span>
    </div>
  );
};

interface IterationPanelProps {
  iterations: IterationEntry[];
  nodes: NodeType[];
  onClose: () => void;
}

const IterationPanel: React.FC<IterationPanelProps> = ({
  iterations,
  nodes,
  onClose,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    iterations.length > 0 ? iterations[iterations.length - 1].index : null
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (iterations.length > 0) {
      setExpandedIndex(iterations[iterations.length - 1].index);
    }
  }, [iterations.length]);

  const getNodeTitle = (nodeId: string) => {
    const node = nodes.find((n) => String(n.id) === nodeId);
    return node?.title ?? `Node ${nodeId}`;
  };

  const formatValue = (val: unknown): string => {
    if (val === undefined || val === null) return "—";
    if (typeof val === "string") return val.length > 120 ? val.slice(0, 120) + "…" : val;
    const str = JSON.stringify(val, null, 2);
    return str.length > 300 ? str.slice(0, 300) + "…" : str;
  };

  return (
    <div
      className="fixed right-0 top-0 h-full w-[380px] bg-[#0D0D0D] border-l border-[#FFC72C]/20 z-40 flex flex-col shadow-2xl"
      style={{ zIndex: 9998 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#FFC72C]/20 bg-[#121212]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#FFC72C] animate-pulse shadow-[0_0_8px_rgba(255,199,44,0.7)]" />
          <span className="text-[#FFC72C] font-bold text-sm">Loop Iterations</span>
          <span className="bg-[#FFC72C]/10 text-[#FFC72C] text-xs px-2 py-0.5 rounded font-mono">
            {iterations.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-[#222]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {iterations.length === 0 ? (
          <div className="text-center text-gray-600 text-sm mt-8">
            Waiting for iterations…
          </div>
        ) : (
          iterations.map((iter) => {
            const isExpanded = expandedIndex === iter.index;
            return (
              <div
                key={iter.index}
                className="border border-[#FFC72C]/20 rounded-md overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-3 py-2 bg-[#FFC72C]/10 hover:bg-[#FFC72C]/15 transition-colors text-left"
                  onClick={() => setExpandedIndex(isExpanded ? null : iter.index)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#FFC72C] font-mono font-bold text-xs">
                      #{iter.index + 1}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(iter.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={13} className="text-[#FFC72C]/60" />
                  ) : (
                    <ChevronDown size={13} className="text-[#FFC72C]/60" />
                  )}
                </button>

                {isExpanded && (
                  <div className="divide-y divide-[#FFC72C]/10">
                    {Object.entries(iter.results)
                      .sort(([aId], [bId]) => {
                        const aNode = nodes.find((n) => String(n.id) === aId);
                        const bNode = nodes.find((n) => String(n.id) === bId);
                        return (aNode?.x ?? 0) - (bNode?.x ?? 0);
                      })
                      .map(([nodeId, value]) => (
                        <div key={nodeId} className="px-3 py-2 bg-[#0f0f0f]">
                          <div className="text-[10px] text-[#FFC72C]/50 font-mono mb-1 uppercase">
                            {getNodeTitle(nodeId)}
                          </div>
                          <pre className="text-[11px] text-[#FFC72C]/80 font-mono whitespace-pre-wrap break-all leading-relaxed">
                            {formatValue(value)}
                          </pre>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

const NodeCanvas: React.FC<{
  graph: CanvasState | null;
  onReturnToHome: (updatedCanvasState?: CanvasState) => void;
  workflowMeta?: WorkflowFile | null;
}> = ({ graph, onReturnToHome, workflowMeta }) => {
  const { t } = useTranslation();

  const {
    nodes,
    setNodes,
    connections,
    setConnections,
    nextNodeId,
    removeNode,
  } = useCanvasState(graph?.nodes, graph?.connections);

  const {
    transform,
    isPanningActive,
    handleWheel,
    startPanning,
    updatePanning,
    endPanning,
    resetView,
    zoomIn,
    zoomOut,
  } = useCanvasTransform();

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedNodeIds, setSelectedNodeIds] = useState<number[]>([]);
  const draggingNode = useRef<number | null>(null);
  const offset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<NodeType | null>(null);
  const [isPanelClosing, setIsPanelClosing] = useState<boolean>(false);
  const [graphNameDialogOpen, setGraphNameDialogOpen] = useState<boolean>(false);
  const [grapResultDialogOpen, setResultDialogOpen] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  const [iterations, setIterations] = useState<IterationEntry[]>([]);
  const [showIterationPanel, setShowIterationPanel] = useState<boolean>(false);

  const setNodesRef = useRef(setNodes);
  const setIterationsRef = useRef(setIterations);
  const setShowIterationPanelRef = useRef(setShowIterationPanel);
  const setExecutionStatusRef = useRef<(v: { isExecuting: boolean; progress: number; total: number }) => void>(() => {});
  const showToastRef = useRef<(msg: string, type: "success" | "error") => void>(() => {});
  const workflowMetaRef = useRef(workflowMeta);
  const tRef = useRef(t);

  setNodesRef.current = setNodes;
  setIterationsRef.current = setIterations;
  setShowIterationPanelRef.current = setShowIterationPanel;
  workflowMetaRef.current = workflowMeta;
  tRef.current = t;

  const {
    dragConnection,
    handleSocketDragStart,
    handleSocketDragMove,
    handleSocketDragEnd,
  } = useConnectionDrag(nodes, connections, setConnections, transform, mousePosition);

  const {
    contextMenu,
    setContextMenu,
    handleContextMenu,
    handleNodeContextMenu,
    handleAddNodeFromContextMenu,
  } = useContextMenu(setNodes, setSelectedNodeIds, transform, nextNodeId);

  const [executionStatus, setExecutionStatus] = useState<{
    isExecuting: boolean;
    progress: number;
    total: number;
  }>({
    isExecuting: false,
    progress: 0,
    total: 0,
  });

  setExecutionStatusRef.current = setExecutionStatus;

  const [fileMenuOpen, setFileMenuOpen] = useState<boolean>(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        fileMenuRef.current &&
        !fileMenuRef.current.contains(event.target as HTMLElement)
      ) {
        setFileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fileMenuRef]);

  const toggleFileMenu = () => setFileMenuOpen(!fileMenuOpen);

  const handleCloseEditPanel = useCallback(() => {
    setIsPanelClosing(true);
    setTimeout(() => {
      setEditingNode(null);
      setIsPanelClosing(false);
    }, 300);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fileMenuOpen) { setFileMenuOpen(false); return; }
        if (editingNode) { handleCloseEditPanel(); return; }
        setSelectedNodeIds([]);
        setNodes((nodes) => nodes.map((node) => ({ ...node, selected: false })));
        setContextMenu((prev) => ({ ...prev, visible: false, subMenu: null }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingNode, setContextMenu, setNodes, handleCloseEditPanel, fileMenuOpen]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>, id: number) => {
    draggingNode.current = id;
    const node = nodes.find((n) => n.id === id);
    if (node) {
      if (e.shiftKey) {
        if (selectedNodeIds.includes(id)) {
          setSelectedNodeIds(selectedNodeIds.filter((nodeId) => nodeId !== id));
          setNodes(nodes.map((n) => (n.id === id ? { ...n, selected: false } : n)));
        } else {
          setSelectedNodeIds([...selectedNodeIds, id]);
          setNodes(nodes.map((n) => (n.id === id ? { ...n, selected: true } : n)));
        }
      } else if (!selectedNodeIds.includes(id)) {
        setSelectedNodeIds([id]);
        setNodes(nodes.map((n) => ({ ...n, selected: n.id === id })));
      }
      const canvasCoords = screenToCanvas(e.clientX, e.clientY, transform);
      offset.current = { x: canvasCoords.x - node.x, y: canvasCoords.y - node.y };
    }
  };

  const handleContextMenuClick = (action: string, e: MouseEvent) => {
    e.stopPropagation();
    switch (action) {
      case "addNode": setContextMenu((prev) => ({ ...prev, subMenu: "addNode" })); break;
      case "settings": setContextMenu((prev) => ({ ...prev, subMenu: "settings" })); break;
      case "clearView":
        setNodes([]); setConnections([]);
        setContextMenu((prev) => ({ ...prev, visible: false, subMenu: null }));
        break;
      case "copyNode": handleCopyNode(); setContextMenu((prev) => ({ ...prev, visible: false, subMenu: null })); break;
      case "editNode": handleEditNode(); setContextMenu((prev) => ({ ...prev, visible: false, subMenu: null })); break;
      case "duplicateNode": handleDuplicateNode(); setContextMenu((prev) => ({ ...prev, visible: false, subMenu: null })); break;
      case "deleteNode": handleDeleteNode(); setContextMenu((prev) => ({ ...prev, visible: false, subMenu: null })); break;
      default: setContextMenu((prev) => ({ ...prev, visible: false, subMenu: null })); break;
    }
  };

  const handleCopyNode = () => {
    if (!contextMenu.targetNodeId) return;
    const nodeToCopy = nodes.find((n) => n.id === contextMenu.targetNodeId);
    if (nodeToCopy) {
      const nodeData = JSON.stringify({ type: nodeToCopy.nodeType, value: nodeToCopy.nodeValue });
      navigator.clipboard.writeText(nodeData).catch((err) => console.error("Failed to copy:", err));
    }
  };

  const handleEditNode = () => {
    if (!contextMenu.targetNodeId) return;
    const nodeToEdit = nodes.find((n) => n.id === contextMenu.targetNodeId);
    if (nodeToEdit) setEditingNode(nodeToEdit);
  };

  const handleShowResult = (node: NodeType) => {
    setSelectedNode(node.id);
    setResultDialogOpen(true);
  };

  const handleDuplicateNode = () => {
    if (!contextMenu.targetNodeId) return;
    const nodeToDuplicate = nodes.find((n) => n.id === contextMenu.targetNodeId);
    if (nodeToDuplicate) {
      const newId = nextNodeId.current++;
      const newNode = duplicateNode(nodeToDuplicate, newId);
      if (newNode) setNodes((prev) => [...prev, newNode]);
      setSelectedNodeIds([newId]);
      setNodes((prev) => prev.map((n) => ({ ...n, selected: n.id === newId })));
    }
  };

  const handleDeleteNode = () => {
    if (!contextMenu.targetNodeId) return;
    removeNode(contextMenu.targetNodeId);
  };

  const handleCanvasContextMenuAction = (action: string, e: MouseEvent) => {
    e.stopPropagation();
    switch (action) {
      case "clearView":
        setNodes([]); setConnections([]);
        setContextMenu((prev) => ({ ...prev, visible: false, subMenu: null }));
        break;
      default:
        setContextMenu((prev) => ({ ...prev, visible: false, subMenu: null }));
        break;
    }
  };

  const handleCanvasMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      if (!e.shiftKey && selectedNodeIds.length > 0) {
        setSelectedNodeIds([]);
        setNodes(nodes.map((node) => ({ ...node, selected: false })));
      }
      startPanning(e);
      e.preventDefault();
    }
  };

  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;
    if (contextMenu.targetNodeId !== undefined) {
      return (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onContextMenuAction={handleContextMenuClick}
        />
      );
    }
    return (
      <CanvasContextMenu
        contextMenu={contextMenu}
        onAddNode={handleAddNodeFromContextMenu}
        onContextMenuAction={handleCanvasContextMenuAction}
      />
    );
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    updatePanning(e);
    if (draggingNode.current === null) return;
    const canvasCoords = screenToCanvas(e.clientX, e.clientY, transform);
    const draggedNode = nodes.find((n) => n.id === draggingNode.current);
    if (!draggedNode) return;
    const deltaX = canvasCoords.x - offset.current.x - draggedNode.x;
    const deltaY = canvasCoords.y - offset.current.y - draggedNode.y;
    setNodes(nodes.map((n) => {
      if (selectedNodeIds.includes(n.id) || n.id === draggingNode.current) {
        return { ...n, x: n.x + deltaX, y: n.y + deltaY };
      }
      return n;
    }));
  };

  const handleCanvasMouseUp = () => {
    endPanning();
    draggingNode.current = null;
    handleSocketDragEnd();
  };

  const handleEditNodeFromComponent = (nodeId: number) => {
    const nodeToEdit = nodes.find((n) => n.id === nodeId);
    if (nodeToEdit) setEditingNode(nodeToEdit);
  };

  const exportAsJSPackage = () => {
    exportFlowRunner(nodes, connections, false);
    setFileMenuOpen(false);
  };

  const exportAsJson = async () => {
    if (!graph) return;
    try {
      const canvasState: CanvasState = {
        graphId: graph.graphId,
        graphName: graph.graphName,
        nodes,
        connections,
        nextNodeId: nextNodeId.current,
      };
      let exportData: WorkflowFile;
      if (workflowMeta) {
        exportData = { ...workflowMeta, canvasState, updatedAt: Date.now() };
      } else {
        exportData = {
          id: canvasState.graphId,
          name: canvasState.graphName || "Exported Workflow",
          description: "Workflow exported from canvas",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          canvasState,
        };
      }
      const filePath = await save({
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: `${exportData.name || "workflow"}.json`,
      });
      if (!filePath) return;
      await writeTextFile(filePath, JSON.stringify(exportData, null, 2));
      showToast(t("canvas.jsonExportSuccess"), "success");
      setFileMenuOpen(false);
    } catch (error) {
      console.error("Error exporting graph as JSON:", error);
      showToast(t("canvas.jsonExportError", { message: error instanceof Error ? error.message : String(error) }), "error");
    }
  };

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
    isClosing: boolean;
  } | null>(null);
  const [pendingToast, setPendingToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (pendingToast && (!toast || toast.isClosing)) {
      const timer = setTimeout(() => {
        setToast({ visible: true, message: pendingToast.message, type: pendingToast.type, isClosing: false });
        setPendingToast(null);
      }, toast ? 200 : 0);
      return () => clearTimeout(timer);
    }
  }, [toast, pendingToast]);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      if (toast && !toast.isClosing) {
        setToast((prev) => (prev ? { ...prev, isClosing: true } : null));
        setPendingToast({ message, type });
      } else if (!toast) {
        setToast({ visible: true, message, type, isClosing: false });
      } else {
        setPendingToast({ message, type });
      }
    },
    [toast]
  );

  showToastRef.current = showToast;

  useEffect(() => {
    const handleSidecarCommand = (command: SidecarCommand) => {
      if (command.type === "workflow_iteration") {
        const data = command.data as {
          workflowId: string;
          iterationIndex: number;
          results: Record<string, unknown>;
        };
        setNodesRef.current((prevNodes) =>
          prevNodes.map((node) => {
            const result = data.results[String(node.id)];
            if (typeof result !== "undefined") {
              return { ...node, result: result as typeof node.result };
            }
            return node;
          })
        );
        setIterationsRef.current((prev) => [
          ...prev,
          { index: data.iterationIndex, results: data.results, timestamp: Date.now() },
        ]);
        setShowIterationPanelRef.current(true);
        return;
      }

      if (command.type === "workflow_result" && command.id == workflowMetaRef.current?.id) {
        const results =
          command.data &&
          typeof command.data === "object" &&
          "results" in command.data
            ? (command.data as { results: Record<string, unknown> }).results
            : undefined;
        if (results) {
          setNodesRef.current((prevNodes) =>
            prevNodes.map((node) => {
              const result = results[String(node.id)];
              if (typeof result !== "undefined") {
                return { ...node, result: result as typeof node.result };
              }
              return node;
            })
          );
        }
        setExecutionStatusRef.current({ isExecuting: false, progress: 0, total: 0 });
        showToastRef.current(tRef.current("canvas.executionComplete"), "success");
      }

      if (command.type === "message") {
        if (command.data && typeof command.data === "string") {
          console.log("Sidecar message:", command.data);
        }
      }
    };

    sidecarClient.onCommand(handleSidecarCommand);
    return () => sidecarClient.offCommand(handleSidecarCommand);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hideToast = () => {
    if (toast && !toast.isClosing) {
      setToast((prev) => (prev ? { ...prev, isClosing: true } : null));
      setTimeout(() => setToast(null), 200);
    } else {
      setToast(null);
    }
  };

  const handleSaveCanvasState = async (graphName?: string) => {
    if (!graph) return;
    try {
      const nameToUse = graphName || graph?.graphName;
      if (!nameToUse) { setGraphNameDialogOpen(true); return; }
      await saveCanvasState(graph?.graphId, nodes, connections, nextNodeId.current, nameToUse);
      setFileMenuOpen(false);
      showToast(t("canvas.saveSuccess", { name: nameToUse }), "success");
    } catch (error) {
      console.error("Error saving canvas state:", error);
      showToast(t("canvas.saveError", { message: error instanceof Error ? error.message : String(error) }), "error");
    }
  };

  const handleSaveWithName = async (name: string) => {
    setGraphNameDialogOpen(false);
    if (graph) graph.graphName = name;
    await handleSaveCanvasState(name);
  };

  const executeFlow = async () => {
    if (executionStatus.isExecuting) return;
    if (graph && workflowMeta) {
      setIterations([]);
      setShowIterationPanel(false);
      setExecutionStatus({ isExecuting: true, progress: 0, total: 1 });
      const json = createJson(workflowMeta, nodes, connections);
      const message: SidecarCommand = {
        id: crypto.randomUUID(),
        type: "run_workflow",
        data: JSON.stringify(json),
        timestamp: new Date().toISOString(),
      };
      sidecarClient.sendMessage(message);
    }
  };

  const stopFlow = () => {
    if (!executionStatus.isExecuting || !workflowMeta) return;
    const message: SidecarCommand = {
      id: crypto.randomUUID(),
      type: "stop_workflow",
      data: JSON.stringify({ workflowId: workflowMeta.id }),
      timestamp: new Date().toISOString(),
    };
    sidecarClient.sendMessage(message);
    setExecutionStatus({ isExecuting: false, progress: 0, total: 0 });
    setIterations([]);
    setShowIterationPanel(false);
    showToast("Workflow stopped.", "success");
  };

  const canvasRightShift = showIterationPanel ? 380 : 0;

  return (
    <>
      {showIterationPanel && (
        <IterationPanel
          iterations={iterations}
          nodes={nodes}
          onClose={() => setShowIterationPanel(false)}
        />
      )}

      <div
        className="bg-black/98"
        dir="ltr"
        style={{
          width: `calc(100vw - ${canvasRightShift}px)`,
          height: "100vh",
          position: "relative",
          overflow: "hidden",
          cursor: isPanningActive ? "grabbing" : "grab",
          pointerEvents: editingNode || isPanelClosing ? "none" : "auto",
        }}
        onMouseMove={(e) => {
          if (editingNode || isPanelClosing) return;
          handleMouseMove(e);
          handleSocketDragMove(e);
        }}
        onMouseDown={(e) => {
          if (editingNode || isPanelClosing) return;
          handleCanvasMouseDown(e);
        }}
        onMouseUp={() => {
          if (editingNode || isPanelClosing) return;
          handleCanvasMouseUp();
        }}
        onWheel={(e) => {
          if (editingNode || isPanelClosing) return;
          handleWheel(e);
        }}
        onContextMenu={(e) => {
          if (editingNode || isPanelClosing) return;
          handleContextMenu(e);
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
            backgroundPosition: `${transform.translateX}px ${transform.translateY}px`,
            backgroundAttachment: "local",
            pointerEvents: "none",
          }}
        />

        <div className="absolute top-5 left-5 flex gap-2 z-20 items-center justify-center">
          <button
            onClick={() => {
              if (graph) {
                const updatedCanvasState: CanvasState = {
                  ...graph,
                  nodes,
                  connections,
                  nextNodeId: nextNodeId.current,
                };
                onReturnToHome(updatedCanvasState);
              } else {
                onReturnToHome();
              }
            }}
            className="bg-[#FFC72C] hover:bg-[#FFB300] cursor-pointer transition-colors duration-200 text-black font-medium p-2 rounded-md flex items-center justify-center z-20"
            aria-label={t("canvas.returnToHome")}
            title={t("canvas.returnToHome")}
          >
            <ArrowLeft size={18} className="ltr-icon" />
          </button>
          <p className="text-gray-400 text-xs">{graph?.graphName || graph?.graphId}</p>
        </div>

        <div className="absolute top-5 right-5 flex gap-2 z-20 items-center">
          {iterations.length > 0 && !showIterationPanel && (
            <button
              onClick={() => setShowIterationPanel(true)}
              className="flex items-center gap-1.5 bg-[#FFC72C]/10 border border-[#FFC72C]/30 text-[#FFC72C] text-xs font-mono px-3 py-2 rounded-md hover:bg-[#FFC72C]/20 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[#FFC72C]" />
              {iterations.length} iterations
            </button>
          )}

          {executionStatus.isExecuting ? (
            <button
              onClick={stopFlow}
              className="bg-red-600 hover:bg-red-500 cursor-pointer px-4 transition-colors duration-200 text-white font-medium p-2 rounded-md flex items-center justify-center z-20"
            >
              <Square size={16} className="mr-1.5 fill-white" />
              Stop
            </button>
          ) : (
            <button
              className="bg-[#FFC72C] hover:bg-[#FFB300] cursor-pointer px-4 transition-colors duration-200 text-black font-medium p-2 rounded-md flex items-center justify-center z-20"
              onClick={executeFlow}
            >
              <Play size={18} className="ltr-icon mr-1" />
              {t("canvas.run")}
            </button>
          )}

          <div className="relative" ref={fileMenuRef}>
            <button
              onClick={toggleFileMenu}
              className="bg-[#666] hover:bg-[#444] cursor-pointer transition-colors duration-200 text-white font-bold p-4 rounded-md flex items-center justify-center z-20"
            >
              <Menu size={18} className="font-bold" />
            </button>

            {fileMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-[#111] ring-1 ring-black/50 focus:outline-none z-30 border border-[#FFB30055] origin-top-right animate-dropdown">
                <div className="py-1" role="menu">
                  <button
                    onClick={() => handleSaveCanvasState()}
                    className="w-full text-left block px-4 py-2 text-sm text-white hover:bg-[#FFB30033] transition-colors"
                  >
                    <Save size={16} className="ltr-icon inline-block mr-2 text-[#FFC72C]" />
                    {t("canvas.save")}
                  </button>
                  <button
                    onClick={exportAsJson}
                    className="w-full text-left block px-4 py-2 text-sm text-white hover:bg-[#FFB30033] transition-colors"
                  >
                    <FileDown size={16} className="ltr-icon inline-block mr-2 text-[#FFC72C]" />
                    {t("canvas.exportToJson")}
                  </button>
                  <button
                    onClick={exportAsJSPackage}
                    className="w-full text-left block px-4 py-2 text-sm text-white hover:bg-[#FFB30033] transition-colors"
                  >
                    <Code size={16} className="ltr-icon inline-block mr-2 text-[#FFC72C]" />
                    {t("canvas.export")}
                  </button>
                </div>
                <div className="border-t border-gray-800" />
              </div>
            )}
          </div>
        </div>

        {renderContextMenu()}

        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            width: "100%",
            height: "100%",
            overflow: "visible",
            zIndex: 1,
          }}
        >
          {connections.map((connection) => {
            const fromSocket = findSocketById(nodes, connection.fromSocket);
            const toSocket = findSocketById(nodes, connection.toSocket);
            const fromNode = getNodeBySocketId(nodes, connection.fromSocket);
            const toNode = getNodeBySocketId(nodes, connection.toSocket);
            if (!fromNode || !toNode || !fromSocket || !toSocket) return null;
            const fromPos = getSocketPosition(fromNode, fromSocket, transform);
            const toPos = getSocketPosition(toNode, toSocket, transform);
            const path = generateConnectionPath(fromPos.x, fromPos.y, toPos.x, toPos.y);
            return (
              <path
                key={`connection-${connection.fromSocket}-${connection.toSocket}`}
                d={path}
                fill="none"
                stroke="#FFC72C"
                strokeWidth="2"
              />
            );
          })}
          {dragConnection && (
            <path
              d={generateConnectionPath(
                dragConnection.fromX,
                dragConnection.fromY,
                dragConnection.toX,
                dragConnection.toY
              )}
              fill="none"
              stroke="#FFC72C88"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
        </svg>

        <div
          style={{
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
            position: "absolute",
            zIndex: 2,
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
        >
          {nodes.map((node) => (
            <NodeComponent
              key={node.id}
              node={node}
              connections={connections}
              onMouseDown={handleMouseDown}
              onSocketDragStart={handleSocketDragStart}
              onNodeContextMenu={handleNodeContextMenu}
              onEditNode={handleEditNodeFromComponent}
              onShowResult={handleShowResult}
              isBeingEdited={editingNode?.id === node.id}
            />
          ))}
        </div>

        <div className="absolute bottom-5 right-5 flex flex-col gap-2 bg-[#111] p-2 rounded-md border border-[#FFB30055]">
          <button
            className="bg-[#FFC72C33] hover:bg-[#FFB300AA] transition-colors text-white p-2 rounded-md flex items-center justify-center w-10 h-10"
            onClick={zoomIn}
            title="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button
            className="bg-[#FFC72C33] hover:bg-[#FFB300AA] transition-colors text-white p-2 rounded-md flex items-center justify-center w-10 h-10"
            onClick={zoomOut}
            title="Zoom Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button
            className="bg-[#FFC72C33] hover:bg-[#FFB300AA] transition-colors text-white p-2 rounded-md flex items-center justify-center w-10 h-10"
            onClick={resetView}
            title="Reset View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
          </button>
        </div>

        <div className="absolute bottom-5 left-5 text-white text-xs bg-[#FFC72C33] px-2 py-1 rounded">
          {Math.round(transform.scale * 100)}%
        </div>
      </div>

      {(editingNode || isPanelClosing) && (
        <NodeEditPanel
          node={editingNode}
          onClose={handleCloseEditPanel}
          onSave={(updatedNode: Partial<BaseNode>) => {
            setTimeout(() => {
              setNodes((prev) =>
                prev.map((node) =>
                  node.id === editingNode?.id ? { ...node, ...updatedNode } : node
                )
              );
              if (updatedNode.sockets && editingNode?.id != null) {
                const validSocketIds = new Set(updatedNode.sockets.map((s) => s.id));
                const editedId = editingNode.id;
                setConnections((prev) =>
                  prev.filter((conn) => {
                    const fromOwner = Math.floor(conn.fromSocket / 100);
                    const toOwner = Math.floor(conn.toSocket / 100);
                    if (fromOwner === editedId && !validSocketIds.has(conn.fromSocket)) return false;
                    if (toOwner === editedId && !validSocketIds.has(conn.toSocket)) return false;
                    return true;
                  })
                );
              }
            }, 300);
          }}
        />
      )}

      {graphNameDialogOpen && (
        <GraphNameDialog
          isOpen={graphNameDialogOpen}
          initialName={graph?.graphName || ""}
          onClose={() => setGraphNameDialogOpen(false)}
          onSave={handleSaveWithName}
        />
      )}

      {grapResultDialogOpen && selectedNode !== null && (
        <ResultDialog
          node={nodes.find((n) => n.id === selectedNode) || nodes[0]}
          nodes={nodes}
          iterations={iterations}
          onClose={() => setResultDialogOpen(false)}
        />
      )}

      {toast?.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          isClosing={toast.isClosing}
          onClose={hideToast}
        />
      )}
    </>
  );
};

export default NodeCanvas;