/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
    If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
    WITHOUT WARRANTY OF ANY KIND, either express or implied.
    See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentsTab from '@/modules/workspace/tabs/AgentsTab';
import { WorkspaceData } from '@/modules/workspace/types/Types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key: string, fallback: string) => fallback || key),
  })),
}));

// Mock AgentForm component
vi.mock('@/modules/workspace/components/AgentForm', () => ({
  default: ({
    value,
    onChange,
    availableTools,
    availableMcpTools,
    workspaceMainLLMName,
  }: any) => (
    <div data-testid="agent-form">
      <div data-testid="form-value">{JSON.stringify(value)}</div>
      <div data-testid="available-tools">{JSON.stringify(availableTools)}</div>
      <div data-testid="available-mcp-tools">{JSON.stringify(availableMcpTools)}</div>
      <div data-testid="workspace-llm-name">{workspaceMainLLMName}</div>
      <button
        data-testid="form-change-btn"
        onClick={() =>
          onChange({
            name: 'Updated Agent',
            role: 'Updated Role',
            background: 'Updated Background',
            llm: { provider: 'OpenAI', model: { name: 'GPT-4', id: 'gpt-4' } },
            apiKey: 'updated-key',
            tools: [],
            variables: {},
          })
        }
      >
        Change Form
      </button>
    </div>
  ),
}));

