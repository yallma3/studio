/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

// Utility functions for canvas coordinate transformations

/**
 * Convert screen coordinates to canvas coordinates (accounting for zoom and pan)
 */
export const screenToCanvas = (
  screenX: number, 
  screenY: number, 
  transform: { scale: number; translateX: number; translateY: number }
) => {
  return {
    x: (screenX - transform.translateX) / transform.scale,
    y: (screenY - transform.translateY) / transform.scale
  };
};

/**
 * Convert canvas coordinates to screen coordinates (accounting for zoom and pan)
 */
export const canvasToScreen = (
  canvasX: number, 
  canvasY: number, 
  transform: { scale: number; translateX: number; translateY: number }
) => {
  return {
    x: canvasX * transform.scale + transform.translateX,
    y: canvasY * transform.scale + transform.translateY
  };
};

/**
 * Reset canvas transform to default (100% zoom, centered)
 */
export const resetTransform = () => {
  return {
    scale: 1,
    translateX: 0,
    translateY: 0
  };
};

/**
 * Zoom in on the canvas
 */
export const zoomIn = (transform: { scale: number; translateX: number; translateY: number }) => {
  return {
    ...transform,
    scale: Math.min(2, transform.scale + 0.1)
  };
};

/**
 * Zoom out on the canvas
 */
export const zoomOut = (transform: { scale: number; translateX: number; translateY: number }) => {
  return {
    ...transform,
    scale: Math.max(0.1, transform.scale - 0.1)
  };
}; 