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
import { Plus, FolderUp, Layers, Star, Trash } from "lucide-react";

import { useTranslation } from "react-i18next";
import {
  loadAllWorkspaces,
  loadRecentWorkspaces,
  saveRecentWorkspaces,
  loadFavoriteWorkspaces,
  saveFavoriteWorkspaces,
  deleteWorkspace,
} from "./utils/storageUtils";
import { WorkspaceData } from "./types/Types";
import { ConfirmationDialog } from "../../shared/components/ui/ConfirmationDialog";

interface WorkspacesTabProps {
  onCreateNew: () => void;
  onOpenFromFile: () => void;
  onOpenFromPath: (path: string, id: string) => void;
  onOpenWorkspace?: (workspaceData: WorkspaceData) => void;
}

// Main screen to create or import Workspaces
const WorkspacesTab: React.FC<WorkspacesTabProps> = ({
  onCreateNew,
  onOpenFromFile,
  onOpenFromPath,
  onOpenWorkspace,
}) => {
  const { t } = useTranslation();
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "recent" | "favorites">(
    "all"
  );
  const [recentWorkspaces, setRecentWorkspaces] = useState<string[]>([]);
  const [favoriteWorkspaces, setFavoriteWorkspaces] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    workspaceId: string;
    workspaceName: string;
  }>({
    isOpen: false,
    workspaceId: "",
    workspaceName: "",
  });

  // Load workspaces and preferences when component mounts
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setIsLoading(true);
        const loadedWorkspaces = await loadAllWorkspaces();
        setWorkspaces(loadedWorkspaces);

        // Load recent workspaces and favorites from files
        const savedRecent = await loadRecentWorkspaces();
        const savedFavorites = await loadFavoriteWorkspaces();

        setRecentWorkspaces(savedRecent);
        setFavoriteWorkspaces(savedFavorites);
      } catch (error) {
        console.error("Error loading workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspaces();
  }, []);

  // Handle opening a workspace
  const handleOpenWorkspace = async (workspace: WorkspaceData) => {
    if (onOpenWorkspace) {
      // Add to recent workspaces
      await addToRecent(workspace.id);
      onOpenWorkspace(workspace);
    }
  };

  // Add workspace to recent list
  const addToRecent = async (workspaceId: string) => {
    const updatedRecent = [
      workspaceId,
      ...recentWorkspaces.filter((id) => id !== workspaceId),
    ].slice(0, 10);
    setRecentWorkspaces(updatedRecent);
    await saveRecentWorkspaces(updatedRecent);
  };

  // Toggle favorite status
  const toggleFavorite = async (
    workspaceId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent opening workspace when clicking favorite
    const updatedFavorites = favoriteWorkspaces.includes(workspaceId)
      ? favoriteWorkspaces.filter((id) => id !== workspaceId)
      : [...favoriteWorkspaces, workspaceId];
    setFavoriteWorkspaces(updatedFavorites);
    await saveFavoriteWorkspaces(updatedFavorites);
  };

  // Handle delete workspace button click - show confirmation dialog
  const handleDeleteWorkspace = (
    workspaceId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent opening workspace when clicking delete
    const workspace = workspaces.find((w) => w.id === workspaceId);
    setConfirmDelete({
      isOpen: true,
      workspaceId,
      workspaceName: workspace?.name || workspace?.id || t("workspaces.unknownWorkspace", "Unknown Workspace"),
    });
  };

  // Confirm deletion
  const confirmDeleteWorkspace = async () => {
    try {
      await deleteWorkspace(confirmDelete.workspaceId);

      // Update the workspaces list
      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.filter((w) => w.id !== confirmDelete.workspaceId)
      );

      // Remove from recent and favorites if present
      const updatedRecent = recentWorkspaces.filter(
        (id) => id !== confirmDelete.workspaceId
      );
      const updatedFavorites = favoriteWorkspaces.filter(
        (id) => id !== confirmDelete.workspaceId
      );

      if (updatedRecent.length !== recentWorkspaces.length) {
        setRecentWorkspaces(updatedRecent);
        await saveRecentWorkspaces(updatedRecent);
      }

      if (updatedFavorites.length !== favoriteWorkspaces.length) {
        setFavoriteWorkspaces(updatedFavorites);
        await saveFavoriteWorkspaces(updatedFavorites);
      }
    } catch (error) {
      console.error("Failed to delete workspace:", error);
      // You could add a toast notification here for error handling
    } finally {
      setConfirmDelete({ isOpen: false, workspaceId: "", workspaceName: "" });
    }
  };

  // Cancel deletion
  const cancelDeleteWorkspace = () => {
    setConfirmDelete({ isOpen: false, workspaceId: "", workspaceName: "" });
  };

  // Get filtered workspaces based on active tab
  const getFilteredWorkspaces = () => {
    switch (activeTab) {
      case "recent":
        return workspaces
          .filter((workspace) => recentWorkspaces.includes(workspace.id))
          .sort(
            (a, b) =>
              recentWorkspaces.indexOf(a.id) - recentWorkspaces.indexOf(b.id)
          );
      case "favorites":
        return workspaces.filter((workspace) =>
          favoriteWorkspaces.includes(workspace.id)
        );
      default:
        return workspaces;
    }
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="container mx-auto px-4 flex flex-col items-center justify-center py-8 md:py-12 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 w-full">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {" "}
              {t("workspaces.title", "Workspaces")}
            </h1>
            <p className="text-zinc-400">
              {t(
                "workspaces.description",
                "Create and manage your AI development workspaces"
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              className="flex items-center justify-center px-4 py-2 rounded-md bg-[#FFC72C] hover:bg-[#E6B328] text-black font-medium "
              onClick={() => onCreateNew()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("workspaces.createNew", "Create New Workspace")}
            </button>
            <button
              className="flex items-center justify-center px-4 py-2 rounded-md border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
              onClick={() => onOpenFromFile()}
            >
              <FolderUp className="h-4 w-4 mr-2" />
              {t("workspaces.import", "Import Workspace")}
            </button>
            <button className="hidden" onClick={() => onOpenFromPath("", "")}>
              abc
            </button>
          </div>
        </div>

        {/* No workspace section */}
        <div className="w-full">
          <div className="flex p-1 gap-1  border border-zinc-800 rounded-md  bg-zinc-950 my-4 w-fit">
            <button
              onClick={() => setActiveTab("all")}
              className={`p-2 px-4 rounded-md transition-colors ${
                activeTab === "all"
                  ? "text-white bg-zinc-900"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {t("workspaces.allWorkspaces", "All Workspaces")}
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`p-2 px-4 rounded-md transition-colors ${
                activeTab === "recent"
                  ? "text-white bg-zinc-900"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {t("workspaces.recent", "Recent")}
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`p-2 px-4 rounded-md transition-colors ${
                activeTab === "favorites"
                  ? "text-white bg-zinc-900"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {t("workspaces.favorites", "Favorites")}
            </button>
          </div>
        </div>
        <div className="w-full h-96 rounded-lg border-zinc-800 border bg-zinc-900">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-zinc-800 rounded-full p-4 mb-6">
                <Layers className="h-12 w-12 text-zinc-400 animate-pulse" />
              </div>
              <p className="text-zinc-400">{t("workspaces.loadingWorkspaces", "Loading workspaces...")}</p>
            </div>
          ) : getFilteredWorkspaces().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-zinc-800 rounded-full p-4 mb-6">
                <Layers className="h-12 w-12 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">
                {activeTab === "recent" && t("workspaces.noRecentWorkspaces", "No recent workspaces")}
                {activeTab === "favorites" && t("workspaces.noFavoriteWorkspaces", "No favorite workspaces")}
                {activeTab === "all" && t("workspaces.noWorkspacesYet", "No workspaces yet")}
              </h2>
              <p className="text-zinc-400 mb-6">
                {activeTab === "recent" &&
                  t("workspaces.recentWorkspacesDescription", "Workspaces you open will appear here")}
                {activeTab === "favorites" &&
                  t("workspaces.favoriteWorkspacesDescription", "Star workspaces to add them to favorites")}
                {activeTab === "all" &&
                  t("workspaces.noWorkspacesDescription", "Create a new workspace to get started with your AI development journey")}
              </p>
              {activeTab === "all" && (
                <button
                  className="flex items-center justify-center text-sm gap-1 text-[#E6B328] hover:text-[#FFC72C] cursor-pointer"
                  onClick={() => onCreateNew()}
                >
                  <Plus className="h-4 w-4" />
                  {t("workspaces.createNew", "Create New Workspace")}
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-2 h-full overflow-y-auto">
              {getFilteredWorkspaces().map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 cursor-pointer transition-colors"
                  onClick={() => handleOpenWorkspace(workspace)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-zinc-700 rounded-full p-2">
                      <Layers className="h-4 w-4 text-zinc-400" />
                    </div>
                    <h3 className="font-medium text-white">
                      {workspace.name || workspace.id}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400 text-sm">
                    <button
                      onClick={(e) => toggleFavorite(workspace.id, e)}
                      className={`p-1  transition-colors cursor-pointer ${
                        favoriteWorkspaces.includes(workspace.id)
                          ? "text-yellow-500"
                          : "text-zinc-500 hover:text-yellow-500"
                      }`}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          favoriteWorkspaces.includes(workspace.id)
                            ? "fill-current"
                            : ""
                        }`}
                      />
                    </button>
                    <button
                      className="p-1  transition-colors cursor-pointer text-zinc-500"
                      onClick={(e) => handleDeleteWorkspace(workspace.id, e)}
                    >
                      <Trash className="h-4 w-4 hover:text-red-600/60" />
                    </button>
                    <div className="flex items-center gap-2">
                      <span>
                        {formatDate(workspace.updatedAt || workspace.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDelete.isOpen}
        title={t("workspaces.confirmDelete", "Confirm Delete")}
        message={t(
          "workspaces.deleteWorkspaceConfirmation",
          `Are you sure you want to delete "{{workspaceName}}"? This action cannot be undone.`,
          { workspaceName: confirmDelete.workspaceName }
        )}
        confirmText={t("common.delete", "Delete")}
        cancelText={t("common.cancel", "Cancel")}
        confirmVariant="danger"
        onConfirm={confirmDeleteWorkspace}
        onCancel={cancelDeleteWorkspace}
      />
    </div>
  );
};

export default WorkspacesTab;
