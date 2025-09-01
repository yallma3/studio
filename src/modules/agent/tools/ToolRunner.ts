// tools.ts
import { ToolConfig, Task } from "../../workspace/types/Types";

export async function runTool(tool: ToolConfig, task: Task): Promise<string> {
  return `Executed tool "${tool.name}" on task "${task.name}"`;
}
