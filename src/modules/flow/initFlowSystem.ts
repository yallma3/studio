/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { nodeRegistry } from "./types/NodeRegistry.ts";

export async function initFlowSystem() {
  try {
    const response = await fetch("http://localhost:3001/workflow/nodes");
    if (!response.ok) {
      throw new Error(
        `Failed to fetch nodes: ${response.status} ${response.statusText}`
      );
    }
    const res = await response.json();
    // Register each node from the fetched nodes array with the nodeRegistry
    if (Array.isArray(res.data.nodes)) {
      for (const node of res.data.nodes) {
        nodeRegistry.registerNode(node);
      }
    }
    nodeRegistry.registerCategories(res.data.categories);
  } catch (error) {
    console.error("Error fetching workflow nodes:", error);
  }
}

export async function loadModule(name: string) {
  const path = `/custom-modules/${name}.js`;
  const response = await fetch(path);
  const code = await response.text();

  // Option 1: Use dynamic `Function` for isolated context
  const moduleExports = {};
  const fn = new Function("exports", code);
  fn(moduleExports);
  return moduleExports;

  // Option 2 (if using ESM): use dynamic `import()` but you need to serve it with correct MIME
  //return await import(path); // Ensure the server serves the file with the correct MIME type
}
