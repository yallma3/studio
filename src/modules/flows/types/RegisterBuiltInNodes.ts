/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { nodeRegistry } from "./NodeRegistry";
import {
  createNumberNode,
  createGroqChatNode,
  createBooleanNode,
  createImageNode,
  createAddNode,
  createJoinNode,
} from "./NodeTypes";

export function registerBuiltInNodes(): void {
  nodeRegistry.registerNodeType("Number", createNumberNode);
  nodeRegistry.registerNodeType("Chat", createGroqChatNode);
  nodeRegistry.registerNodeType("Boolean", createBooleanNode);
  nodeRegistry.registerNodeType("Image", createImageNode);
  nodeRegistry.registerNodeType("Add", createAddNode);
  nodeRegistry.registerNodeType("Join", createJoinNode);
}
