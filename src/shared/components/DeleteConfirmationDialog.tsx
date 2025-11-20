import React from "react";
import { useTranslation } from "react-i18next";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  itemName: string;
  itemType: "workflow" | "mcpTool";
  deleteCompletely: boolean;
  onDeleteCompletelyChange: (value: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationDialog: React.FC<
  DeleteConfirmationDialogProps
> = ({
  isOpen,
  itemName,
  itemType,
  deleteCompletely,
  onDeleteCompletelyChange,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const isWorkflow = itemType === "workflow";

  const getTranslationKeys = () => {
    if (isWorkflow) {
      return {
        deleteTitle: "workspaces.deleteWorkflow",
        removeTitle: "workspaces.removeWorkflow",
        deleteDescription: "workspaces.deleteFlowCompletely",
        removeDescription: "workspaces.removeFlowFromWorkspace",
        deleteCheckboxLabel: "workspaces.deleteCompletely",
        deleteCheckboxDescription: "workspaces.deleteCompletelyDescription",
      };
    } else {
      return {
        deleteTitle: "workspaces.deleteMcpTool",
        removeTitle: "workspaces.removeMcpTool",
        deleteDescription: "workspaces.deleteMcpToolCompletely",
        removeDescription: "workspaces.removeMcpToolFromWorkspace",
        deleteCheckboxLabel: "workspaces.deleteMcpToolCompletely",
        deleteCheckboxDescription:
          "workspaces.deleteMcpToolCompletelyDescription",
      };
    }
  };

  const keys = getTranslationKeys();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1c1c1c] to-[#161616] rounded-2xl shadow-2xl border border-zinc-700/50 p-8 max-w-lg w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              deleteCompletely
                ? "bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30"
                : "bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30"
            }`}
          >
            {deleteCompletely ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-400"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-orange-400"
              >
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9S7.03 3 12 3s9 4.03 9 9z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">
              {deleteCompletely
                ? t(
                    keys.deleteTitle,
                    isWorkflow
                      ? "Delete Workflow Forever?"
                      : "Delete MCP Tool Forever?"
                  )
                : t(keys.removeTitle, "Remove from Workspace?")}
            </h3>
            <div className="text-sm text-zinc-400">{itemName}</div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <div
            className={`p-4 rounded-xl border-l-4 ${
              deleteCompletely
                ? "bg-red-500/5 border-red-500 border-l-red-500"
                : "bg-orange-500/5 border-orange-500 border-l-orange-500"
            }`}
          >
            <p className="text-zinc-200 leading-relaxed">
              {deleteCompletely
                ? t(
                    keys.deleteDescription,
                    isWorkflow
                      ? "⚠️ This will permanently delete the workflow and all its data. You won't be able to recover it or use it in other workspaces."
                      : "⚠️ This will permanently delete the MCP tool and all its data. You won't be able to recover it or use it in other workspaces."
                  )
                : t(
                    keys.removeDescription,
                    isWorkflow
                      ? "✅ This will only remove the workflow from this workspace. You can still use it in other workspaces or add it back later."
                      : "✅ This will only remove the MCP tool from this workspace. You can still use it in other workspaces or add it back later."
                  )}
            </p>
          </div>
        </div>

        {/* Checkbox for complete deletion */}
        <div className="mb-8">
          <label className="group flex items-start gap-4 p-4 bg-gradient-to-r from-zinc-900/50 to-zinc-800/30 rounded-xl border border-zinc-700/50 cursor-pointer hover:border-zinc-600/70 transition-all duration-200">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={deleteCompletely}
                onChange={(e) => onDeleteCompletelyChange(e.target.checked)}
                className="w-5 h-5 text-red-600 bg-zinc-800 border-2 border-zinc-600 rounded-md focus:ring-red-500 focus:ring-2 focus:ring-offset-0 transition-colors cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <div className="text-base font-medium text-white group-hover:text-zinc-100 transition-colors">
                {t(
                  keys.deleteCheckboxLabel,
                  isWorkflow
                    ? "Delete workflow file forever"
                    : "Delete MCP tool file forever"
                )}
              </div>
              <div className="text-sm text-zinc-400 mt-1 leading-relaxed">
                {t(
                  keys.deleteCheckboxDescription,
                  isWorkflow
                    ? "Check this box if you want to permanently delete the workflow file from your computer. This cannot be undone."
                    : "Check this box if you want to permanently delete the MCP tool file from your computer. This cannot be undone."
                )}
              </div>
            </div>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg transition-colors duration-200 border border-zinc-700/50 hover:border-zinc-600/50"
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 border ${
              deleteCompletely
                ? "bg-red-600/10 text-red-400 border-red-600/30 hover:bg-red-600/20 hover:border-red-500/40 hover:text-red-300"
                : "bg-orange-600/10 text-orange-400 border-orange-600/30 hover:bg-orange-600/20 hover:border-orange-500/40 hover:text-orange-300"
            }`}
          >
            {deleteCompletely ? (
              <span className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                </svg>
                {t("common.deleteForever", "Delete Forever")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                {t("common.removeFromWorkspace", "Remove from Workspace")}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
