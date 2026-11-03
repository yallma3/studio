/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
    If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
    WITHOUT WARRANTY OF ANY KIND, either express or implied.
    See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EnvironmentVariablesTab from "@/modules/workspace/tabs/EnviromentVariableTab";
import { WorkspaceData, EnvironmentVariable } from "@/modules/workspace/types/Types";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key: string, fallback: string) => fallback || key),
  })),
}));

describe("EnvironmentVariablesTab", () => {
  let mockWorkspaceData: WorkspaceData;
  const mockOnTabChanges = vi.fn();
  const mockOnUpdateWorkspace = vi.fn();

  const mockVariables: EnvironmentVariable[] = [
    {
      id: "env-1",
      key: "OPENAI_API_KEY",
      value: "sk-proj-1234567890",
      sensitive: true,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: "env-2",
      key: "BASE_URL",
      value: "https://api.example.com",
      sensitive: false,
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkspaceData = {
      id: "test-workspace",
      createdAt: 1000,
      updatedAt: 1000,
      name: "Test Workspace",
      description: "Test Description",
      mainLLM: {
        provider: "OpenAI",
        model: { name: "GPT-4", id: "gpt-4" },
      },
      apiKey: "test-key",
      useSavedCredentials: false,
      tasks: [],
      connections: [],
      agents: [],
      workflows: [],
      mcpTools: [],
      trigger: null,
      environmentVariables: [...mockVariables],
    };
  });

  it("renders top sub-title bar with header and 'use for' description statement", () => {
    render(
      <EnvironmentVariablesTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        onUpdateWorkspace={mockOnUpdateWorkspace}
      />
    );

    expect(screen.getByText("Environment Variables")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Configure environment variables and secure credentials accessible during workspace execution"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Add Variable")).toBeInTheDocument();
  });

  it("renders list of environment variables with masked sensitive values", () => {
    render(
      <EnvironmentVariablesTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        onUpdateWorkspace={mockOnUpdateWorkspace}
      />
    );

    expect(screen.getByText("OPENAI_API_KEY")).toBeInTheDocument();
    expect(screen.getByText("BASE_URL")).toBeInTheDocument();
    // Default values are masked
    expect(screen.queryByText("sk-proj-1234567890")).not.toBeInTheDocument();
  });

  it("toggles value visibility when Eye/EyeOff button is clicked", () => {
    render(
      <EnvironmentVariablesTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        onUpdateWorkspace={mockOnUpdateWorkspace}
      />
    );

    const showButtons = screen.getAllByTitle("Show");
    expect(showButtons.length).toBeGreaterThan(0);

    // Toggle the first variable's visibility
    fireEvent.click(showButtons[0]);
    expect(screen.getByText("sk-proj-1234567890")).toBeInTheDocument();

    // Toggle it back off
    const hideButton = screen.getByTitle("Hide");
    fireEvent.click(hideButton);
    expect(screen.queryByText("sk-proj-1234567890")).not.toBeInTheDocument();
  });

  it("shows empty state when no variables exist", () => {
    const emptyWorkspace = { ...mockWorkspaceData, environmentVariables: [] };
    render(
      <EnvironmentVariablesTab
        workspaceData={emptyWorkspace}
        onTabChanges={mockOnTabChanges}
        onUpdateWorkspace={mockOnUpdateWorkspace}
      />
    );

    expect(screen.getByText("No environment variables")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Add environment variables to securely store API keys and configuration"
      )
    ).toBeInTheDocument();
  });

  it("opens add variable modal and adds a new variable", () => {
    render(
      <EnvironmentVariablesTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        onUpdateWorkspace={mockOnUpdateWorkspace}
      />
    );

    // Click top bar Add Variable
    fireEvent.click(screen.getByText("Add Variable"));
    // Modal title is Add Variable
    expect(screen.getAllByText("Add Variable").length).toBeGreaterThan(0);

    const keyInput = screen.getByPlaceholderText("MY_API_KEY");
    const valueInput = screen.getByPlaceholderText("Enter value");

    // Invalid key format
    fireEvent.change(keyInput, { target: { value: "123_invalid" } });
    expect(
      screen.getByText(
        "Key must start with letter/underscore and contain only uppercase letters, numbers, and underscores"
      )
    ).toBeInTheDocument();

    // Valid key format (auto-uppercases)
    fireEvent.change(keyInput, { target: { value: "my_api_token" } });
    fireEvent.change(valueInput, { target: { value: "secret-token-123" } });

    // Mark as sensitive
    const sensitiveCheckbox = screen.getByRole("checkbox");
    fireEvent.click(sensitiveCheckbox);

    // Click Add button in modal
    const addButton = screen.getByRole("button", { name: "Add" });
    fireEvent.click(addButton);

    expect(mockOnUpdateWorkspace).toHaveBeenCalledTimes(1);
    const updatedPayload = mockOnUpdateWorkspace.mock.calls[0][0];
    expect(updatedPayload.environmentVariables).toHaveLength(3);
    expect(updatedPayload.environmentVariables[2].key).toBe("MY_API_TOKEN");
    expect(updatedPayload.environmentVariables[2].value).toBe("secret-token-123");
    expect(updatedPayload.environmentVariables[2].sensitive).toBe(true);
    expect(mockOnTabChanges).toHaveBeenCalledTimes(1);
  });

  it("edits an existing variable", () => {
    render(
      <EnvironmentVariablesTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        onUpdateWorkspace={mockOnUpdateWorkspace}
      />
    );

    const editButtons = screen.getAllByTitle("Edit");
    fireEvent.click(editButtons[0]);

    expect(screen.getByText("Edit Variable")).toBeInTheDocument();

    const valueInput = screen.getByPlaceholderText("Enter value");
    fireEvent.change(valueInput, { target: { value: "updated-key-value" } });

    const updateButton = screen.getByRole("button", { name: "Update" });
    fireEvent.click(updateButton);

    expect(mockOnUpdateWorkspace).toHaveBeenCalledTimes(1);
    const updatedPayload = mockOnUpdateWorkspace.mock.calls[0][0];
    expect(updatedPayload.environmentVariables[0].value).toBe("updated-key-value");
    expect(mockOnTabChanges).toHaveBeenCalledTimes(1);
  });

  it("deletes a variable", () => {
    render(
      <EnvironmentVariablesTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        onUpdateWorkspace={mockOnUpdateWorkspace}
      />
    );

    const deleteButtons = screen.getAllByTitle("Delete");
    fireEvent.click(deleteButtons[0]);

    expect(mockOnUpdateWorkspace).toHaveBeenCalledTimes(1);
    const updatedPayload = mockOnUpdateWorkspace.mock.calls[0][0];
    expect(updatedPayload.environmentVariables).toHaveLength(1);
    expect(updatedPayload.environmentVariables[0].id).toBe("env-2");
    expect(mockOnTabChanges).toHaveBeenCalledTimes(1);
  });
});
