/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { NodeType } from "../types/NodeTypes";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";

interface IterationEntry {
  index: number;
  results: Record<string, unknown>;
  timestamp: number;
}

// Result Dialog Component
interface ResultDialogProps {
  node: NodeType;
  nodes: NodeType[];
  iterations?: IterationEntry[];
  onClose: () => void;
}

export const ResultDialog: React.FC<ResultDialogProps> = ({
  node,
  iterations = [],
  onClose,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"final" | "iterations">("final");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    iterations.length > 0 ? iterations[iterations.length - 1].index : null
  );
  const nodeIterations = iterations.filter(
    (iter) => String(node.id) in iter.results
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const result = node.result ?? t("resultDialog.noData", "No result data available");

  const formatValue = (val: unknown): string => {
    if (val === undefined || val === null) return "—";
    if (typeof val === "string") return val;
    return JSON.stringify(val, null, 2);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-[#FFC72C]/50 rounded-md max-w-2xl max-h-[80vh] w-full mx-4 flex flex-col overflow-hidden animate-slide-up shadow-lg"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#111] to-[#FFC72C22] border-b border-[#FFC72C]/30 flex-shrink-0">
          <h3 className="text-[#FFC72C] font-bold flex gap-2 items-center">
            <FileText size={16} />
            {t("resultDialog.title", "{{nodeName}} Result", { nodeName: node.title })}
            {nodeIterations.length > 0 && (
              <span className="bg-[#FFC72C]/10 text-[#FFC72C] text-xs px-2 py-0.5 rounded font-mono">
                {nodeIterations.length} iterations
              </span>
            )}
          </h3>
          <button
            className="text-gray-400 hover:text-white hover:bg-[#FFC72C33] rounded-full w-6 h-6 flex items-center justify-center transition-colors"
            onClick={onClose}
            aria-label={t("common.close", "Close")}
          >
            &times;
          </button>
        </div>

        {/* Tabs — only shown when this node has iteration data */}
        {nodeIterations.length > 0 && (
          <div className="flex border-b border-[#FFC72C]/20 flex-shrink-0">
            {(["final", "iterations"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-mono border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-[#FFC72C] text-[#FFC72C]"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "final"
                  ? "Final Result"
                  : `Loop Iterations (${nodeIterations.length})`}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Final result tab */}
          {activeTab === "final" && (
            <div className="text-white font-mono text-sm bg-[#FFC72C11] p-4 rounded border border-[#FFC72C]/30 overflow-auto">
              {typeof result === "object" ? (
                <pre>{JSON.stringify(result, null, 2)}</pre>
              ) : (
                result.toString()
              )}
            </div>
          )}

          {/* Iterations tab — only this node's output per iteration */}
          {activeTab === "iterations" && (
            <div className="space-y-2">
              {nodeIterations.map((iter) => {
                const isExpanded = expandedIndex === iter.index;
                const value = iter.results[String(node.id)];
                return (
                  <div
                    key={iter.index}
                    className="border border-[#FFC72C]/20 rounded-md overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center justify-between px-3 py-2 bg-[#FFC72C]/10 hover:bg-[#FFC72C]/15 transition-colors text-left"
                      onClick={() =>
                        setExpandedIndex(isExpanded ? null : iter.index)
                      }
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
                      <div className="px-3 py-3 bg-[#0f0f0f]">
                        <pre className="text-[11px] text-[#FFC72C]/80 font-mono whitespace-pre-wrap break-all leading-relaxed">
                          {formatValue(value)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-3 border-t border-[#FFC72C]/20 bg-[#FFC72C11] flex-shrink-0">
          <button
            className="bg-[#FFC72C33] hover:bg-[#FFC72C44] text-[#FFC72C] px-4 py-2 rounded transition-colors"
            onClick={onClose}
          >
            {t("common.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
};