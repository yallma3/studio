import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AiFlowsTab from "@/modules/workspace/tabs/AiFlowsTab";
import { WorkspaceData } from "@/modules/workspace/types/Types";
import * as workflowStorageUtils from "@/modules/workspace/utils/workflowStorageUtils";
import * as mcpStorageUtils from "@/modules/workspace/utils/mcpStorageUtils";
import * as storageUtils from "@/modules/workspace/utils/storageUtils";

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key: string, fallback: string) => fallback || key),
  })),
}));

vi.mock("@/modules/flow/NodeCanvas", () => ({
  default: ({ workflowMeta, onReturnToHome }: any) => (
    <div data-testid="node-canvas">
      <span>Editing: {workflowMeta?.name}</span>
      <button onClick={() => onReturnToHome()}>Return Home</button>
    </div>
  ),
}));

vi.mock("@/shared/components/AddToolOrWorkflowDialog", () => ({
  default: () => <div data-testid="add-dialog" />,
}));

vi.mock("@/modules/workspace/components/McpWorkflowImportDialog", () => ({
  McpWorkflowImportDialog: () => <div data-testid="import-dialog" />,
}));

vi.mock("@/shared/components/DeleteConfirmationDialog", () => ({
  DeleteConfirmationDialog: () => <div data-testid="delete-dialog" />,
}));

