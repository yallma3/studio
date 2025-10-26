/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { FileText } from "lucide-react";
import { NodeType } from "../types/NodeTypes";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// Result Dialog Component
interface ResultDialogProps {
  node: NodeType;
  onClose: () => void;
}

export const ResultDialog: React.FC<ResultDialogProps> = ({
  node,
  onClose,
}) => {
  const { t } = useTranslation();

  // Add escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Safely access the result
  const result = node.result || t("resultDialog.noData", "No result data available");

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-dialog-title"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-[#111] border border-[#FFC72C]/50 rounded-md max-w-2xl max-h-[80vh] w-full mx-4 overflow-hidden animate-slide-up shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#111] to-[#FFC72C22] border-b border-[#FFC72C]/30">
          <h3
            id="result-dialog-title"
            className="text-[#FFC72C] font-bold flex gap-2 items-center"
          >
            <FileText size={16} />
            {t("resultDialog.title", "{{nodeName}} Result", { nodeName: node.title })}
          </h3>
          <button
            className="text-gray-400 hover:text-white hover:bg-[#FFC72C33] rounded-full w-6 h-6 flex items-center justify-center transition-colors"
            onClick={onClose}
            aria-label={t("common.close", "Close")}
          >
            &times;
          </button>
        </div>
        <div className="p-4">
          <div className="text-white font-mono text-sm bg-[#FFC72C11] p-4 rounded border border-[#FFC72C]/30 overflow-auto max-h-[60vh]">
            {typeof result === "object" ? (
              <pre>{JSON.stringify(result, null, 2)}</pre>
            ) : (
              result.toString()
            )}
          </div>
        </div>
        <div className="flex justify-end p-3 border-t border-[#FFC72C]/20 bg-[#FFC72C11]">
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
