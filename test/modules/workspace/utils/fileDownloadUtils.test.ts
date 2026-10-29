/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 *
 * Copyright (C) 2025 yaLLMa3
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 *
 * This software is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  downloadArtifact,
  fetchArtifactContent,
  isTauriEnvironment,
} from "@/modules/workspace/utils/fileDownloadUtils";
import { WorkspaceArtifact } from "@/modules/workspace/types/Types";

// Mock Tauri plugins
const mockSave = vi.fn();
const mockWriteTextFile = vi.fn();

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: (...args: unknown[]) => mockSave(...args),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  writeTextFile: (...args: unknown[]) => mockWriteTextFile(...args),
}));

describe("fileDownloadUtils", () => {
  const originalFetch = global.fetch;
  const mockShowToast = vi.fn();

  const sampleTxtArtifact: WorkspaceArtifact = {
    filename: "output_123.txt",
    format: "text",
    downloadUrl: "/output/download/output_123.txt?token=test-token",
    viewUrl: "/output/view/output_123.txt?token=test-token",
  };

  const sampleJsonArtifact: WorkspaceArtifact = {
    filename: "output_123.json",
    format: "json",
    downloadUrl: "/output/download/output_123.json?token=test-token",
    viewUrl: "/output/view/output_123.json?token=test-token",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete (window as any).__TAURI_INTERNALS__;
  });

  describe("isTauriEnvironment", () => {
    it("should return false when __TAURI_INTERNALS__ is undefined", () => {
      delete (window as any).__TAURI_INTERNALS__;
      expect(isTauriEnvironment()).toBe(false);
    });

    it("should return true when __TAURI_INTERNALS__ is present", () => {
      (window as any).__TAURI_INTERNALS__ = {};
      expect(isTauriEnvironment()).toBe(true);
    });
  });

  describe("downloadArtifact in Tauri Desktop Mode", () => {
    beforeEach(() => {
      (window as any).__TAURI_INTERNALS__ = {};
    });

    it("should open save dialog, fetch content, write to file, and notify success", async () => {
      mockSave.mockResolvedValue("/home/user/Documents/output_123.json");
      mockWriteTextFile.mockResolvedValue(undefined);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"result": "success"}'),
      } as any);

      await downloadArtifact(sampleJsonArtifact, "http://localhost:3001", {
        showToast: mockShowToast,
      });

      expect(mockSave).toHaveBeenCalledWith({
        defaultPath: "output_123.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3001/output/download/output_123.json?token=test-token"
      );
      expect(mockWriteTextFile).toHaveBeenCalledWith(
        "/home/user/Documents/output_123.json",
        '{"result": "success"}'
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining("Artifact saved to"),
        "success"
      );
    });

    it("should return early without fetching or saving if user cancels dialog", async () => {
      mockSave.mockResolvedValue(null);
      global.fetch = vi.fn();

      await downloadArtifact(sampleTxtArtifact, "http://localhost:3001", {
        showToast: mockShowToast,
      });

      expect(mockSave).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockWriteTextFile).not.toHaveBeenCalled();
      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it("should handle 401/403 expired token errors gracefully", async () => {
      mockSave.mockResolvedValue("/path/output_123.txt");
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve("Forbidden: Invalid or expired capability token"),
      } as any);

      await expect(
        downloadArtifact(sampleTxtArtifact, "http://localhost:3001", {
          showToast: mockShowToast,
        })
      ).rejects.toThrow(/expired or invalid/i);

      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining("expired"),
        "error"
      );
      expect(mockWriteTextFile).not.toHaveBeenCalled();
    });
  });

  describe("downloadArtifact in Web Browser Mode", () => {
    beforeEach(() => {
      delete (window as any).__TAURI_INTERNALS__;
    });

    it("should create an anchor element, set download attributes, click, and clean up", async () => {
      const appendChildSpy = vi.spyOn(document.body, "appendChild");
      const removeChildSpy = vi.spyOn(document.body, "removeChild");

      let clicked = false;
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        const el = originalCreateElement(tagName);
        if (tagName === "a") {
          el.click = () => {
            clicked = true;
          };
        }
        return el;
      });

      await downloadArtifact(sampleTxtArtifact, "http://localhost:3001", {
        showToast: mockShowToast,
      });

      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(clicked).toBe(true);
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining("Downloading output_123.txt"),
        "success"
      );
    });
  });

  describe("fetchArtifactContent", () => {
    it("should successfully fetch preview content via viewUrl", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve("Hello World Preview"),
      } as any);

      const content = await fetchArtifactContent(
        sampleTxtArtifact,
        "http://localhost:3001"
      );

      expect(content).toBe("Hello World Preview");
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3001/output/view/output_123.txt?token=test-token"
      );
    });

    it("should throw a clear error when token is expired (403)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      } as any);

      await expect(
        fetchArtifactContent(sampleTxtArtifact, "http://localhost:3001")
      ).rejects.toThrow(/expired or invalid token/i);
    });

    it("should throw on other HTTP errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as any);

      await expect(
        fetchArtifactContent(sampleTxtArtifact, "http://localhost:3001")
      ).rejects.toThrow(/HTTP 500/i);
    });
  });
});
