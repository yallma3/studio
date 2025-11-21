/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/
import React, { useEffect, useRef, useState } from "react";
import { Plus, Settings, Trash2, ChevronRight } from "lucide-react";
import { nodeRegistry } from "../types/NodeRegistry";
import { useTranslation } from "react-i18next";
import type { BaseNode } from "../types/NodeTypes";

interface ContextMenuPosition {
  visible: boolean;
  x: number;
  y: number;
  targetNodeId?: number;
}

interface CanvasContextMenuProps {
  contextMenu: ContextMenuPosition;
  // kept signature the same as your original; for keyboard Enter we cast the event
  onAddNode: (
    nodeType: string,
    e?: React.MouseEvent | React.KeyboardEvent | null
  ) => void;
  onContextMenuAction: (action: string, e: React.MouseEvent) => void;
}

const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  contextMenu,
  onAddNode,
  onContextMenuAction,
}) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language || "en";
  const [submenuPath, setSubmenuPath] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const getTranslatedFields = (node: BaseNode, lang: string) => {
    const i18nData = node.i18n?.[lang] || node.i18n?.en;
    return {
      translatedTitle: i18nData?.title || node.title,
      translatedCategory: i18nData?.category || node.category,
      translatedDescription: i18nData?.description || node.description || "",
      translatedNodeType: i18nData?.nodeType || node.nodeType,
    };
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (contextMenu.visible) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setSearchQuery("");
      setSelectedIndex(0);
      setSubmenuPath([]);
      setHoveredNode(null);
    }
  }, [contextMenu.visible]);

  const allNodes: Array<
    BaseNode & {
      translatedTitle: string;
      translatedCategory: string;
      translatedDescription: string;
      translatedNodeType: string;
    }
  > = nodeRegistry.listNodeDetails().map((node) => ({
    ...node,
    ...getTranslatedFields(node, currentLanguage),
  }));

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matches = normalizedQuery
    ? allNodes
        .map((n) => {
          const searchText =
            `${n.translatedTitle} ${n.translatedCategory} ${n.translatedNodeType}`.toLowerCase();
          const starts = searchText.startsWith(normalizedQuery) ? 0 : 1;
          return { ...n, score: starts, searchText };
        })
        .filter((n) => n.searchText.includes(normalizedQuery))
        .sort((a, b) => {
          if (a.score !== b.score) return a.score - b.score;
          return a.translatedTitle.localeCompare(b.translatedTitle);
        })
    : [];

  useEffect(() => {
    setSelectedIndex((prev) => {
      if (matches.length === 0) return 0;
      if (prev < 0) return 0;
      if (prev >= matches.length) return matches.length - 1;
      return prev;
    });
  }, [matches.length]);

  if (!contextMenu.visible) return null;

  const menuStyle: React.CSSProperties = {
    position: "absolute",
    top: contextMenu.y,
    left: contextMenu.x,
    zIndex: 1000,
    backgroundColor: "rgba(17, 17, 17, 0.95)",
    borderRadius: "8px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
    padding: "6px 0",
    minWidth: "220px",
    borderLeft: "1px solid rgba(255, 199, 44, 0.2)",
    backdropFilter: "blur(10px)",
  };

  const subMenuStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: "100%",
    zIndex: 1000,
    backgroundColor: "rgba(17, 17, 17, 0.95)",
    borderRadius: "8px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
    padding: "6px 0",
    minWidth: "180px",
    borderLeft: "1px solid rgba(255, 199, 44, 0.2)",
    backdropFilter: "blur(10px)",
  };

  const menuItemStyle: React.CSSProperties = {
    padding: "6px 14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "white",
    fontSize: "14px",
    transition: "background-color 0.12s",
    whiteSpace: "nowrap",
  };

  const categoryHeaderStyle: React.CSSProperties = {
    ...menuItemStyle,
    fontSize: "16px",
    fontWeight: "700",
    padding: "12px 14px",
    color: "#FFC72C",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    pointerEvents: "none",
  };

  const iconStyle: React.CSSProperties = {
    color: "#FFC72C",
    marginRight: "8px",
  };

  const inputStyle: React.CSSProperties = {
    width: "92%",
    margin: "6px auto",
    display: "block",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #222",
    outline: "none",
    backgroundColor: "#0f0f0f",
    color: "white",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const searchItemStyle: React.CSSProperties = {
    padding: "10px 14px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    fontFamily:
      "monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
    fontSize: "15px",
    color: "white",
  };

  const selectedStyle: React.CSSProperties = {
    backgroundColor: "#222",
    color: "#FFC72C",
  };

  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    left: "100%",
    top: 0,
    marginLeft: "8px",
    backgroundColor: "rgba(17, 17, 17, 0.98)",
    border: "1px solid rgba(255, 199, 44, 0.3)",
    borderRadius: "6px",
    padding: "10px 14px",
    minWidth: "200px",
    maxWidth: "320px",
    color: "white",
    fontSize: "13px",
    lineHeight: "1.5",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4)",
    zIndex: 1001,
    whiteSpace: "normal",
    backdropFilter: "blur(10px)",
  };

  const handleHover = (path: string[]) => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      setSubmenuPath(path);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((s) => Math.min(s + 1, Math.max(0, matches.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (matches[selectedIndex]) {
        onAddNode(matches[selectedIndex].nodeType, undefined);
      }
    } else if (e.key === "Escape") {
      setSearchQuery("");
      setSelectedIndex(0);
      setSubmenuPath([]);
    }
  };

  const renderAddNodeSubmenu = () => (
    <div style={subMenuStyle}>
      <div style={categoryHeaderStyle}>
        {t("canvasContextMenu.categories", "Categories")}
      </div>
      {nodeRegistry.listCategories().map((category) => {
        const categoryNode = allNodes.find((n) => n.category === category);
        const translatedCategory = categoryNode
          ? categoryNode.translatedCategory
          : category;
        return (
          <div
            key={category}
            style={menuItemStyle}
            onMouseEnter={() =>
              handleHover(["addNode", `category:${category}`])
            }
            className="hover:bg-[#222]"
          >
            <span>{translatedCategory}</span>
            <ChevronRight size={16} style={iconStyle} />
            {submenuPath.join("/") === `addNode/category:${category}` && (
              <div style={{ ...subMenuStyle, top: 0 }}>
                <div style={categoryHeaderStyle}>
                  {translatedCategory} {t("canvasContextMenu.nodes", "Nodes")}
                </div>
                {Object.entries(
                  nodeRegistry.listNodeTypesByCategory(category)
                ).map(([nodeType, _]) => {
                  const nodeDetails = allNodes.find(
                    (n) => n.nodeType === nodeType
                  );
                  if (!nodeDetails) return null;
                  const translatedTitle = nodeDetails.translatedTitle;
                  const translatedNodeType = nodeDetails.translatedNodeType;
                  const translatedDescription =
                    nodeDetails.translatedDescription;
                  return (
                    <div
                      key={nodeType}
                      style={{
                        ...menuItemStyle,
                        justifyContent: "flex-start",
                        position: "relative",
                      }}
                      onMouseEnter={() => setHoveredNode(nodeType)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={(e) => onAddNode(nodeType, e)}
                      className="hover:bg-[#222]"
                    >
                      <span>{`${translatedTitle} ${t(
                        "canvasContextMenu.node",
                        "Node"
                      )}`}</span>

                      {hoveredNode === nodeType && translatedDescription && (
                        <div style={tooltipStyle}>
                          <div
                            style={{
                              color: "#FFC72C",
                              fontSize: "18px",
                              fontWeight: "700",
                              textTransform: "uppercase",
                              textShadow: "0 0 4px rgba(255, 199, 44, 0.4)",
                              marginBottom: "8px",
                              fontFamily: "monospace",
                            }}
                          >
                            {translatedNodeType}
                          </div>
                          <div style={{ color: "rgba(255, 255, 255, 0.85)" }}>
                            {translatedDescription}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderSettingsSubmenu = () => (
    <div style={subMenuStyle}>
      <div style={categoryHeaderStyle}>
        {t("canvasContextMenu.settings", "Settings")}
      </div>
      <div
        style={{
          ...menuItemStyle,
          color: "#ff6b6b",
          justifyContent: "flex-start",
        }}
        onClick={(e) => onContextMenuAction("clearView", e)}
        className="hover:bg-[#222]"
      >
        <Trash2 size={16} style={{ color: "#ff6b6b", marginRight: "8px" }} />
        <span>{t("canvasContextMenu.clearView", "Clear View")}</span>
      </div>
    </div>
  );

  return (
    <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
      {/* Search input */}
      <input
        ref={inputRef}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setSubmenuPath([]);
          setHoveredNode(null);
        }}
        onKeyDown={handleKeyDown}
        placeholder={t("canvasContextMenu.searchPlaceholder", "Search...")}
        aria-label={t("canvasContextMenu.searchAriaLabel", "Search nodes")}
        style={inputStyle}
        onClick={(e) => e.stopPropagation()}
      />

      {/* If there's a non-empty query, show flat search results like Rivet */}
      {normalizedQuery ? (
        <div role="list" aria-label="search-results">
          {matches.length === 0 ? (
            <div style={{ ...menuItemStyle, padding: "10px 14px" }}>
              <span style={{ color: "#888" }}>
                {t("canvasContextMenu.noResults", "No results")}
              </span>
            </div>
          ) : (
            matches.map((m, idx) => {
              const nodeDetails = allNodes.find(
                (n) => n.nodeType === m.nodeType
              );
              if (!nodeDetails) return null;
              const translatedNodeType = nodeDetails.translatedNodeType;
              const translatedDescription = nodeDetails.translatedDescription;
              return (
                <div
                  key={`${m.category}.${m.nodeType}`}
                  role="listitem"
                  onMouseEnter={() => {
                    setSelectedIndex(idx);
                    setHoveredNode(m.nodeType);
                  }}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={(e) => onAddNode(m.nodeType, e)}
                  style={{
                    ...searchItemStyle,
                    ...(idx === selectedIndex ? selectedStyle : {}),
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: "15px" }}>{translatedNodeType}</span>
                  <small
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      marginTop: "4px",
                    }}
                  >
                    {m.translatedCategory}
                  </small>

                  {hoveredNode === m.nodeType && translatedDescription && (
                    <div style={tooltipStyle}>
                      <div
                        style={{
                          color: "#FFC72C",
                          fontSize: "18px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          textShadow: "0 0 4px rgba(255, 199, 44, 0.4)",
                          marginBottom: "8px",
                          fontFamily: "monospace",
                        }}
                      >
                        {translatedNodeType}
                      </div>
                      <div style={{ color: "rgba(255, 255, 255, 0.85)" }}>
                        {translatedDescription}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <>
          <div
            style={menuItemStyle}
            onMouseEnter={() => handleHover(["addNode"])}
            className="hover:bg-[#222]"
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Plus size={16} style={iconStyle} />
              <span>{t("canvasContextMenu.add", "Add")}</span>
            </div>
            <ChevronRight size={16} style={iconStyle} />
            {submenuPath[0] === "addNode" && renderAddNodeSubmenu()}
          </div>

          <div
            style={menuItemStyle}
            onMouseEnter={() => handleHover(["settings"])}
            className="hover:bg-[#222]"
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Settings size={16} style={iconStyle} />
              <span>{t("canvasContextMenu.settings", "Settings")}</span>
            </div>
            <ChevronRight size={16} style={iconStyle} />
            {submenuPath[0] === "settings" && renderSettingsSubmenu()}
          </div>
        </>
      )}
    </div>
  );
};

export default CanvasContextMenu;
