/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
    If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
    WITHOUT WARRANTY OF ANY KIND, either express or implied.
    See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type React from 'react';
import { useCanvasTransform } from '@/modules/flow/hooks/useCanvasTransform';

// Mock the canvasTransforms utilities
vi.mock('@/modules/flow/utils/canvasTransforms', () => ({
  resetTransform: vi.fn(() => ({ scale: 1, translateX: 0, translateY: 0 })),
  zoomIn: vi.fn((transform) => ({ ...transform, scale: transform.scale * 1.2 })),
  zoomOut: vi.fn((transform) => ({ ...transform, scale: transform.scale / 1.2 })),
}));

import { resetTransform, zoomIn, zoomOut } from '@/modules/flow/utils/canvasTransforms';

describe('useCanvasTransform', () => {
  describe('initialization', () => {
    it('should initialize with default transform values', () => {
      const { result } = renderHook(() => useCanvasTransform());

      expect(result.current.transform).toEqual({
        scale: 1,
        translateX: 0,
        translateY: 0,
      });
      expect(result.current.isPanningActive).toBe(false);
    });
  });

  describe('resetView', () => {
    it('should reset transform to default values', () => {
      const { result } = renderHook(() => useCanvasTransform());

      // Modify transform first
      act(() => {
        result.current.setTransform({ scale: 2, translateX: 100, translateY: 50 });
      });

      expect(result.current.transform).toEqual({
        scale: 2,
        translateX: 100,
        translateY: 50,
      });

      // Reset view
      act(() => {
        result.current.resetView();
      });

      expect(result.current.transform).toEqual({
        scale: 1,
        translateX: 0,
        translateY: 0,
      });
      expect(resetTransform).toHaveBeenCalled();
    });
  });

  describe('zoom controls', () => {
    it('should zoom in correctly', () => {
      const { result } = renderHook(() => useCanvasTransform());

      act(() => {
        result.current.zoomIn();
      });

      expect(zoomIn).toHaveBeenCalledWith({ scale: 1, translateX: 0, translateY: 0 });
      expect(result.current.transform.scale).toBe(1.2);
    });

    it('should zoom out correctly', () => {
      const { result } = renderHook(() => useCanvasTransform());

      act(() => {
        result.current.zoomOut();
      });

      expect(zoomOut).toHaveBeenCalledWith({ scale: 1, translateX: 0, translateY: 0 });
      expect(result.current.transform.scale).toBe(1 / 1.2);
    });
  });

  describe('handleWheel', () => {
    it('should handle wheel zoom in', () => {
      const { result } = renderHook(() => useCanvasTransform());

      const mockEvent = {
        preventDefault: vi.fn(),
        deltaY: -100,
        clientX: 200,
        clientY: 150,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 100,
            top: 50,
            width: 400,
            height: 300,
          }),
        },
      } as unknown as React.WheelEvent<HTMLDivElement>;

      act(() => {
        result.current.handleWheel(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      // Scale should increase (zoom in)
      expect(result.current.transform.scale).toBeGreaterThan(1);
    });

    it('should handle wheel zoom out', () => {
      const { result } = renderHook(() => useCanvasTransform());

      const mockEvent = {
        preventDefault: vi.fn(),
        deltaY: 100,
        clientX: 200,
        clientY: 150,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 100,
            top: 50,
            width: 400,
            height: 300,
          }),
        },
      } as unknown as React.WheelEvent<HTMLDivElement>;

      act(() => {
        result.current.handleWheel(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      // Scale should decrease (zoom out)
      expect(result.current.transform.scale).toBeLessThan(1);
    });

    it('should enforce minimum scale limit', () => {
      const { result } = renderHook(() => useCanvasTransform());

      // Set very small scale first
      act(() => {
        result.current.setTransform({ scale: 0.05, translateX: 0, translateY: 0 });
      });

      const mockEvent = {
        preventDefault: vi.fn(),
        deltaY: 100, // Zoom out
        clientX: 200,
        clientY: 150,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 100,
            top: 50,
            width: 400,
            height: 300,
          }),
        },
      } as unknown as React.WheelEvent<HTMLDivElement>;

      act(() => {
        result.current.handleWheel(mockEvent);
      });

      // Should not go below 0.1
      expect(result.current.transform.scale).toBeGreaterThanOrEqual(0.1);
    });

    it('should enforce maximum scale limit', () => {
      const { result } = renderHook(() => useCanvasTransform());

      // Set large scale first
      act(() => {
        result.current.setTransform({ scale: 1.8, translateX: 0, translateY: 0 });
      });

      const mockEvent = {
        preventDefault: vi.fn(),
        deltaY: -100, // Zoom in
        clientX: 200,
        clientY: 150,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 100,
            top: 50,
            width: 400,
            height: 300,
          }),
        },
      } as unknown as React.WheelEvent<HTMLDivElement>;

      act(() => {
        result.current.handleWheel(mockEvent);
      });

      // Should not go above 2.0
      expect(result.current.transform.scale).toBeLessThanOrEqual(2);
    });

    it('should update translate values when zooming toward mouse position', () => {
      const { result } = renderHook(() => useCanvasTransform());

      const mockEvent = {
        preventDefault: vi.fn(),
        deltaY: -100,
        clientX: 200,
        clientY: 150,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 100,
            top: 50,
            width: 400,
            height: 300,
          }),
        },
      } as unknown as React.WheelEvent<HTMLDivElement>;

      act(() => {
        result.current.handleWheel(mockEvent);
      });

      // Translate values should be updated to zoom toward mouse position
      expect(result.current.transform.translateX).not.toBe(0);
      expect(result.current.transform.translateY).not.toBe(0);
    });
  });

  describe('panning', () => {
    it('should start panning and set active state', () => {
      const { result } = renderHook(() => useCanvasTransform());

      const mockEvent = {
        clientX: 100,
        clientY: 200,
      } as unknown as React.MouseEvent<HTMLDivElement>;

      act(() => {
        result.current.startPanning(mockEvent);
      });

      expect(result.current.isPanningActive).toBe(true);
    });

    it('should update panning position', () => {
      const { result } = renderHook(() => useCanvasTransform());

      // Start panning
      const startEvent = {
        clientX: 100,
        clientY: 200,
      } as unknown as React.MouseEvent<HTMLDivElement>;

      act(() => {
        result.current.startPanning(startEvent);
      });

      // Update panning
      const moveEvent = {
        clientX: 150,
        clientY: 250,
      } as unknown as React.MouseEvent<HTMLDivElement>;

      act(() => {
        result.current.updatePanning(moveEvent);
      });

      expect(result.current.transform.translateX).toBe(50); // 150 - 100
      expect(result.current.transform.translateY).toBe(50); // 250 - 200
    });

    it('should not update panning when not active', () => {
      const { result } = renderHook(() => useCanvasTransform());

      const moveEvent = {
        clientX: 150,
        clientY: 250,
      } as unknown as React.MouseEvent<HTMLDivElement>;

      act(() => {
        result.current.updatePanning(moveEvent);
      });

      // Transform should remain unchanged
      expect(result.current.transform.translateX).toBe(0);
      expect(result.current.transform.translateY).toBe(0);
    });

    it('should end panning and reset active state', () => {
      const { result } = renderHook(() => useCanvasTransform());

      const startEvent = {
        clientX: 100,
        clientY: 200,
      } as unknown as React.MouseEvent<HTMLDivElement>;

      act(() => {
        result.current.startPanning(startEvent);
      });

      expect(result.current.isPanningActive).toBe(true);

      act(() => {
        result.current.endPanning();
      });

      expect(result.current.isPanningActive).toBe(false);
    });

    it('should accumulate panning deltas correctly', () => {
      const { result } = renderHook(() => useCanvasTransform());

      // First pan
      act(() => {
        result.current.startPanning({ clientX: 100, clientY: 200 } as unknown as React.MouseEvent<HTMLDivElement>);
        result.current.updatePanning({ clientX: 120, clientY: 220 } as unknown as React.MouseEvent<HTMLDivElement>);
      });

      expect(result.current.transform.translateX).toBe(20);
      expect(result.current.transform.translateY).toBe(20);

      // Second pan (should accumulate)
      act(() => {
        result.current.updatePanning({ clientX: 140, clientY: 240 } as unknown as React.MouseEvent<HTMLDivElement>);
      });

      expect(result.current.transform.translateX).toBe(40); // 20 + 20
      expect(result.current.transform.translateY).toBe(40); // 20 + 20
    });
  });

  describe('setTransform', () => {
    it('should allow direct setting of transform', () => {
      const { result } = renderHook(() => useCanvasTransform());

      const newTransform = { scale: 1.5, translateX: 100, translateY: 200 };

      act(() => {
        result.current.setTransform(newTransform);
      });

      expect(result.current.transform).toEqual(newTransform);
    });
  });
});