import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { McpEditDialog } from "@/modules/workspace/components/McpEditDialog";
import { McpToolFile } from "@/modules/workspace/utils/mcpStorageUtils";

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key: string, fallback: string) => fallback || key),
  })),
}));

describe("McpEditDialog", () => {
  const mockMcpTool: McpToolFile = {
    id: "mcp-1",
    name: "Test STDIO Tool",
    description: "A test tool for STDIO",
    type: "STDIO",
    parameters: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-everything"],
    },
    createdAt: 1000,
    updatedAt: 2000,
  };

  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn().mockResolvedValue(undefined);
  const baseUrl = "http://localhost:8000";

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders with pre-filled fields when open", () => {
    render(
      <McpEditDialog
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mcpTool={mockMcpTool}
        baseUrl={baseUrl}
      />
    );

    expect(screen.getByText("Edit MCP Tool")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test STDIO Tool")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A test tool for STDIO")).toBeInTheDocument();
    expect(screen.getByDisplayValue("npx")).toBeInTheDocument();
    expect(screen.getByDisplayValue("-y")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("@modelcontextprotocol/server-everything")
    ).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <McpEditDialog
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mcpTool={mockMcpTool}
        baseUrl={baseUrl}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("calls onClose when Cancel button is clicked", () => {
    render(
      <McpEditDialog
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mcpTool={mockMcpTool}
        baseUrl={baseUrl}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("allows adding and removing arguments for STDIO", () => {
    render(
      <McpEditDialog
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mcpTool={mockMcpTool}
        baseUrl={baseUrl}
      />
    );

    const addArgButton = screen.getByText("+ Add Argument");
    fireEvent.click(addArgButton);

    const inputs = screen.getAllByPlaceholderText("Enter argument...");
    expect(inputs.length).toBe(3);

    const removeButtons = screen.getAllByLabelText("Remove argument");
    fireEvent.click(removeButtons[0]);

    const remainingInputs = screen.getAllByPlaceholderText("Enter argument...");
    expect(remainingInputs.length).toBe(2);
  });

  it("performs health check and calls onSave when submitting valid form", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      status: 200,
      json: async () => ({ status: "ok" }),
    });

    render(
      <McpEditDialog
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mcpTool={mockMcpTool}
        baseUrl={baseUrl}
      />
    );

    const nameInput = screen.getByDisplayValue("Test STDIO Tool");
    fireEvent.change(nameInput, { target: { value: "Updated STDIO Tool" } });

    const saveButton = screen.getByRole("button", { name: "Save" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/mcp/health",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        id: "mcp-1",
        type: "mcp",
        name: "Updated STDIO Tool",
        description: "A test tool for STDIO",
        parameters: {
          type: "STDIO",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-everything"],
        },
      });
    });
  });

  it("shows error and does not call onSave when health check fails", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      status: 500,
    });

    render(
      <McpEditDialog
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mcpTool={mockMcpTool}
        baseUrl={baseUrl}
      />
    );

    const saveButton = screen.getByRole("button", { name: "Save" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText("Server cannot connect. Please check your configuration.")
      ).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });
});
