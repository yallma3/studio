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
import WorkspaceCanvas from "@/modules/workspace/WorkspaceCanvas";
import { WorkspaceData } from "@/modules/workspace/types/Types";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
    i18n: { language: "en" },
  }),
}));

// Mock tabs to keep tests focused on WorkspaceCanvas console behavior
vi.mock("@/modules/workspace/tabs", () => ({
  WorkspaceTab: ({ onEditStatusChange }: any) => (
    <div data-testid="tab-workspace">
      <span>WorkspaceTabContent</span>
      <button onClick={() => onEditStatusChange(true)}>Start Editing</button>
      <button onClick={() => onEditStatusChange(false)}>Stop Editing</button>
    </div>
  ),
  TasksTab: () => <div data-testid="tab-tasks">TasksTabContent</div>,
  AgentsTab: () => <div data-testid="tab-agents">AgentsTabContent</div>,
  AiFlowsTab: () => <div data-testid="tab-aiflows">AiFlowsTabContent</div>,
  EnvironmentVariablesTab: () => (
    <div data-testid="tab-environment">EnvTabContent</div>
  ),
}));

// Mock ConsolePanel
vi.mock("@/modules/workspace/components/ConsolePanel", () => ({
  default: ({ onClose, canClose }: any) => (
    <div data-testid="console-panel" data-canclose={canClose}>
      <button
        data-testid="console-close-btn"
        disabled={!canClose}
        onClick={onClose}
      >
        Close
      </button>
    </div>
  ),
}));

// Mock SidecarClient
vi.mock("@/modules/api/SidecarClient", () => ({
  sidecarClient: {
    onCommand: vi.fn(() => () => {}),
    offCommand: vi.fn(),
    onConsoleEvent: vi.fn(() => () => {}),
    offConsoleEvent: vi.fn(),
    onStatusChange: vi.fn(() => () => {}),
    offStatusChange: vi.fn(),
    onWorkspaceArtifacts: vi.fn(() => () => {}),
    offWorkspaceArtifacts: vi.fn(),
    onPendingPrompts: vi.fn(),
    sendMessage: vi.fn(),
    sendResponse: vi.fn(),
    getConnectionStatus: vi.fn(() => "connected"),
    getInstanceId: vi.fn(() => "mock-instance-id"),
    requestPendingPrompts: vi.fn(),
  },
}));

// Mock storage utils
vi.mock("@/modules/workspace/utils/storageUtils", () => ({
  saveWorkspaceToDefaultLocation: vi.fn(),
  workspaceFileExists: vi.fn(),
  saveWorkspaceState: vi.fn(),
  saveEncryptedWorkspace: vi.fn(),
}));

const mockWorkspaceData: WorkspaceData = {
  id: "test-ws-1",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  name: "Console Test Workspace",
  description: "Testing console behavior and persistence",
  mainLLM: {
    provider: "Groq",
    model: { name: "Llama 3.1 8B", id: "llama-3.1-8b-instant" },
  },
  apiKey: "test-key",
  useSavedCredentials: false,
  agents: [],
  tasks: [],
  connections: [],
  workflows: [],
  mcpTools: [],
  environmentVariables: [],
  trigger: null,
};

