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
import { nodeRegistry } from "../types/NodeRegistry.ts";

interface ContextMenuPosition {
  visible: boolean;
  x: number;
  y: number;
  targetNodeId?: number;
}

interface CanvasContextMenuProps {
  contextMenu: ContextMenuPosition;
  // kept signature the same as your original; for keyboard Enter we cast the event
  onAddNode: (nodeType: string, e: React.MouseEvent) => void;
  onContextMenuAction: (action: string, e: React.MouseEvent) => void;
}

const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  contextMenu,
  onAddNode,
  onContextMenuAction,
}) => {
  const [submenuPath, setSubmenuPath] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hoverTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (contextMenu.visible) {
      // focus the input when menu opens
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      // reset when menu closes
      setSearchQuery("");
      setSelectedIndex(0);
      setSubmenuPath([]);
    }
  }, [contextMenu.visible]);

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
    fontFamily: "monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
    fontSize: "15px",
    color: "white",
  };

  const selectedStyle: React.CSSProperties = {
    backgroundColor: "#222",
    color: "#FFC72C",
  };

  const handleHover = (path: string[]) => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      setSubmenuPath(path);
    }, 150);
  };

  // Build a flat list of all node types (with category)
  const allNodes = nodeRegistry
    .listCategories()
    .flatMap((category) =>
      nodeRegistry
        .listNodeTypesByCategory(category)
        .map((nodeType) => ({ nodeType, category }))
    );

  // When there's a query, compute matches (startsWith first, then includes)
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matches = normalizedQuery
    ? allNodes
        .map((n) => {
          const name = n.nodeType.toLowerCase();
          const starts = name.startsWith(normalizedQuery) ? 0 : 1;
          return { ...n, score: starts, nameLower: name };
        })
        .filter((n) => n.nameLower.includes(normalizedQuery))
        .sort((a, b) => {
          if (a.score !== b.score) return a.score - b.score;
          return a.nodeType.localeCompare(b.nodeType);
        })
    : [];

  // Keep keyboard selection in range
  useEffect(() => {
    setSelectedIndex((prev) => {
      if (matches.length === 0) return 0;
      if (prev < 0) return 0;
      if (prev >= matches.length) return matches.length - 1;
      return prev;
    });
  }, [matches.length]);

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
        // onAddNode expects a MouseEvent in your signature; pass a dummy object casted to satisfy the type.
        onAddNode(matches[selectedIndex].nodeType, ({} as unknown) as React.MouseEvent);
      }
    } else if (e.key === "Escape") {
      // clear search (you can also close menu externally)
      setSearchQuery("");
      setSelectedIndex(0);
      setSubmenuPath([]);
    }
  };

  const renderAddNodeSubmenu = () => (
    <div style={subMenuStyle}>
      <p className="text-xs text-[#FFC72C]/80 font-mono p-2">Categories</p>
      {nodeRegistry.listCategories().map((category) => (
        <div
          key={category}
          style={menuItemStyle}
          onMouseEnter={() => handleHover(["addNode", `category:${category}`])}
          className="hover:bg-[#222]"
        >
          <span>{category}</span>
          <ChevronRight size={16} style={iconStyle} />
          {submenuPath.join("/") === `addNode/category:${category}` && (
            <div style={{ ...subMenuStyle, top: 0 }}>
              <p className="text-xs text-[#FFC72C]/80 font-mono p-2">
                {category} Nodes
              </p>
              {nodeRegistry.listNodeTypesByCategory(category).map((nodeType) => (
                <div
                  key={nodeType}
                  style={{
                    ...menuItemStyle,
                    justifyContent: "flex-start",
                  }}
                  onClick={(e) => onAddNode(nodeType, e)}
                  className="hover:bg-[#222]"
                >
                  <span>{`${nodeType} Node`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderSettingsSubmenu = () => (
    <div style={subMenuStyle}>
      <p className="text-xs text-[#FFC72C]/80 font-mono p-2">Settings</p>
      <div
        style={{ ...menuItemStyle, color: "#ff6b6b", justifyContent: "flex-start" }}
        onClick={(e) => onContextMenuAction("clearView", e)}
        className="hover:bg-[#222]"
      >
        <Trash2 size={16} style={{ color: "#ff6b6b", marginRight: "8px" }} />
        <span>Clear View</span>
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
          setSubmenuPath([]); // close submenus while searching
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        style={inputStyle}
        onClick={(e) => e.stopPropagation()}
      />

      {/* If there's a non-empty query, show flat search results like Rivet */}
      {normalizedQuery ? (
        <div role="list" aria-label="search-results">
          {matches.length === 0 ? (
            <div style={{ ...menuItemStyle, padding: "10px 14px" }}>
              <span style={{ color: "#888" }}>No results</span>
            </div>
          ) : (
            matches.map((m, idx) => (
              <div
                key={`${m.category}.${m.nodeType}`}
                role="listitem"
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={(e) => onAddNode(m.nodeType, e)}
                style={{
                  ...searchItemStyle,
                  ...(idx === selectedIndex ? selectedStyle : {}),
                }}
              >
                <span style={{ fontSize: "15px" }}>{m.nodeType}</span>
                <small style={{ color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>
                  {m.category}
                </small>
              </div>
            ))
          )}
        </div>
      ) : (
        // fallback UI when search is empty (original menu with submenus)
        <>
          <div
            style={menuItemStyle}
            onMouseEnter={() => handleHover(["addNode"])}
            className="hover:bg-[#222]"
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Plus size={16} style={iconStyle} />
              <span>Add</span>
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
              <span>Settings</span>
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
