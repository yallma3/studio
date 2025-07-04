/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { nodeRegistry } from '../types/NodeRegistry';

export async function loadNodeFromUrl(url: string): Promise<void> {
  try {
    // Fetch the module as text
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch external node from ${url}: ${response.statusText}`);
    }
    
    const moduleText = await response.text();
    
    // Create a blob URL to load as a module
    const blob = new Blob([moduleText], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Dynamic import (this requires proper CORS configuration on the server)
    const module = await import(/* @vite-ignore */ blobUrl);
    
    // Cleanup
    URL.revokeObjectURL(blobUrl);
    
    // If the module exports a register function, call it with the registry
    if (typeof module.register === 'function') {
      module.register(nodeRegistry);
    } else {
      console.warn('External node module does not export a register function');
    }
    
    console.log(`Successfully loaded external node from ${url}`);
  } catch (error) {
    console.error(`Error loading external node from ${url}:`, error);
    throw error;
  }
}