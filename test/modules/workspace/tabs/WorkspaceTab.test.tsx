import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkspaceTab from '@/modules/workspace/tabs/WorkspaceTab';
import { WorkspaceData } from '@/modules/workspace/types/Types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key: string, fallback?: string) => fallback || key),
  })),
}));

// Mock the UI components
vi.mock('../../../src/shared/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="card-description">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
}));

vi.mock('../../../src/shared/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
}));

vi.mock('@/shared/components/ui/scroll-area', () => ({
  ScrollArea: React.forwardRef<any, any>(({ children, ...props }, ref) => {
    const divRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => ({
      ...divRef.current,
      scrollTo: () => {
        // Mock scrollTo
      },
    }));
    return (
      <div data-testid="scroll-area" ref={divRef} {...props}>
        {children}
      </div>
    );
  }),
}));

vi.mock('../../../src/shared/components/ui/select', () => ({
  default: ({ value, onChange, children, options, label }: any) => (
    <div>
      {label && <label>{label}</label>}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
    </div>
  ),
}));

vi.mock('../../../src/shared/LLM/config', () => ({
  AvailableLLMs: {
    Groq: [{ name: 'llama3-8b', displayName: 'Llama 3 8B', id: 'llama3-8b' }],
    OpenAI: [{ name: 'gpt-4', displayName: 'GPT-4', id: 'gpt-4' }],
  },
}));

vi.mock('../../../src/shared/LLM/LLMsRegistry', () => ({
  llmsRegistry: {
    listProviders: vi.fn(() => []),
    getProviderModels: vi.fn(() => []),
  },
}));

const mockWorkspaceData: WorkspaceData = {
  id: '1',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  name: 'Test Workspace',
  description: 'A test workspace',
  mainLLM: { provider: 'Groq', model: { name: 'Llama 3.1 8B', id: 'llama-3.1-8b-instant' } },
  apiKey: 'test-key',
  useSavedCredentials: false,
  agents: [],
  tasks: [],
  connections: [],
  workflows: [],
  mcpTools: [],
  trigger: null,
};

const renderWorkspaceTab = (props: Partial<React.ComponentProps<typeof WorkspaceTab>> = {}) => {
  return render(
    <WorkspaceTab
      workspaceData={mockWorkspaceData}
      {...props}
    />
  );
};

describe('WorkspaceTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders workspace information correctly', () => {
    renderWorkspaceTab();

    expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    expect(screen.getByText('A test workspace')).toBeInTheDocument();
  });

  it('displays workspace ID and timestamps', () => {
    renderWorkspaceTab();

    expect(screen.getByText('Workspace ID')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Last Updated')).toBeInTheDocument();
  });

  it('enters edit mode when edit button is clicked', () => {
    renderWorkspaceTab();

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue('Test Workspace')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A test workspace')).toBeInTheDocument();
  });

  it('shows confirm and cancel buttons in edit mode', () => {
    renderWorkspaceTab();

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('calls onUpdateWorkspace when saving changes', async () => {
    const mockOnUpdateWorkspace = vi.fn().mockResolvedValue(undefined);
    renderWorkspaceTab({ onUpdateWorkspace: mockOnUpdateWorkspace });

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const nameInput = screen.getByDisplayValue('Test Workspace');
    fireEvent.change(nameInput, { target: { value: 'Updated Workspace' } });

    const descriptionInput = screen.getByDisplayValue('A test workspace');
    fireEvent.change(descriptionInput, { target: { value: 'Updated description' } });

    const saveButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdateWorkspace).toHaveBeenCalledWith({
        name: 'Updated Workspace',
        description: 'Updated description',
        mainLLM: { provider: 'Groq', model: { name: 'Llama 3.1 8B', id: 'llama-3.1-8b-instant' } },
        apiKey: 'test-key',
        useSavedCredentials: false,
      });
    });
  });

  it('exits edit mode after saving', async () => {
    const mockOnUpdateWorkspace = vi.fn().mockResolvedValue(undefined);
    renderWorkspaceTab({ onUpdateWorkspace: mockOnUpdateWorkspace });

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const saveButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });
  });

  it('cancels editing and restores original values', () => {
    renderWorkspaceTab();

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const nameInput = screen.getByDisplayValue('Test Workspace');
    fireEvent.change(nameInput, { target: { value: 'Changed Name' } });

    const descriptionInput = screen.getByDisplayValue('A test workspace');
    fireEvent.change(descriptionInput, { target: { value: 'Changed description' } });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    expect(screen.getByText('A test workspace')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Changed Name')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Changed description')).not.toBeInTheDocument();
  });

  it('notifies parent about edit status changes', () => {
    const mockOnEditStatusChange = vi.fn();
    renderWorkspaceTab({ onEditStatusChange: mockOnEditStatusChange });

    expect(mockOnEditStatusChange).toHaveBeenCalledWith(false);

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(mockOnEditStatusChange).toHaveBeenCalledWith(true);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnEditStatusChange).toHaveBeenCalledWith(false);
  });

  it('displays main LLM information', () => {
    renderWorkspaceTab();

    expect(screen.getByText('Main LLM')).toBeInTheDocument();
    expect(screen.getByText('Llama 3.1 8B')).toBeInTheDocument();
  });

  it('shows LLM selection dropdowns in edit mode', () => {
    renderWorkspaceTab();

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
  });

  it('displays API key configuration in edit mode', () => {
    renderWorkspaceTab();

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByText('API Configuration')).toBeInTheDocument();
    expect(screen.getByText('New Key')).toBeInTheDocument();
    expect(screen.getByText('Environment Variables')).toBeInTheDocument();
  });

  it('shows API key input when "New Key" is selected', () => {
    renderWorkspaceTab();

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const newKeyButton = screen.getByText('New Key');
    fireEvent.click(newKeyButton);

    expect(screen.getByPlaceholderText('Enter API key')).toBeInTheDocument();
  });

  it('allows changing API key input', () => {
    renderWorkspaceTab();

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const apiKeyInput = screen.getByPlaceholderText('Enter API key');
    fireEvent.change(apiKeyInput, { target: { value: 'new-api-key' } });

    expect(apiKeyInput).toHaveValue('new-api-key');
  });

  it('switches between new key and environment variables', () => {
    renderWorkspaceTab();

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByPlaceholderText('Enter API key')).toBeInTheDocument();

    const envVarButton = screen.getByText('Environment Variables');
    fireEvent.click(envVarButton);

    expect(screen.getByText('Environment Variable')).toBeInTheDocument();
  });

  it('syncs form values when workspace data changes', () => {
    const { rerender } = renderWorkspaceTab();

    const updatedWorkspaceData = {
      ...mockWorkspaceData,
      name: 'Updated Name',
      description: 'Updated Description',
    };

    rerender(
      <WorkspaceTab
        workspaceData={updatedWorkspaceData}
      />
    );

    expect(screen.getByText('Updated Name')).toBeInTheDocument();
    expect(screen.getByText('Updated Description')).toBeInTheDocument();
  });

  it('handles workspace with no description', () => {
    const workspaceWithoutDescription = {
      ...mockWorkspaceData,
      description: '',
    };

    render(<WorkspaceTab workspaceData={workspaceWithoutDescription} />);

    expect(screen.getByText('No description provided')).toBeInTheDocument();
  });

  it('handles workspace with no name', () => {
    const workspaceWithoutName = {
      ...mockWorkspaceData,
      name: '',
    };

    render(<WorkspaceTab workspaceData={workspaceWithoutName} />);

    expect(screen.getByText('Content Creation')).toBeInTheDocument();
  });
});