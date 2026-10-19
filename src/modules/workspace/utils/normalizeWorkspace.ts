/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
    WITHOUT WARRANTY OF ANY KIND, either express or implied.
    See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { WorkspaceData } from "../types/Types";

/**
 * Normalizes workspace data that was deserialized from disk or from an encrypted
 * payload.
 *
 * `WorkspaceData.environmentVariables` is required at the type level, but
 * workspaces persisted before the field was introduced omit it. A JSON cast
 * does not provide a runtime default, so consumers such as
 * `EnviromentVariableTab` would receive `undefined` and crash. Fill the field
 * with an empty array when it is missing.
 */
export const normalizeWorkspaceData = (data: WorkspaceData): WorkspaceData => {
  if (Array.isArray(data.environmentVariables)) {
    return data;
  }
  return { ...data, environmentVariables: [] };
};
