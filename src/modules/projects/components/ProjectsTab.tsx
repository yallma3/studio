/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React from "react";
import { Plus, FolderUp, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WorkspacesTabProps {
  onCreateNew: () => void;
  onOpenFromFile: () => void;
  onOpenFromPath: (path: string, id: string) => void;
}


// Main screen to create or import Workspaces
const WorkspacesTab: React.FC<WorkspacesTabProps> = ({ onCreateNew, onOpenFromFile, onOpenFromPath }) => {
  const { t } = useTranslation();
  

  return (
    <div>
 
    <div className="container mx-auto px-4 flex flex-col items-center justify-center py-8 md:py-12 relative z-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 w-full">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2"> {t('workspaces.title', 'Workspaces')}</h1>
            <p className="text-zinc-400">{t('workspaces.description', 'Create and manage your AI development workspaces')}</p>
          </div>

          <div className="flex gap-3">
            <button
              className="flex items-center justify-center px-4 py-2 rounded-md bg-[#FFC72C] hover:bg-[#E6B328] text-black font-medium "
              onClick={() => onCreateNew()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('workspaces.createNew', 'Create New Workspace')}
            </button>
            <button className="flex items-center justify-center px-4 py-2 rounded-md border border-zinc-700 bg-zinc-800 hover:bg-zinc-700" onClick={() => onOpenFromFile()}
              >
              <FolderUp className="h-4 w-4 mr-2" />
              {t('workspaces.import', 'Import Workspace')}
            </button>
            <button className="hidden" onClick={() => onOpenFromPath("", "")}>abc</button>
          </div>

          
        </div>
        
        {/* No workspace section */}
        <div className="w-full">
        <div className="flex p-1 gap-1  border border-zinc-800 rounded-md  bg-zinc-950 my-4 w-fit">
          <span className="text-zinc-400 bg-zinc-900 p-2 px-4 rounded-md">All Workspaces</span>
          <span className="text-zinc-400 p-2 px-4  cursor-pointer rounded-md">Recent</span>
          <span className="text-zinc-400 p-2 px-4  cursor-pointer rounded-md">Favorites</span>
        </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center w-full rounded-lg border-zinc-800 border bg-zinc-900">
          <div className="bg-zinc-800 rounded-full p-4 mb-6">
           <Layers className="h-12 w-12 text-zinc-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">No workspaces yet</h2>
          <p className="text-zinc-400 mb-6">Create a new workspace to get started with your AI<br />development journey</p>
          <button
            className="flex items-center justify-center text-sm gap-1 text-[#E6B328] hover:text-[#FFC72C] cursor-pointer"
            onClick={() => onCreateNew()}
          >
            <Plus className="h-4 w-4" />
            Create New Workspace
          </button>
        </div>
    </div>

    </div>
  );
};

export default WorkspacesTab;