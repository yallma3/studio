import React, { useState } from "react";
import { Plus, FolderUp, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import ProjectCreationWizard from "./ProjectCreationWizard";
import { ProjectData } from "../types/Types";
import { saveProjectToDefaultLocation } from "../utils/storageUtils";

interface ProjectsTabProps {
  onCreateNew: () => void;
  onOpenFromFile: () => void;
  onOpenFromPath: (path: string, id: string) => void;
  onOpenProject?: (projectData: ProjectData) => void;
}


// Main screen to create or import Projects
const ProjectsTab: React.FC<ProjectsTabProps> = ({ onOpenFromFile, onOpenFromPath, onOpenProject }) => {
  const { t } = useTranslation();
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);

  const handleOpenCreateWizard = () => {
    setIsCreateWizardOpen(true);
  };

  const handleCloseCreateWizard = () => {
    setIsCreateWizardOpen(false);
  };

  // Saving and Opening project after wizard completion
  const handleCreateProject = async (projectData: ProjectData) => {
    // console.log(`Creating new project: ${projectData.name}`);
    // console.log('Project data:', projectData);
    
    try {
      // Save the project to the default location
      await saveProjectToDefaultLocation(projectData);
      
      // Open the project in ProjectCanvas if onOpenProject is provided
      if (onOpenProject) {
        onOpenProject(projectData);
      }
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 flex flex-col items-center justify-center py-8 md:py-12 relative z-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 w-full">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2"> {t('projects.title', 'Projects')}</h1>
            <p className="text-zinc-400">{t('projects.description', 'Create and manage your AI development projects')}</p>
          </div>

          <div className="flex gap-3">
            <button
              className="flex items-center justify-center px-4 py-2 rounded-md bg-[#FFC72C] hover:bg-[#E6B328] text-black font-medium "
              onClick={() => handleOpenCreateWizard()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('projects.createNew', 'Create New Project')}
            </button>
            <button className="flex items-center justify-center px-4 py-2 rounded-md border border-zinc-700 bg-zinc-800 hover:bg-zinc-700" onClick={() => onOpenFromFile()}>
              <FolderUp className="h-4 w-4 mr-2" />
              {t('projects.import', 'Import Project')}
            </button>
            <button className="hidden" onClick={() => onOpenFromPath("avx","123")}>abc</button>
          </div>

          
        </div>
        
        {/* No projects section */}
        <div className="w-full">
        <div className="flex p-1 gap-1  border border-zinc-800 rounded-md  bg-zinc-950 my-4 w-fit">
          <span className="text-zinc-400 bg-zinc-900 p-2 px-4 rounded-md">All Projects</span>
          <span className="text-zinc-400 p-2 px-4  cursor-pointer rounded-md">Recent</span>
          <span className="text-zinc-400 p-2 px-4  cursor-pointer rounded-md">Favorites</span>
        </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center w-full rounded-lg border-zinc-800 border bg-zinc-900">
          <div className="bg-zinc-800 rounded-full p-4 mb-6">
           <Layers className="h-12 w-12 text-zinc-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">No projects yet</h2>
          <p className="text-zinc-400 mb-6">Create a new project to get started with your AI<br />development journey</p>
          <button
            className="flex items-center justify-center text-sm gap-1 text-[#E6B328] hover:text-[#FFC72C] cursor-pointer"
            onClick={() => handleOpenCreateWizard()}
          >
            <Plus className="h-4 w-4" />
            Create New Project
          </button>
        </div>

      {/* Project Creation Wizard Wizard */}
      <ProjectCreationWizard
        open={isCreateWizardOpen}
        onClose={handleCloseCreateWizard}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};

export default ProjectsTab;