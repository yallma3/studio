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
import { ResultDialog } from "@/modules/flow/components/ResultDialog";
import { NodeType } from "@/modules/flow/types/NodeTypes";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string, options?: any) => {
      if (key === "resultDialog.title") {
        const nodeName = options?.nodeName || "Unknown";
        return `${nodeName} Result`;
      }
      if (key === "resultDialog.noData") return "No result data available";
      if (key === "common.close") return "Close";
      return defaultValue || key;
    },
  }),
}));

describe("ResultDialog Component", () => {
  const mockOnClose = vi.fn();

  const mockNode: NodeType = {
    id: 1,
    category: "Test",
    title: "Test Node",
    nodeType: "TextNode",
    nodeValue: "test value",
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    sockets: [],
    result: "Test result data",
  };

  const defaultProps = {
    node: mockNode,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render dialog with node title", () => {
      render(<ResultDialog {...defaultProps} />);

      expect(screen.getByText("Test Node Result")).toBeInTheDocument();
      expect(screen.getByText("Test result data")).toBeInTheDocument();
    });

    it('should render "No result data available" when result is undefined', () => {
      const nodeWithoutResult = { ...mockNode, result: undefined };
      render(<ResultDialog {...defaultProps} node={nodeWithoutResult} />);

      expect(screen.getByText("No result data available")).toBeInTheDocument();
    });

    it("should render object results as JSON", () => {
      const nodeWithObjectResult = {
        ...mockNode,
        result: { key: "value", number: 42 },
      };
      render(<ResultDialog {...defaultProps} node={nodeWithObjectResult} />);

      expect(screen.getByText(/"key": "value"/)).toBeInTheDocument();
      expect(screen.getByText(/"number": 42/)).toBeInTheDocument();
    });

    it("should render non-string results as strings", () => {
      const nodeWithNumberResult = { ...mockNode, result: 12345 };
      render(<ResultDialog {...defaultProps} node={nodeWithNumberResult} />);

      expect(screen.getByText("12345")).toBeInTheDocument();
    });
  });

  describe("Dialog interactions", () => {
    it("should call onClose when close button is clicked", () => {
      render(<ResultDialog {...defaultProps} />);

      const closeButton = screen.getByLabelText("Close");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when Close button is clicked", () => {
      render(<ResultDialog {...defaultProps} />);

      const closeButton = screen.getByText("Close");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when clicking outside the dialog", () => {
      render(<ResultDialog {...defaultProps} />);

      const backdrop = screen.getByRole("dialog").parentElement;
      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not call onClose when clicking inside the dialog content", () => {
      render(<ResultDialog {...defaultProps} />);

      const dialogContent = screen.getByText("Test result data").closest("div");
      fireEvent.click(dialogContent!);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Keyboard interactions", () => {
    it("should call onClose when Escape key is pressed", () => {
      render(<ResultDialog {...defaultProps} />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not call onClose for other keys", () => {
      render(<ResultDialog {...defaultProps} />);

      fireEvent.keyDown(window, { key: "Enter" });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<ResultDialog {...defaultProps} />);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "result-dialog-title");
    });

    it("should have proper heading with id", () => {
      render(<ResultDialog {...defaultProps} />);

      const heading = screen.getByText("Test Node Result");
      expect(heading).toHaveAttribute("id", "result-dialog-title");
    });

    it("should have proper close button aria-label", () => {
      render(<ResultDialog {...defaultProps} />);

      expect(screen.getByLabelText("Close")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have monospace font for result content", () => {
      render(<ResultDialog {...defaultProps} />);

      const resultContent = screen.getByText("Test result data").closest("div");
      expect(resultContent).toHaveClass("font-mono");
    });
  });
});
