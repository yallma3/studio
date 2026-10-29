/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 *
 * Copyright (C) 2025 yaLLMa3
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * This software is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { WorkspaceArtifact } from "../types/Types";

export interface DownloadArtifactOptions {
  showToast?: (msg: string, type: "success" | "error") => void;
}

/**
 * Checks if running inside the Tauri desktop shell.
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
}

/**
 * Resolves a full URL by joining baseUrl with a relative path.
 */
function resolveUrl(baseUrl: string, relativePath: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Downloads an execution artifact across Tauri desktop and web browser environments.
 * - Desktop: Opens native OS save dialog, streams content, and writes to chosen path.
 * - Browser: Triggers an anchor element download with browser progress.
 */
export async function downloadArtifact(
  artifact: WorkspaceArtifact,
  baseUrl: string,
  options?: DownloadArtifactOptions
): Promise<void> {
  const fullUrl = resolveUrl(baseUrl, artifact.downloadUrl);

  if (isTauriEnvironment()) {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");

      const targetPath = await save({
        defaultPath: artifact.filename,
        filters:
          artifact.format === "json"
            ? [{ name: "JSON", extensions: ["json"] }]
            : [{ name: "Text", extensions: ["txt"] }],
      });

      if (!targetPath) {
        return;
      }

      const res = await fetch(fullUrl);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          const msg = "Download link expired or invalid token. Please re-run the workspace.";
          options?.showToast?.(msg, "error");
          throw new Error(msg);
        }
        const errorMsg = `Download failed: HTTP ${res.status}`;
        options?.showToast?.(errorMsg, "error");
        throw new Error(errorMsg);
      }

      const content = await res.text();
      await writeTextFile(targetPath, content);
      options?.showToast?.(`Artifact saved to ${targetPath}`, "success");
    } catch (error) {
      if (!(error instanceof Error) || (!error.message.includes("Download link expired") && !error.message.includes("Download failed"))) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        options?.showToast?.(errorMsg, "error");
      }
      throw error;
    }
  } else {
    try {
      const res = await fetch(fullUrl);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          const msg = "Download link expired or invalid token. Please re-run the workspace.";
          options?.showToast?.(msg, "error");
          throw new Error(msg);
        }
        const errorMsg = `Download failed: HTTP ${res.status}`;
        options?.showToast?.(errorMsg, "error");
        throw new Error(errorMsg);
      }

      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = artifact.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
      options?.showToast?.(`Downloading ${artifact.filename}...`, "success");
    } catch (error) {
      if (!(error instanceof Error) || (!error.message.includes("Download link expired") && !error.message.includes("Download failed"))) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        options?.showToast?.(errorMsg, "error");
      }
      throw error;
    }
  }
}

/**
 * Fetches artifact text content from viewUrl for in-app viewing.
 */
export async function fetchArtifactContent(
  artifact: WorkspaceArtifact,
  baseUrl: string
): Promise<string> {
  const fullUrl = resolveUrl(baseUrl, artifact.viewUrl);
  const res = await fetch(fullUrl);

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Preview link expired or invalid token. Please re-run the workspace.");
    }
    throw new Error(`Failed to fetch artifact preview: HTTP ${res.status}`);
  }

  return await res.text();
}
