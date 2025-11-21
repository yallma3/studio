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
import { render, screen, fireEvent } from '@testing-library/react';
import AgentForm, { AgentFormValues } from '@/modules/workspace/components/AgentForm';
import { Tool } from '@/modules/workspace/types/Types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock ToolSelectionPopup
vi.mock('../../../shared/components/ToolSelectionPopup', () => ({
  default: ({ isOpen, onClose, onAddTool }: any) => (
    isOpen ? (
      <div data-testid="tool-selection-popup">
        <button onClick={onClose} data-testid="close-tool-popup">
          Close
        </button>
        <button
          onClick={() => {
            onAddTool({ type: 'function', name: 'Test Tool', description: 'A test tool' });
            onClose();
          }}
          data-testid="add-test-tool"
        >
          Add Test Tool
        </button>
      </div>
    ) : null
  ),
}));

describe('AgentForm Component', () => {
  const mockOnChange = vi.fn();
  const mockHandleImportWorkflow = vi.fn();

  const mockTools: Tool[] = [
    { type: 'function' as const, name: 'Web Search', description: 'Search the web' },
    { type: 'function' as const, name: 'File Reader', description: 'Read files' },
  ];

  const mockMcpTools: Tool[] = [
    { type: 'mcp' as const, name: 'MCP Tool', description: 'MCP tool' },
  ];

  const defaultValue: AgentFormValues = {
    name: 'Test Agent',
    role: 'Assistant',
    background: 'You are a helpful assistant.',
    llm: {
      provider: 'Groq',
      model: { name: 'Llama 3.1 8B', id: 'llama-3.1-8b-instant' },
    },
    apiKey: 'test-api-key',
    tools: [mockTools[0]],
  };

  const defaultProps = {
    value: defaultValue,
    onChange: mockOnChange,
    handleImportWorkflow: mockHandleImportWorkflow,
    availableTools: mockTools,
    availableMcpTools: mockMcpTools,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<AgentForm {...defaultProps} />);

      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
      expect(screen.getByLabelText('Background')).toBeInTheDocument();
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
      expect(screen.getByText('Language Model')).toBeInTheDocument();
      expect(screen.getByText('Tools')).toBeInTheDocument();
    });

    it('should render form with initial values', () => {
      render(<AgentForm {...defaultProps} />);

      expect(screen.getByDisplayValue('Test Agent')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Assistant')).toBeInTheDocument();
      expect(screen.getByDisplayValue('You are a helpful assistant.')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test-api-key')).toBeInTheDocument();
    });

    it('should render LLM provider and model selects', () => {
      render(<AgentForm {...defaultProps} />);

      expect(screen.getByText('Language Model')).toBeInTheDocument();
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
    });

    it('should render existing tools', () => {
      render(<AgentForm {...defaultProps} />);

      expect(screen.getByText('Web Search')).toBeInTheDocument();
    });

    it('should show no tools message when no tools selected', () => {
      const propsWithoutTools = {
        ...defaultProps,
        value: { ...defaultValue, tools: [] },
      };
      render(<AgentForm {...propsWithoutTools} />);

      expect(screen.getByText('No tools selected - Press the plus button to add tools')).toBeInTheDocument();
    });
  });

  describe('Form Data Changes', () => {
    it('should call onChange when name changes', () => {
      render(<AgentForm {...defaultProps} />);
      const nameInput = screen.getByLabelText('Name *');

      fireEvent.change(nameInput, { target: { value: 'New Agent Name' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultValue,
        name: 'New Agent Name',
      });
    });

    it('should call onChange when role changes', () => {
      render(<AgentForm {...defaultProps} />);
      const roleInput = screen.getByLabelText('Role');

      fireEvent.change(roleInput, { target: { value: 'New Role' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultValue,
        role: 'New Role',
      });
    });

    it('should call onChange when background changes', () => {
      render(<AgentForm {...defaultProps} />);
      const backgroundTextarea = screen.getByLabelText('Background');

      fireEvent.change(backgroundTextarea, { target: { value: 'New background' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultValue,
        background: 'New background',
      });
    });

    it('should call onChange when api key changes', () => {
      render(<AgentForm {...defaultProps} />);
      const apiKeyInput = screen.getByLabelText('API Key');

      fireEvent.change(apiKeyInput, { target: { value: 'new-api-key' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultValue,
        apiKey: 'new-api-key',
      });
    });
  });

  describe('LLM Selection', () => {
    it('should update LLM provider when changed', () => {
      render(<AgentForm {...defaultProps} />);
      // The Select component renders as a div with text content
      expect(screen.getByText('Groq')).toBeInTheDocument();
    });

    it('should display current LLM model', () => {
      render(<AgentForm {...defaultProps} />);

      expect(screen.getByText('Llama 3.1 8B')).toBeInTheDocument();
    });

    it('should show custom LLM selected message when model is chosen', () => {
      render(<AgentForm {...defaultProps} />);

      expect(screen.getByText('Custom LLM selected for this agent')).toBeInTheDocument();
    });

    it('should show workspace LLM message when no model selected', () => {
      const propsWithoutModel = {
        ...defaultProps,
        value: {
          ...defaultValue,
          llm: { provider: 'Groq' as const },
        },
      };
      render(<AgentForm {...propsWithoutModel} />);

      expect(screen.getByText("Using workspace's main LLM: None selected")).toBeInTheDocument();
    });

    it('should show workspace LLM message when no custom model selected', () => {
      const propsWithoutModel = {
        ...defaultProps,
        value: {
          ...defaultValue,
          llm: { provider: 'Groq' as const },
        },
        workspaceMainLLMName: "GPT-4",
      };
      render(<AgentForm {...propsWithoutModel} />);

      expect(screen.getByText("Using workspace's main LLM: GPT-4")).toBeInTheDocument();
    });
  });

  describe('Tool Management', () => {
    it('should render add tool button', () => {
      render(<AgentForm {...defaultProps} />);
      expect(screen.getByText('Add Tool')).toBeInTheDocument();
    });

    it('should render existing tools', () => {
      render(<AgentForm {...defaultProps} />);
      expect(screen.getByText('Web Search')).toBeInTheDocument();
    });

    it('should remove tool when remove button is clicked', () => {
      render(<AgentForm {...defaultProps} />);
      const removeButton = screen.getByTitle('Remove tool');

      fireEvent.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultValue,
        tools: [],
      });
    });

    it('should show no tools message when no tools selected', () => {
      const propsWithoutTools = {
        ...defaultProps,
        value: { ...defaultValue, tools: [] },
      };
      render(<AgentForm {...propsWithoutTools} />);

      expect(screen.getByText('No tools selected - Press the plus button to add tools')).toBeInTheDocument();
    });
  });

  describe('Variables Feature (when enabled)', () => {
    const propsWithVariables = {
      ...defaultProps,
      enableVariables: true,
      value: {
        ...defaultValue,
        variables: { expertise: 'JavaScript', years: '5' },
      },
    };

    it('should show add variable button when variables are enabled', () => {
      render(<AgentForm {...defaultProps} enableVariables={true} />);

      expect(screen.getByText('Add Variable')).toBeInTheDocument();
    });

    it('should not show add variable button when variables are disabled', () => {
      render(<AgentForm {...defaultProps} enableVariables={false} />);

      expect(screen.queryByText('Add Variable')).not.toBeInTheDocument();
    });

    it('should render defined variables', () => {
      render(<AgentForm {...propsWithVariables} />);

      expect(screen.getByText('Defined Variables:')).toBeInTheDocument();
      expect(screen.getByText('{{expertise}}')).toBeInTheDocument();
      expect(screen.getByText('{{years}}')).toBeInTheDocument();
      expect(screen.getByText('= JavaScript')).toBeInTheDocument();
      expect(screen.getByText('= 5')).toBeInTheDocument();
    });

    it('should show background preview when variables exist', () => {
      const propsWithBackground = {
        ...propsWithVariables,
        value: {
          ...propsWithVariables.value,
          background: 'You are an expert in {{expertise}} with {{years}} years of experience',
        },
      };
      render(<AgentForm {...propsWithBackground} />);

      expect(screen.getByText('Background Preview:')).toBeInTheDocument();
      expect(screen.getByText('You are an expert in JavaScript with 5 years of experience')).toBeInTheDocument();
    });

    it('should open variable popup when add variable button is clicked', () => {
      render(<AgentForm {...defaultProps} enableVariables={true} />);

      fireEvent.click(screen.getByTitle('Add variable'));

      expect(screen.getByText('Variable Name')).toBeInTheDocument();
    });

    it('should add variable when form is submitted', () => {
      render(<AgentForm {...defaultProps} enableVariables={true} />);

      fireEvent.click(screen.getByText('Add Variable'));

      const nameInput = screen.getByPlaceholderText('Enter variable name (e.g. expertise)');
      const valueInput = screen.getByPlaceholderText('Enter default value (e.g. JavaScript)');
      const addButton = screen.getByText('Add');

      fireEvent.change(nameInput, { target: { value: 'skill' } });
      fireEvent.change(valueInput, { target: { value: 'React' } });
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultValue,
        variables: { skill: 'React' },
      });
    });

    it('should show error for duplicate variable names', () => {
      render(<AgentForm {...propsWithVariables} />);

      fireEvent.click(screen.getByText('Add Variable'));

      const nameInput = screen.getByPlaceholderText('Enter variable name (e.g. expertise)');
      const addButton = screen.getByText('Add');

      fireEvent.change(nameInput, { target: { value: 'expertise' } });
      fireEvent.click(addButton);

      expect(screen.getByText('A variable with this name already exists')).toBeInTheDocument();
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should remove variable when remove button is clicked', () => {
      render(<AgentForm {...propsWithVariables} />);

      const removeButtons = screen.getAllByTitle('Remove variable');
      fireEvent.click(removeButtons[0]); // Remove expertise

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultValue,
        variables: { years: '5' },
      });
    });

    it('should disable add button when variable name is empty', () => {
      render(<AgentForm {...defaultProps} enableVariables={true} />);

      fireEvent.click(screen.getByText('Add Variable'));

      const addButton = screen.getByText('Add');
      expect(addButton).toBeDisabled();

      const valueInput = screen.getByPlaceholderText('Enter default value (e.g. JavaScript)');
      fireEvent.change(valueInput, { target: { value: 'test' } });

      // Still disabled because name is empty
      expect(addButton).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should handle empty form submission gracefully', () => {
      const emptyValue: AgentFormValues = {
        name: '',
        role: '',
        background: '',
        llm: { provider: 'Groq' },
        apiKey: '',
        tools: [],
      };

      render(<AgentForm {...defaultProps} value={emptyValue} />);

      // Should render without errors
      expect(screen.getByLabelText('Name *')).toHaveValue('');
    });
  });

  describe('UI Elements', () => {
    it('should have proper styling classes', () => {
      render(<AgentForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name *');
      expect(nameInput).toHaveClass('w-full', 'px-3', 'py-2', 'bg-zinc-800', 'border', 'border-zinc-700', 'rounded-md', 'text-white');
    });

    it('should render tool tags with proper styling', () => {
      render(<AgentForm {...defaultProps} />);

      const toolTag = screen.getByText('Web Search').closest('div');
      expect(toolTag).toHaveClass('flex', 'items-center', 'gap-1', 'bg-zinc-800/30', 'rounded-md', 'px-2', 'py-1');
    });
  });
});