describe('AgentsTab', () => {
  let mockWorkspaceData: WorkspaceData;
  const mockOnTabChanges = vi.fn();
  const mockHandleImportWorkflow = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkspaceData = {
      id: 'test-workspace',
      createdAt: 1234567890123,
      updatedAt: 1234567890123,
      name: 'Test Workspace',
      description: 'Test Description',
      mainLLM: {
        provider: 'OpenAI',
        model: { name: 'GPT-4', id: 'gpt-4' },
      },
      apiKey: 'test-api-key',
      useSavedCredentials: false,
      tasks: [],
      connections: [],
      agents: [
        {
          id: 'agent-1',
          name: 'Test Agent',
          role: 'Test Role',
          objective: 'Test objective',
          background: 'Test background',
          capabilities: 'Test capabilities',
          tools: [],
          llm: {
            provider: 'OpenAI',
            model: { name: 'GPT-4', id: 'gpt-4' },
          },
          apiKey: 'test-key',
          variables: {},
        },
      ],
      workflows: [
        {
          id: 'workflow-1',
          name: 'Test Workflow',
          description: 'Test workflow description',
        },
      ],
      mcpTools: [
        {
          id: 'mcp-1',
          type: 'mcp',
          name: 'Test MCP Tool',
          description: 'Test MCP tool description',
        },
      ],
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders agents list and add button', () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('Add Agent')).toBeInTheDocument();
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
  });

  it('shows empty state when no agents', () => {
    const emptyWorkspaceData = { ...mockWorkspaceData, agents: [] };

    render(
      <AgentsTab
        workspaceData={emptyWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    expect(
      screen.getByText('No agents have been added to this workspace yet')
    ).toBeInTheDocument();
  });

  it('opens add agent dialog', () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    const addButton = screen.getByText('Add Agent');
    fireEvent.click(addButton);

    expect(screen.getByText('Add New Agent')).toBeInTheDocument();
    expect(screen.getByTestId('agent-form')).toBeInTheDocument();
  });

  it('opens edit agent dialog', () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    // Find and click edit button (it's in the agent card)
    const editButton = screen.getByTitle('Edit agent');
    fireEvent.click(editButton);

    expect(screen.getByText('Edit Agent')).toBeInTheDocument();
    expect(screen.getByTestId('agent-form')).toBeInTheDocument();
  });

  it('deletes agent', () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    const deleteButton = screen.getByTitle('Delete agent');
    fireEvent.click(deleteButton);

    expect(mockOnTabChanges).toHaveBeenCalledTimes(1);
    // The agent should be removed from the workspace data
    expect(mockWorkspaceData.agents).toHaveLength(0);
  });

  it('saves new agent', async () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    // Open add dialog
    const addButton = screen.getByText('Add Agent');
    fireEvent.click(addButton);

    // Change form values
    const changeButton = screen.getByTestId('form-change-btn');
    fireEvent.click(changeButton);

    // Wait for form to update
    await waitFor(() => {
      const formValue = screen.getByTestId('form-value');
      expect(JSON.parse(formValue.textContent || '{}')).toMatchObject({
        name: 'Updated Agent',
      });
    });

    // Save agent
    const saveButton = screen.getByText('Add');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnTabChanges).toHaveBeenCalledTimes(1);
      expect(mockWorkspaceData.agents).toHaveLength(2);
      expect(mockWorkspaceData.agents[1]).toMatchObject({
        name: 'Updated Agent',
        role: 'Updated Role',
        background: 'Updated Background',
        apiKey: 'updated-key',
      });
    });
  });

  it('saves edited agent', async () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    // Open edit dialog
    const editButton = screen.getByTitle('Edit agent');
    fireEvent.click(editButton);

    // Change form values
    const changeButton = screen.getByTestId('form-change-btn');
    fireEvent.click(changeButton);

    // Save agent
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnTabChanges).toHaveBeenCalledTimes(1);
      expect(mockWorkspaceData.agents[0]).toMatchObject({
        name: 'Updated Agent',
        role: 'Updated Role',
        background: 'Updated Background',
        apiKey: 'updated-key',
      });
    });
  });

  it('does not save agent without name', () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    // Open add dialog
    const addButton = screen.getByText('Add Agent');
    fireEvent.click(addButton);

    // Try to save without name (form is empty)
    const saveButton = screen.getByText('Add');
    fireEvent.click(saveButton);

    // Should not have called onTabChanges or added agent
    expect(mockOnTabChanges).not.toHaveBeenCalled();
    expect(mockWorkspaceData.agents).toHaveLength(1);
  });

  it('closes dialog on cancel', () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    // Open dialog
    const addButton = screen.getByText('Add Agent');
    fireEvent.click(addButton);

    expect(screen.getByTestId('agent-form')).toBeInTheDocument();

    // Close dialog
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByTestId('agent-form')).not.toBeInTheDocument();
  });

  it('closes dialog on close button', () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    // Open dialog
    const addButton = screen.getByText('Add Agent');
    fireEvent.click(addButton);

    expect(screen.getByTestId('agent-form')).toBeInTheDocument();

    // Close dialog with X button
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('agent-form')).not.toBeInTheDocument();
  });

  it('closes dialog on overlay click', () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    // Open dialog
    const addButton = screen.getByText('Add Agent');
    fireEvent.click(addButton);

    expect(screen.getByTestId('agent-form')).toBeInTheDocument();

    // Click overlay
    const overlay = screen.getByTestId('agent-form').parentElement?.parentElement?.previousElementSibling;
    if (overlay) {
      fireEvent.click(overlay);
    }

    expect(screen.queryByTestId('agent-form')).not.toBeInTheDocument();
  });

  it('computes available tools from workflows', () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    // Open dialog to see the form
    const addButton = screen.getByText('Add Agent');
    fireEvent.click(addButton);

    const availableTools = screen.getByTestId('available-tools');
    const tools = JSON.parse(availableTools.textContent || '[]');

    expect(tools).toEqual([
      {
        id: 'workflow-1',
        type: 'workflow',
        name: 'Test Workflow',
        description: 'Test workflow description',
      },
    ]);
  });

  it('passes available MCP tools to form', () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    // Open dialog to see the form
    const addButton = screen.getByText('Add Agent');
    fireEvent.click(addButton);

    const availableMcpTools = screen.getByTestId('available-mcp-tools');
    const mcpTools = JSON.parse(availableMcpTools.textContent || '[]');

    expect(mcpTools).toEqual(mockWorkspaceData.mcpTools);
  });

  it('passes workspace main LLM name to form', () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    // Open dialog to see the form
    const addButton = screen.getByText('Add Agent');
    fireEvent.click(addButton);

    const workspaceLlmName = screen.getByTestId('workspace-llm-name');
    expect(workspaceLlmName.textContent).toBe('GPT-4');
  });

  it('displays agent details correctly', () => {
    render(
      <AgentsTab
        workspaceData={mockWorkspaceData}
        onTabChanges={mockOnTabChanges}
        handleImportWorkflow={mockHandleImportWorkflow}
      />
    );

    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('Test Role')).toBeInTheDocument();
    expect(screen.getByText('Test objective')).toBeInTheDocument();
    expect(screen.getByText('Test background')).toBeInTheDocument();
    expect(screen.getByText('Test capabilities')).toBeInTheDocument();
  });
});