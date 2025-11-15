/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect } from 'vitest';
import { screenToCanvas, canvasToScreen, resetTransform, zoomIn, zoomOut } from '@/modules/flow/utils/canvasTransforms';

describe('canvasTransforms', () => {
  const mockTransform = {
    scale: 1.5,
    translateX: 100,
    translateY: 50,
  };

  describe('screenToCanvas', () => {
    it('should convert screen coordinates to canvas coordinates', () => {
      const result = screenToCanvas(200, 100, mockTransform);

      // (200 - 100) / 1.5 = 66.666...
      // (100 - 50) / 1.5 = 33.333...
      expect(result.x).toBeCloseTo(200 / 3, 5);
      expect(result.y).toBeCloseTo(100 / 3, 5);
    });

    it('should handle zero transform values', () => {
      const zeroTransform = { scale: 1, translateX: 0, translateY: 0 };
      const result = screenToCanvas(200, 100, zeroTransform);

      expect(result.x).toBe(200);
      expect(result.y).toBe(100);
    });

    it('should handle negative coordinates', () => {
      const result = screenToCanvas(-50, -25, mockTransform);

      expect(result.x).toBeCloseTo(-100, 3);
      expect(result.y).toBeCloseTo(-50, 3);
    });
  });

  describe('canvasToScreen', () => {
    it('should convert canvas coordinates to screen coordinates', () => {
      const result = canvasToScreen(50, 25, mockTransform);

      // 50 * 1.5 + 100 = 175
      // 25 * 1.5 + 50 = 87.5
      expect(result.x).toBe(175);
      expect(result.y).toBe(87.5);
    });

    it('should handle zero transform values', () => {
      const zeroTransform = { scale: 1, translateX: 0, translateY: 0 };
      const result = canvasToScreen(200, 100, zeroTransform);

      expect(result.x).toBe(200);
      expect(result.y).toBe(100);
    });

    it('should handle negative coordinates', () => {
      const result = canvasToScreen(-50, -25, mockTransform);

      expect(result.x).toBe(25); // -50 * 1.5 + 100 = 25
      expect(result.y).toBe(12.5); // -25 * 1.5 + 50 = 12.5
    });
  });

  describe('resetTransform', () => {
    it('should return default transform values', () => {
      const result = resetTransform();

      expect(result).toEqual({
        scale: 1,
        translateX: 0,
        translateY: 0,
      });
    });
  });

  describe('zoomIn', () => {
    it('should increase scale by 0.1', () => {
      const result = zoomIn(mockTransform);

      expect(result.scale).toBe(1.6);
      expect(result.translateX).toBe(100);
      expect(result.translateY).toBe(50);
    });

    it('should not exceed maximum scale of 2', () => {
      const highScaleTransform = { ...mockTransform, scale: 1.95 };
      const result = zoomIn(highScaleTransform);

      expect(result.scale).toBe(2);
    });

    it('should handle scale exactly at maximum', () => {
      const maxScaleTransform = { ...mockTransform, scale: 2 };
      const result = zoomIn(maxScaleTransform);

      expect(result.scale).toBe(2);
    });
  });

  describe('zoomOut', () => {
    it('should decrease scale by 0.1', () => {
      const result = zoomOut(mockTransform);

      expect(result.scale).toBe(1.4);
      expect(result.translateX).toBe(100);
      expect(result.translateY).toBe(50);
    });

    it('should not go below minimum scale of 0.1', () => {
      const lowScaleTransform = { ...mockTransform, scale: 0.15 };
      const result = zoomOut(lowScaleTransform);

      expect(result.scale).toBe(0.1);
    });

    it('should handle scale exactly at minimum', () => {
      const minScaleTransform = { ...mockTransform, scale: 0.1 };
      const result = zoomOut(minScaleTransform);

      expect(result.scale).toBe(0.1);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain precision through screenToCanvas -> canvasToScreen', () => {
      const screenCoords = { x: 300, y: 200 };
      const canvasCoords = screenToCanvas(screenCoords.x, screenCoords.y, mockTransform);
      const backToScreen = canvasToScreen(canvasCoords.x, canvasCoords.y, mockTransform);

      expect(backToScreen.x).toBeCloseTo(screenCoords.x, 10);
      expect(backToScreen.y).toBeCloseTo(screenCoords.y, 10);
    });

    it('should maintain precision through canvasToScreen -> screenToCanvas', () => {
      const canvasCoords = { x: 100, y: 75 };
      const screenCoords = canvasToScreen(canvasCoords.x, canvasCoords.y, mockTransform);
      const backToCanvas = screenToCanvas(screenCoords.x, screenCoords.y, mockTransform);

      expect(backToCanvas.x).toBeCloseTo(canvasCoords.x, 10);
      expect(backToCanvas.y).toBeCloseTo(canvasCoords.y, 10);
    });
  });
});