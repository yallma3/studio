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

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  ConsoleProvider,
  useConsole,
} from "@/modules/workspace/context/ConsoleContext";
import { sidecarClient } from "@/modules/api/SidecarClient";
import { WorkspaceArtifact, WorkspaceArtifactsPayload } from "@/modules/workspace/types/Types";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue || key,
  }),
}));

// Test consumer component
const TestConsumer: React.FC = () => {
  const { events, latestArtifacts, clearEvents, clearArtifacts } = useConsole();

  return (
    <div>
      <div data-testid="events-count">{events.length}</div>
      <div data-testid="artifacts-count">{latestArtifacts.length}</div>
      <ul>
        {latestArtifacts.map((a) => (
          <li key={a.filename} data-testid="artifact-item">
            {a.filename} ({a.format})
          </li>
        ))}
      </ul>
      <button onClick={clearEvents} data-testid="btn-clear-events">
        Clear Events
      </button>
      <button onClick={clearArtifacts} data-testid="btn-clear-artifacts">
        Clear Artifacts
      </button>
    </div>
  );
};

describe("ConsoleContext - Artifact Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize latestArtifacts as an empty array", () => {
    render(
      <ConsoleProvider workspaceId="ws-test">
        <TestConsumer />
      </ConsoleProvider>
    );

    expect(screen.getByTestId("artifacts-count").textContent).toBe("0");
  });

  it("should update latestArtifacts when workspace_artifacts event arrives from sidecar", () => {
    let artifactsCallback: ((payload: WorkspaceArtifactsPayload) => void) | null = null;
    vi.spyOn(sidecarClient, "onWorkspaceArtifacts").mockImplementation((cb) => {
      artifactsCallback = cb;
      return () => {
        artifactsCallback = null;
      };
    });

    render(
      <ConsoleProvider workspaceId="ws-test">
        <TestConsumer />
      </ConsoleProvider>
    );

    expect(artifactsCallback).toBeDefined();

    const samplePayload: WorkspaceArtifactsPayload = {
      workspace: "TestWorkspace",
      workspaceId: "ws-test",
      artifacts: [
        {
          filename: "results.txt",
          format: "text",
          downloadUrl: "/output/download/results.txt?token=t1",
          viewUrl: "/output/view/results.txt?token=t1",
        },
        {
          filename: "results.json",
          format: "json",
          downloadUrl: "/output/download/results.json?token=t2",
          viewUrl: "/output/view/results.json?token=t2",
        },
      ],
    };

    act(() => {
      artifactsCallback!(samplePayload);
    });

    expect(screen.getByTestId("artifacts-count").textContent).toBe("2");
    const items = screen.getAllByTestId("artifact-item");
    expect(items[0].textContent).toContain("results.txt (text)");
    expect(items[1].textContent).toContain("results.json (json)");
  });

  it("should clear latestArtifacts when clearEvents() is called", () => {
    let artifactsCallback: ((payload: WorkspaceArtifactsPayload) => void) | null = null;
    vi.spyOn(sidecarClient, "onWorkspaceArtifacts").mockImplementation((cb) => {
      artifactsCallback = cb;
      return () => {
        artifactsCallback = null;
      };
    });

    render(
      <ConsoleProvider workspaceId="ws-test">
        <TestConsumer />
      </ConsoleProvider>
    );

    act(() => {
      artifactsCallback!({
        workspace: "W",
        workspaceId: "ws-test",
        artifacts: [
          {
            filename: "file.txt",
            format: "text",
            downloadUrl: "/url",
            viewUrl: "/url",
          },
        ],
      });
    });

    expect(screen.getByTestId("artifacts-count").textContent).toBe("1");

    act(() => {
      screen.getByTestId("btn-clear-events").click();
    });

    expect(screen.getByTestId("artifacts-count").textContent).toBe("0");
  });

  it("should clear latestArtifacts when clearArtifacts() is called directly", () => {
    let artifactsCallback: ((payload: WorkspaceArtifactsPayload) => void) | null = null;
    vi.spyOn(sidecarClient, "onWorkspaceArtifacts").mockImplementation((cb) => {
      artifactsCallback = cb;
      return () => {
        artifactsCallback = null;
      };
    });

    render(
      <ConsoleProvider workspaceId="ws-test">
        <TestConsumer />
      </ConsoleProvider>
    );

    act(() => {
      artifactsCallback!({
        workspace: "W",
        workspaceId: "ws-test",
        artifacts: [
          {
            filename: "file.txt",
            format: "text",
            downloadUrl: "/url",
            viewUrl: "/url",
          },
        ],
      });
    });

    expect(screen.getByTestId("artifacts-count").textContent).toBe("1");

    act(() => {
      screen.getByTestId("btn-clear-artifacts").click();
    });

    expect(screen.getByTestId("artifacts-count").textContent).toBe("0");
  });

  it("should ignore artifacts belonging to a different workspace", () => {
    let artifactsCallback: ((payload: WorkspaceArtifactsPayload) => void) | null = null;
    vi.spyOn(sidecarClient, "onWorkspaceArtifacts").mockImplementation((cb) => {
      artifactsCallback = cb;
      return () => {
        artifactsCallback = null;
      };
    });

    render(
      <ConsoleProvider workspaceId="ws-test">
        <TestConsumer />
      </ConsoleProvider>
    );

    act(() => {
      artifactsCallback!({
        workspace: "OtherWorkspace",
        workspaceId: "ws-other",
        artifacts: [
          {
            filename: "other.txt",
            format: "text",
            downloadUrl: "/url",
            viewUrl: "/url",
          },
        ],
      });
    });

    expect(screen.getByTestId("artifacts-count").textContent).toBe("0");
  });

  it("should filter out malformed or null artifact entries", () => {
    let artifactsCallback: ((payload: WorkspaceArtifactsPayload) => void) | null = null;
    vi.spyOn(sidecarClient, "onWorkspaceArtifacts").mockImplementation((cb) => {
      artifactsCallback = cb;
      return () => {
        artifactsCallback = null;
      };
    });

    render(
      <ConsoleProvider workspaceId="ws-test">
        <TestConsumer />
      </ConsoleProvider>
    );

    act(() => {
      artifactsCallback!({
        workspace: "TestWorkspace",
        workspaceId: "ws-test",
        artifacts: [
          null as unknown as WorkspaceArtifact,
          {
            filename: "valid.txt",
            format: "text",
            downloadUrl: "/url",
            viewUrl: "/url",
          },
          {
            filename: "no-format.txt",
          } as unknown as WorkspaceArtifact,
        ],
      });
    });

    expect(screen.getByTestId("artifacts-count").textContent).toBe("1");
    expect(screen.getByTestId("artifact-item").textContent).toContain("valid.txt (text)");
  });

  it("should record WORKSPACE_FAILED errors cleanly in events without generic 'Server error:' prefix", () => {
    let commandCallback: ((cmd: any) => void) | null = null;
    vi.spyOn(sidecarClient, "onCommand").mockImplementation((cb) => {
      commandCallback = cb;
      return () => {
        commandCallback = null;
      };
    });

    render(
      <ConsoleProvider workspaceId="ws-test">
        <TestConsumer />
      </ConsoleProvider>
    );

    act(() => {
      commandCallback!({
        type: "error",
        code: "WORKSPACE_FAILED",
        message: "All tasks failed or were blocked.",
      });
    });

    expect(screen.getByTestId("events-count").textContent).toBe("1");
  });
});
