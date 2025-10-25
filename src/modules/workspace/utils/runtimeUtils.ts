import { loadWorkflowFromFile, WorkflowFile } from "./workflowStorageUtils";

export async function getWorkflow(
  flowId: string
): Promise<WorkflowFile | null> {
  try {
    // Load the workflow file using the existing utility
    const workflow = await loadWorkflowFromFile(flowId);

    if (!workflow) {
      console.warn(`Flow not found: ${flowId}`);
      return null;
    }
    return workflow;
  } catch (error) {
    console.error(`Error loading flow ${flowId}:`, error);
    return null;
  }
}
