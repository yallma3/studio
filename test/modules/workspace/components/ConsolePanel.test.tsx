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

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConsolePanel from "@/modules/workspace/components/ConsolePanel";
import * as ConsoleContextModule from "@/modules/workspace/context/ConsoleContext";
import * as fileDownloadUtils from "@/modules/workspace/utils/fileDownloadUtils";
import { WorkspaceArtifact } from "@/modules/workspace/types/Types";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue || key,
  }),
}));

describe("ConsolePanel - Artifacts Integration", () => {
  const mockShowToast = vi.fn();

  const mockArtifacts: WorkspaceArtifact[] = [
    {
      filename: "results_2026.txt",
      format: "text",
      downloadUrl: "/output/download/results_2026.txt?token=t1",
      viewUrl: "/output/view/results_2026.txt?token=t1",
    },
    {
      filename: "results_2026.json",
      format: "json",
      downloadUrl: "/output/download/results_2026.json?token=t2",
      viewUrl: "/output/view/results_2026.json?token=t2",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render the artifacts container when latestArtifacts is empty", () => {
    vi.spyOn(ConsoleContextModule, "useConsole").mockReturnValue({
      events: [],
      pendingPrompts: [],
      latestArtifacts: [],
      addEvent: vi.fn(),
      sendInput: vi.fn(),
      clearEvents: vi.fn(),
      clearArtifacts: vi.fn(),
    });

    render(<ConsolePanel baseUrl="http://localhost:3001" />);

    expect(screen.queryByText(/Execution Output Artifacts/i)).toBeNull();
    expect(screen.queryByText("results_2026.txt")).toBeNull();
  });

  it("should render artifact pills with format badges when latestArtifacts are present", () => {
    vi.spyOn(ConsoleContextModule, "useConsole").mockReturnValue({
      events: [],
      pendingPrompts: [],
      latestArtifacts: mockArtifacts,
      addEvent: vi.fn(),
      sendInput: vi.fn(),
      clearEvents: vi.fn(),
      clearArtifacts: vi.fn(),
    });

    render(<ConsolePanel baseUrl="http://localhost:3001" />);

    expect(screen.getByText(/Execution Output Artifacts/i)).toBeDefined();
    expect(screen.getByText("results_2026.txt")).toBeDefined();
    expect(screen.getByText("results_2026.json")).toBeDefined();
    expect(screen.getByText("TEXT")).toBeDefined();
    expect(screen.getByText("JSON")).toBeDefined();
  });

  it("should invoke downloadArtifact when download button is clicked", async () => {
    vi.spyOn(ConsoleContextModule, "useConsole").mockReturnValue({
      events: [],
      pendingPrompts: [],
      latestArtifacts: [mockArtifacts[0]],
      addEvent: vi.fn(),
      sendInput: vi.fn(),
      clearEvents: vi.fn(),
      clearArtifacts: vi.fn(),
    });

    const downloadSpy = vi
      .spyOn(fileDownloadUtils, "downloadArtifact")
      .mockResolvedValue(undefined);

    render(
      <ConsolePanel
        baseUrl="http://localhost:3001"
        showToast={mockShowToast}
      />
    );

    const downloadBtn = screen.getByTitle("Download artifact");
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith(
        mockArtifacts[0],
        "http://localhost:3001",
        expect.objectContaining({ showToast: mockShowToast })
      );
    });
  });

  it("should invoke fetchArtifactContent and open dialog when preview button is clicked", async () => {
    vi.spyOn(ConsoleContextModule, "useConsole").mockReturnValue({
      events: [],
      pendingPrompts: [],
      latestArtifacts: [mockArtifacts[1]],
      addEvent: vi.fn(),
      sendInput: vi.fn(),
      clearEvents: vi.fn(),
      clearArtifacts: vi.fn(),
    });

    vi.spyOn(fileDownloadUtils, "fetchArtifactContent").mockResolvedValue(
      '{"status": "completed"}'
    );

    render(
      <ConsolePanel
        baseUrl="http://localhost:3001"
        showToast={mockShowToast}
      />
    );

    const previewBtn = screen.getByTitle("Preview artifact content");
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(screen.getByText('{"status": "completed"}')).toBeDefined();
    });
  });
});
