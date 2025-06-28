import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, Bell } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import WorkspacesTab from "../modules/projects/components/ProjectsTab";
import { WorkspaceData } from "../modules/projects/types/Types";
import SettingsView from "./settings/SettingsView";
import { saveWorkspaceToDefaultLocation } from "../modules/projects/utils/storageUtils";
import WorkspaceCreationWizard from "../modules/projects/components/WorkspaceCreationWizard";

interface HomeScreenProps {
  onOpenFromFile: () => void;
  onOpenFromPath: (path: string, id: string) => void;
  onOpenWorkspace?: (workspaceData: WorkspaceData) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenFromFile,
  onOpenFromPath,
  onOpenWorkspace: onOpenWorkspace,
}) => {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);

  const onCreateWorkspace = () => {
    console.log(isCreateWizardOpen);
    setIsCreateWizardOpen(true);
    console.log(isCreateWizardOpen);
  };

  const handleCloseCreateWizard = () => {
    setIsCreateWizardOpen(false);
  };

  const handleCreateWorkspace = async (workspaceData: WorkspaceData) => {
    // console.log(`Creating new Workspace: ${workspaceData.name}`);
    // console.log('Workspace data:', workspaceData);

    try {
      // Save the workspace to the default location
      await saveWorkspaceToDefaultLocation(workspaceData);

      // Open the workspace in WorkspaceCanvas if onOpenWorkspace is provided
      if (onOpenWorkspace) {
        onOpenWorkspace(workspaceData);
      }
    } catch (error) {
      console.error("Error saving workspace:", error);
    }
  };

  return (
    <div>
      {!isCreateWizardOpen && (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
          {/* Header */}
          <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5">
                  <img
                    src="/yaLLMa3.svg"
                    alt={t("app.title")}
                    className="w-32"
                  />
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-500 rounded-md cursor-pointer">
                    <Bell className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-500 rounded-md cursor-pointer"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
                <LanguageSelector />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="relative z-10">
            <WorkspacesTab
              onCreateNew={onCreateWorkspace}
              onOpenFromFile={onOpenFromFile}
              onOpenFromPath={onOpenFromPath}
              onOpenWorkspace={onOpenWorkspace}
            />
          </main>

          {/* Settings Modal */}
          {showSettings && (
            <SettingsView onClose={() => setShowSettings(false)} />
          )}
        </div>
      )}
      {isCreateWizardOpen && (
        <WorkspaceCreationWizard
          onClose={handleCloseCreateWizard}
          onCreateWorkspace={handleCreateWorkspace}
        />
      )}
    </div>
  );
};

export default HomeScreen;