describe("AiFlowsTab", () => {
  const mockWorkflows: workflowStorageUtils.WorkflowFile[] = [
    {
      id: "wf-1",
      name: "First Workflow",
      description: "Description of first workflow",
      createdAt: 1000,
      updatedAt: 5000, // newest updatedAt
      canvasState: {
        graphId: "gf-1",
        graphName: "First Workflow",
        nodes: [{ id: 1, type: "test", title: "Test", inputs: [], outputs: [], position: { x: 0, y: 0 }, data: {} }],
        connections: [],
        nextNodeId: 2,
      },
    },
    {
      id: "wf-2",
      name: "Second Workflow",
      description: "Description of second workflow",
      createdAt: 2000,
      updatedAt: 3000,
      canvasState: {
        graphId: "gf-2",
        graphName: "Second Workflow",
        nodes: [],
        connections: [],
        nextNodeId: 1,
      },
    },
  ];

  const mockMcpTools: mcpStorageUtils.McpToolFile[] = [
    {
      id: "mcp-1",
      name: "Alpha MCP",
      description: "Alpha description",
      type: "STDIO",
      parameters: { command: "node", args: ["server.js"] },
      createdAt: 1000,
      updatedAt: 9000, // newest updatedAt
    },
    {
      id: "mcp-2",
      name: "Beta MCP",
      description: "Beta description",
      type: "HTTP",
      parameters: { url: "http://localhost:3000" },
      createdAt: 2000,
      updatedAt: 4000,
    },
  ];

  // Workspace explicitly defines order: wf-2 before wf-1, and mcp-2 before mcp-1
  const mockWorkspaceData: WorkspaceData = {
    id: "ws-1",
    name: "Test Workspace",
    description: "Workspace description",
    mainLLM: { provider: "OpenAI", model: { id: "gpt-4", name: "GPT-4" } },
    apiKey: "key",
    useSavedCredentials: false,
    trigger: null,
    tasks: [],
    connections: [],
    agents: [],
    workflows: [
      { id: "wf-2", name: "Second Workflow", description: "Description of second workflow" },
      { id: "wf-1", name: "First Workflow", description: "Description of first workflow" },
    ],
    mcpTools: [
      { id: "mcp-2", type: "mcp", name: "Beta MCP", description: "Beta description" },
      { id: "mcp-1", type: "mcp", name: "Alpha MCP", description: "Alpha description" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(workflowStorageUtils, "loadAllWorkflowsFromFiles").mockResolvedValue(mockWorkflows);
    vi.spyOn(mcpStorageUtils, "loadAllMcpToolsFromFiles").mockResolvedValue(mockMcpTools);
    vi.spyOn(workflowStorageUtils, "updateWorkflowFile").mockImplementation(async (id, updates) => {
      const existing = mockWorkflows.find((w) => w.id === id);
      if (!existing) return null;
      return { ...existing, ...updates, updatedAt: Date.now() };
    });
    vi.spyOn(mcpStorageUtils, "updateMcpToolFile").mockImplementation(async (id, updates) => {
      const existing = mockMcpTools.find((m) => m.id === id);
      if (!existing) return null;
      return { ...existing, ...updates, updatedAt: Date.now() };
    });
    vi.spyOn(storageUtils, "saveWorkspaceToDefaultLocation").mockResolvedValue(undefined);
  });

  it("maintains stable card ordering matching workspaceData rather than updatedAt", async () => {
    render(
      <AiFlowsTab
        workspaceData={mockWorkspaceData}
        baseUrl="http://localhost:8000"
      />
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("Second Workflow")).toBeInTheDocument();
    });

    const workflowHeadings = screen.getAllByRole("heading", { level: 3 });
    const headingTexts = workflowHeadings.map((h) => h.textContent);

    // wf-2 must come before wf-1 despite wf-1 having a newer updatedAt
    const secondWorkflowIndex = headingTexts.indexOf("Second Workflow");
    const firstWorkflowIndex = headingTexts.indexOf("First Workflow");
    expect(secondWorkflowIndex).toBeLessThan(firstWorkflowIndex);

    // mcp-2 must come before mcp-1 despite mcp-1 having a newer updatedAt
    const betaMcpIndex = headingTexts.indexOf("Beta MCP");
    const alphaMcpIndex = headingTexts.indexOf("Alpha MCP");
    expect(betaMcpIndex).toBeLessThan(alphaMcpIndex);
  });

  it("does not render the misplaced tagline CREATE AND MANAGE YOUR AI DEVELOPMENT WORKSPACES", async () => {
    render(
      <AiFlowsTab
        workspaceData={mockWorkspaceData}
        baseUrl="http://localhost:8000"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("First Workflow")).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/CREATE AND MANAGE YOUR AI DEVELOPMENT WORKSPACES/i)
    ).toBeNull();
  });

  it("renders workflow cards with 'Edit Description' and 'Design Workflow' tooltips", async () => {
    render(
      <AiFlowsTab
        workspaceData={mockWorkspaceData}
        baseUrl="http://localhost:8000"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Second Workflow")).toBeInTheDocument();
    });

    const editDescButtons = screen.getAllByTitle("Edit Description");
    expect(editDescButtons.length).toBe(2);

    const designWorkflowButtons = screen.getAllByTitle("Design Workflow");
    expect(designWorkflowButtons.length).toBe(2);
  });

  it("opens 'Edit Workflow Description' dialog when clicking 'Edit Description'", async () => {
    render(
      <AiFlowsTab
        workspaceData={mockWorkspaceData}
        baseUrl="http://localhost:8000"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Second Workflow")).toBeInTheDocument();
    });

    const editDescButtons = screen.getAllByTitle("Edit Description");
    fireEvent.click(editDescButtons[0]); // Click on Second Workflow's edit button

    expect(screen.getByText("Edit Workflow Description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Second Workflow")).toBeInTheDocument();
  });

  it("launches NodeCanvas when clicking 'Design Workflow'", async () => {
    render(
      <AiFlowsTab
        workspaceData={mockWorkspaceData}
        baseUrl="http://localhost:8000"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("First Workflow")).toBeInTheDocument();
    });

    const designButtons = screen.getAllByTitle("Design Workflow");
    fireEvent.click(designButtons[1]); // Click First Workflow

    expect(screen.getByTestId("node-canvas")).toBeInTheDocument();
    expect(screen.getByText("Editing: First Workflow")).toBeInTheDocument();
  });

  it("renders MCP cards with 'Edit MCP Tool' button and opens McpEditDialog", async () => {
    render(
      <AiFlowsTab
        workspaceData={mockWorkspaceData}
        baseUrl="http://localhost:8000"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Beta MCP")).toBeInTheDocument();
    });

    const editMcpButtons = screen.getAllByTitle("Edit MCP Tool");
    expect(editMcpButtons.length).toBe(2);

    fireEvent.click(editMcpButtons[0]); // Click Beta MCP

    expect(screen.getByRole("heading", { name: "Edit MCP Tool" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Beta MCP")).toBeInTheDocument();
  });
});