describe("WorkspaceCanvas - Console Panel Consistency & Session Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("should default to console open in Workspace tab when session has no prior state", () => {
    render(
      <WorkspaceCanvas
        workspaceData={mockWorkspaceData}
        onReturnToHome={vi.fn()}
        baseUrl="http://localhost:3001"
      />
    );

    // Terminal button should indicate console is currently open (title='Close Console')
    const consoleToggleBtn = screen.getByRole("button", {
      name: "Close Console",
    });
    expect(consoleToggleBtn).toBeInTheDocument();

    // ConsolePanel should be rendered with canClose=true
    const consolePanel = screen.getByTestId("console-panel");
    expect(consolePanel).toBeInTheDocument();
    expect(consolePanel.getAttribute("data-canclose")).toBe("true");
  });

  it("should toggle console closed and persist 'false' to sessionStorage when Terminal button is clicked", () => {
    render(
      <WorkspaceCanvas
        workspaceData={mockWorkspaceData}
        onReturnToHome={vi.fn()}
        baseUrl="http://localhost:3001"
      />
    );

    const toggleBtn = screen.getByRole("button", { name: "Close Console" });
    fireEvent.click(toggleBtn);

    // After clicking, button should update to 'Open Console'
    expect(
      screen.getByRole("button", { name: "Open Console" })
    ).toBeInTheDocument();

    // sessionStorage should store 'false' for this workspace
    expect(
      sessionStorage.getItem(`workspace_console_open_${mockWorkspaceData.id}`)
    ).toBe("false");
  });

  it("should toggle console back open and persist 'true' to sessionStorage when clicked again", () => {
    render(
      <WorkspaceCanvas
        workspaceData={mockWorkspaceData}
        onReturnToHome={vi.fn()}
        baseUrl="http://localhost:3001"
      />
    );

    // First toggle to close
    const toggleBtn = screen.getByRole("button", { name: "Close Console" });
    fireEvent.click(toggleBtn);
    expect(
      sessionStorage.getItem(`workspace_console_open_${mockWorkspaceData.id}`)
    ).toBe("false");

    // Second toggle to re-open
    const openBtn = screen.getByRole("button", { name: "Open Console" });
    fireEvent.click(openBtn);
    expect(
      screen.getByRole("button", { name: "Close Console" })
    ).toBeInTheDocument();
    expect(
      sessionStorage.getItem(`workspace_console_open_${mockWorkspaceData.id}`)
    ).toBe("true");
  });

  it("should close console and persist 'false' when ConsolePanel close button is clicked in Workspace tab", () => {
    render(
      <WorkspaceCanvas
        workspaceData={mockWorkspaceData}
        onReturnToHome={vi.fn()}
        baseUrl="http://localhost:3001"
      />
    );

    const closeBtn = screen.getByTestId("console-close-btn");
    expect(closeBtn).not.toBeDisabled();
    fireEvent.click(closeBtn);

    expect(
      screen.getByRole("button", { name: "Open Console" })
    ).toBeInTheDocument();
    expect(
      sessionStorage.getItem(`workspace_console_open_${mockWorkspaceData.id}`)
    ).toBe("false");
  });

  it("should initialize console as closed if sessionStorage already has 'false'", () => {
    sessionStorage.setItem(
      `workspace_console_open_${mockWorkspaceData.id}`,
      "false"
    );

    render(
      <WorkspaceCanvas
        workspaceData={mockWorkspaceData}
        onReturnToHome={vi.fn()}
        baseUrl="http://localhost:3001"
      />
    );

    // Console should be closed initially
    expect(
      screen.getByRole("button", { name: "Open Console" })
    ).toBeInTheDocument();
  });

  it("should default console to closed when switching away from Workspace tab, and restore session state on return", async () => {
    // Session state begins open
    render(
      <WorkspaceCanvas
        workspaceData={mockWorkspaceData}
        onReturnToHome={vi.fn()}
        baseUrl="http://localhost:3001"
      />
    );

    // Currently open in Workspace tab
    expect(
      screen.getByRole("button", { name: "Close Console" })
    ).toBeInTheDocument();

    // Switch to Sub Agents tab
    const agentsTabBtn = screen.getByRole("button", { name: "Sub Agents" });
    fireEvent.click(agentsTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId("tab-agents")).toBeInTheDocument();
    });

    // In other tabs, console defaults to closed
    expect(
      screen.getByRole("button", { name: "Open Console" })
    ).toBeInTheDocument();

    // Switch back to Workspace tab
    const workspaceTabBtn = screen.getByRole("button", { name: "Workspace" });
    fireEvent.click(workspaceTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId("tab-workspace")).toBeInTheDocument();
    });

    // Restores open state because sessionStorage or default was open
    expect(
      screen.getByRole("button", { name: "Close Console" })
    ).toBeInTheDocument();
  });

  it("should remember closed state when switching away and returning to Workspace tab", async () => {
    render(
      <WorkspaceCanvas
        workspaceData={mockWorkspaceData}
        onReturnToHome={vi.fn()}
        baseUrl="http://localhost:3001"
      />
    );

    // Explicitly close console in Workspace tab
    const toggleBtn = screen.getByRole("button", { name: "Close Console" });
    fireEvent.click(toggleBtn);
    expect(
      sessionStorage.getItem(`workspace_console_open_${mockWorkspaceData.id}`)
    ).toBe("false");

    // Switch to Tasks tab
    const tasksTabBtn = screen.getByRole("button", { name: "Tasks" });
    fireEvent.click(tasksTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId("tab-tasks")).toBeInTheDocument();
    });

    // Switch back to Workspace tab
    const workspaceTabBtn = screen.getByRole("button", { name: "Workspace" });
    fireEvent.click(workspaceTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId("tab-workspace")).toBeInTheDocument();
    });

    // Should still be closed because session remembered it was closed
    expect(
      screen.getByRole("button", { name: "Open Console" })
    ).toBeInTheDocument();
  });

  it("should restore remembered state when exiting edit mode in Workspace tab", async () => {
    sessionStorage.setItem(
      `workspace_console_open_${mockWorkspaceData.id}`,
      "true"
    );

    render(
      <WorkspaceCanvas
        workspaceData={mockWorkspaceData}
        onReturnToHome={vi.fn()}
        baseUrl="http://localhost:3001"
      />
    );

    // Console is open
    expect(
      screen.getByRole("button", { name: "Close Console" })
    ).toBeInTheDocument();

    // Trigger edit mode
    fireEvent.click(screen.getByText("Start Editing"));

    // Console closes during edit
    expect(
      screen.getByRole("button", { name: "Open Console" })
    ).toBeInTheDocument();

    // Stop editing
    fireEvent.click(screen.getByText("Stop Editing"));

    // Console restores to open because session state was true
    expect(
      screen.getByRole("button", { name: "Close Console" })
    ).toBeInTheDocument();
  });
});
