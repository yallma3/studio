import { WorkspaceData } from "../types/Types";
import { getWorkflow } from "./runtimeUtils";

export async function enrichWorkspace(
  ws: WorkspaceData
): Promise<Record<string, unknown>> {
  if (!ws.workflows?.length) {
    return { ...ws };
  }

  const fullWorkflows = await Promise.all(
    ws.workflows.map(async (wf) => {
      const fullWf = await getWorkflow(wf.id);
      if (fullWf?.canvasState) {
        return {
          ...wf,
          nodes: fullWf.canvasState.nodes,
          connections: fullWf.canvasState.connections,
        };
      }
      return wf;
    })
  );

  return { ...ws, workflows: fullWorkflows };
}
