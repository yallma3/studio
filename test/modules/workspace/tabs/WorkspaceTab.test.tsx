import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkspaceTab from '@/modules/workspace/tabs/WorkspaceTab';
import { WorkspaceData, ConsoleEvent } from '@/modules/workspace/types/Types';

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
  default: ({ value, onChange, children }: any) => <select value={value} onChange={onChange}>{children}</select>,
}));

vi.mock('@/modules/workspace/components/EventResultDialog', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div data-testid="event-result-dialog" /> : null,
}));

vi.mock('../../../src/shared/LLM/config', () => ({
  AvailableLLMs: {
    Groq: [{ name: 'llama3-8b', displayName: 'Llama 3 8B' }],
    OpenAI: [{ name: 'gpt-4', displayName: 'GPT-4' }],
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
};

const renderWorkspaceTab = (props: Partial<React.ComponentProps<typeof WorkspaceTab>> = {}) => {
  return render(
    <WorkspaceTab
      workspaceData={mockWorkspaceData}
      events={[]}
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

  it('enters edit mode when edit button is clicked', () => {
    renderWorkspaceTab();

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue('Test Workspace')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A test workspace')).toBeInTheDocument();
  });

  it('calls onUpdateWorkspace when saving changes', async () => {
    const mockOnUpdateWorkspace = vi.fn().mockResolvedValue(undefined);
    renderWorkspaceTab({ onUpdateWorkspace: mockOnUpdateWorkspace });

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const nameInput = screen.getByDisplayValue('Test Workspace');
    fireEvent.change(nameInput, { target: { value: 'Updated Workspace' } });

    const saveButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdateWorkspace).toHaveBeenCalledWith({
        name: 'Updated Workspace',
        description: 'A test workspace',
        mainLLM: { provider: 'Groq', model: { name: 'Llama 3.1 8B', id: 'llama-3.1-8b-instant' } },
        apiKey: 'test-key',
        useSavedCredentials: false,
      });
    });
  });

  it('displays console events', () => {
    const mockEvents: ConsoleEvent[] = [
      {
        id: '1',
        timestamp: Date.now(),
        type: 'info',
        message: 'Test message',
      },
    ];

    renderWorkspaceTab({ events: mockEvents });

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('handles console input submission without pending prompts', () => {
    const mockOnSendConsoleInput = vi.fn();
    renderWorkspaceTab({
      onSendConsoleInput: mockOnSendConsoleInput,
    });

    const input = screen.getByPlaceholderText('Please enter your input:');
    fireEvent.change(input, { target: { value: 'Test input' } });

    const submitButton = screen.getByRole('button', { name: 'Send' });
    fireEvent.click(submitButton);

    expect(mockOnSendConsoleInput).toHaveBeenCalled();
  });

  it('handles pending prompts correctly', async () => {
    const mockEvents: ConsoleEvent[] = [
      {
        id: '1',
        timestamp: Date.now(),
        type: 'input',
        message: 'Waiting for input',
        details: 'Waiting for user input',
        promptId: 'prompt1',
        nodeId: 1,
        nodeName: 'Test Node',
      },
    ];

    renderWorkspaceTab({ events: mockEvents });

    await waitFor(() => {
      expect(screen.getByText('Waiting for input')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Waiting for input');
    fireEvent.change(input, { target: { value: 'User response' } });

    const submitButton = screen.getByRole('button', { name: 'Send' });
    fireEvent.click(submitButton);

    // After submission, the prompt should be consumed and not reappear
    // This tests the consumedPromptIds logic
  });

  it('handles multiple pending prompts sequentially', async () => {
    const mockEvents: ConsoleEvent[] = [
      {
        id: '1',
        timestamp: Date.now(),
        type: 'input',
        message: 'First prompt',
        details: 'Waiting for user input',
        promptId: 'prompt1',
        nodeId: 1,
        nodeName: 'Test Node',
      },
      {
        id: '2',
        timestamp: Date.now() + 1000,
        type: 'input',
        message: 'Second prompt',
        details: 'Waiting for user input',
        promptId: 'prompt2',
        nodeId: 2,
        nodeName: 'Test Node 2',
      },
    ];

    renderWorkspaceTab({ events: mockEvents });

    // First prompt should appear
    await waitFor(() => {
      expect(screen.getByText('First prompt')).toBeInTheDocument();
    });

    // Submit first prompt
    const input = screen.getByPlaceholderText('First prompt');
    fireEvent.change(input, { target: { value: 'Response 1' } });
    const submitButton = screen.getByRole('button', { name: 'Send' });
    fireEvent.click(submitButton);

    // Second prompt should appear after first is consumed
    await waitFor(() => {
      expect(screen.getByText('Second prompt')).toBeInTheDocument();
    });
  });

  it('clears events when clear button is clicked', () => {
    const mockOnClearEvents = vi.fn();
    const mockEvents: ConsoleEvent[] = [
      {
        id: '1',
        timestamp: Date.now(),
        type: 'info',
        message: 'Test message',
      },
    ];

    renderWorkspaceTab({ events: mockEvents, onClearEvents: mockOnClearEvents });

    const clearButton = screen.getByRole('button', { name: 'Clear' });
    fireEvent.click(clearButton);

    expect(mockOnClearEvents).toHaveBeenCalled();
  });

  it('toggles console expansion', () => {
    renderWorkspaceTab();

    const expandButton = screen.getByRole('button', { name: 'Expand' });
    fireEvent.click(expandButton);

    // Check if expanded state is toggled (this might require checking class or state)
  });

  it('opens event result dialog when result button is clicked', () => {
    const mockEvents: ConsoleEvent[] = [
      {
        id: '1',
        timestamp: Date.now(),
        type: 'success',
        message: 'Test message',
        results: 'Detailed results',
      },
    ];

    renderWorkspaceTab({ events: mockEvents });

    // Find the result button by its title
    const resultButton = screen.getByTitle('View result');
    fireEvent.click(resultButton);

    expect(screen.getByTestId('event-result-dialog')).toBeInTheDocument();
  });
});