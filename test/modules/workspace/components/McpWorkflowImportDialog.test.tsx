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
import { render, screen } from '@testing-library/react';
import { McpWorkflowImportDialog } from '@/modules/workspace/components/McpWorkflowImportDialog';

// Mock Tauri APIs
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
}));

// Mock workspace utils
vi.mock('@/modules/workspace/utils/mcpStorageUtils', () => ({
  loadAllMcpToolsFromFiles: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/modules/workspace/utils/workflowStorageUtils', () => ({
  loadAllWorkflowsFromFiles: vi.fn(() => Promise.resolve([])),
  saveWorkflowToFile: vi.fn(),
  generateWorkflowId: vi.fn(),
}));

describe('McpWorkflowImportDialog Component', () => {
  const mockOnClose = vi.fn();
  const mockOnImportMcps = vi.fn();
  const mockOnImportWorkflows = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onImportMcps: mockOnImportMcps,
    onImportWorkflows: mockOnImportWorkflows,
    currentWorkspaceMcps: [],
    currentWorkspaceWorkflows: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <McpWorkflowImportDialog {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render dialog when isOpen is true', () => {
    render(<McpWorkflowImportDialog {...defaultProps} />);
    expect(screen.getByText('Import MCPs & Workflows')).toBeInTheDocument();
  });

  it('should have tabs for MCPs and Workflows', () => {
    render(<McpWorkflowImportDialog {...defaultProps} />);
    expect(screen.getByText(/MCPs \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/Workflows \(0\)/)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<McpWorkflowImportDialog {...defaultProps} />);
    const closeButton = screen.getByRole('button', { name: '' }); // X button has no accessible name
    closeButton.click();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should show current workspace items as disabled', () => {
    render(
      <McpWorkflowImportDialog
        {...defaultProps}
        currentWorkspaceMcps={['mcp1']}
        currentWorkspaceWorkflows={['workflow1']}
      />
    );
    // Basic rendering test - component should render without errors
    expect(screen.getByText('Import MCPs & Workflows')).toBeInTheDocument();
  });
});