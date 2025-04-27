import React from "react";
import { Plus, FolderUp } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useTranslation } from "react-i18next";

interface ProjectsTabProps {
  onCreateNew: () => void;
  onOpenFromFile: () => void;
  onOpenFromPath: (path: string, id: string) => void;
}

const ProjectsTab: React.FC<ProjectsTabProps> = ({ onCreateNew, onOpenFromFile, onOpenFromPath }) => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 flex flex-col items-center justify-center py-8 md:py-12 relative z-10">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-mono">
          {t('projects.title', 'Projects')}
        </h1>
        <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto font-mono">
          {t('projects.description', 'Create and manage your AI development projects')}
        </p>

        <div className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto justify-center">
          <Button
            size="lg"
            onClick={onCreateNew}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium border-0 flex items-center justify-center gap-2 h-14 px-8 text-lg font-mono"
          >
            <Plus className="h-5 w-5" />
            {t('projects.createNew', 'Create New Project')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onOpenFromFile}
            className="bg-transparent hover:bg-black/40 text-white border-gray-700 flex items-center justify-center gap-2 h-14 px-8 text-lg font-mono"
          >
            <FolderUp className="h-5 w-5" />
            {t('projects.import', 'Import Project')}
          </Button>
          <Button className="hidden" onClick={() => onOpenFromPath("avx","123")}>abc</Button>
        </div>
      </div>
      
      <div className="w-full max-w-6xl mt-24">
        <div className="text-gray-400 text-center font-mono">
          {t('projects.noProjects', 'No projects yet. Create a new project to get started.')}
        </div>
      </div>
    </div>
  );
};

export default ProjectsTab; 