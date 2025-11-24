/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveCanvasState,
  loadCanvasState,
  exportCanvasState,
  loadCanvasStateFromPath,
  saveRecentGraphs,
  loadRecentGraphs,
} from '@/modules/flow/utils/storageUtils';
import { NodeType, Connection, GraphState } from '@/modules/flow/types/NodeTypes';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/path', () => ({
  join: vi.fn(),
  appDataDir: vi.fn(),
  appConfigDir: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  writeTextFile: vi.fn(),
  readTextFile: vi.fn(),
  exists: vi.fn(),
  mkdir: vi.fn(),
}));

import { join, appDataDir, appConfigDir } from '@tauri-apps/api/path';
import { open, save } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test data factories
const createMockNode = (
  id: number,
  title: string = 'Test Node'
): NodeType => ({
  id,
  category: 'Test',
  title,
  nodeType: 'test',
  x: 0,
  y: 0,
  width: 100,
  height: 50,
  sockets: [],
  selected: false,
  processing: false,
  process: vi.fn(),
});

const createMockConnection = (
  fromSocket: number,
  toSocket: number
): Connection => ({
  fromSocket,
  toSocket,
});

const createMockGraphState = (
  id: string,
  name: string,
  path: string
): GraphState => ({
  id,
  name,
  path,
  lastModified: Date.now(),
});

describe('Flow Storage Utils Testing', () => {
  let mockJoin: any;
  let mockAppDataDir: any;
  let mockAppConfigDir: any;
  let mockOpen: any;
  let mockSave: any;
  let mockWriteTextFile: any;
  let mockReadTextFile: any;
  let mockExists: any;
  let mockMkdir: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockJoin = vi.mocked(join);
    mockAppDataDir = vi.mocked(appDataDir);
    mockAppConfigDir = vi.mocked(appConfigDir);
    mockOpen = vi.mocked(open);
    mockSave = vi.mocked(save);
    mockWriteTextFile = vi.mocked(writeTextFile);
    mockReadTextFile = vi.mocked(readTextFile);
    mockExists = vi.mocked(exists);
    mockMkdir = vi.mocked(mkdir);

    // Setup default mocks
    mockAppDataDir.mockResolvedValue('/app/data');
    mockAppConfigDir.mockResolvedValue('/app/config');
    mockJoin.mockImplementation((...args: string[]) => Promise.resolve(args.join('/')));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });



  describe('saveCanvasState', () => {
    it('should save canvas state to file successfully', async () => {
      // Arrange
      const graphId = 'gf-123abc';
      const nodes = [createMockNode(1)];
      const connections = [createMockConnection(1, 2)];
      const nextNodeId = 2;
      const graphName = 'Test Graph';

      mockWriteTextFile.mockResolvedValue(undefined);
      localStorageMock.setItem.mockImplementation(() => {});

      // Act
      await saveCanvasState(graphId, nodes, connections, nextNodeId, graphName);

      // Assert
      expect(mockAppDataDir).toHaveBeenCalled();
      expect(mockJoin).toHaveBeenCalledWith('/app/data', 'Test Graph.json');
      expect(mockWriteTextFile).toHaveBeenCalledWith(
        '/app/data/Test Graph.json',
        expect.stringContaining('"graphId": "gf-123abc"')
      );
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle file system errors and fallback to localStorage', async () => {
      // Arrange
      const graphId = 'gf-123abc';
      const nodes = [createMockNode(1)];
      const connections: Connection[] = [];
      const nextNodeId = 2;
      const graphName = 'Test Graph';

      mockWriteTextFile.mockRejectedValue(new Error('Write failed'));
      localStorageMock.setItem.mockImplementation(() => {});

      // Mock console methods
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      await saveCanvasState(graphId, nodes, connections, nextNodeId, graphName);

      // Assert
      expect(mockWriteTextFile).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('nodeCanvasState', expect.any(String));
      expect(consoleLogSpy).toHaveBeenCalledWith('Fallback: Canvas state saved to localStorage');

      // Cleanup
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('loadCanvasState', () => {
    it('should load canvas state from file successfully', async () => {
      // Arrange
      const mockFile = '/path/to/file.json';
      const mockContent = JSON.stringify({
        graphId: 'gf-123abc',
        graphName: 'Test Graph',
        nodes: [createMockNode(1)],
        connections: [],
        nextNodeId: 2,
      });

      mockOpen.mockResolvedValue(mockFile);
      mockReadTextFile.mockResolvedValue(mockContent);
      mockWriteTextFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);
      localStorageMock.setItem.mockImplementation(() => {});

      // Act
      const result = await loadCanvasState();

      // Assert
      expect(result).toEqual({
        canvasState: {
          graphId: 'gf-123abc',
          graphName: 'Test Graph',
          nodes: [{
            id: 1,
            category: 'Test',
            title: 'Test Node',
            nodeType: 'test',
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            sockets: [],
            selected: false,
            processing: false,
          }],
          connections: [],
          nextNodeId: 2,
        },
        newGraphId: expect.stringMatching(/^gf-\d{6}[a-z0-9]{3}$/),
      });
      expect(mockOpen).toHaveBeenCalled();
      expect(mockReadTextFile).toHaveBeenCalledWith(mockFile);
    });

    it('should return null when user cancels file selection', async () => {
      // Arrange
      mockOpen.mockResolvedValue(null);

      // Act
      const result = await loadCanvasState();

      // Assert
      expect(result).toBeNull();
    });

    it('should fallback to localStorage when file operations fail', async () => {
      // Arrange
      const savedState = JSON.stringify({
        graphId: 'gf-123abc',
        graphName: 'Test Graph',
        nodes: [],
        connections: [],
        nextNodeId: 1,
      });

      mockOpen.mockRejectedValue(new Error('Dialog failed'));
      localStorageMock.getItem.mockReturnValue(savedState);

      // Mock console methods
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      const result = await loadCanvasState();

      // Assert
      expect(result).toEqual(JSON.parse(savedState));
      expect(consoleLogSpy).toHaveBeenCalledWith('Fallback: Canvas state loaded from localStorage');

      // Cleanup
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('exportCanvasState', () => {
    it('should export canvas state to user-selected file', async () => {
      // Arrange
      const graph = {
        graphId: 'gf-123abc',
        graphName: 'Test Graph',
        nodes: [],
        connections: [],
        nextNodeId: 1,
      };
      const nodes = [createMockNode(1)];
      const connections = [createMockConnection(1, 2)];
      const nextNodeId = 3;
      const selectedPath = '/user/selected/path.json';

      mockSave.mockResolvedValue(selectedPath);
      mockWriteTextFile.mockResolvedValue(undefined);

      // Act
      await exportCanvasState(graph, nodes, connections, nextNodeId);

      // Assert
      expect(mockSave).toHaveBeenCalledWith({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        defaultPath: 'Test Graph.json',
      });
      expect(mockWriteTextFile).toHaveBeenCalledWith(
        selectedPath,
        expect.stringContaining('"graphId": "gf-123abc"')
      );
    });

    it('should handle user cancellation', async () => {
      // Arrange
      const graph = {
        graphId: 'gf-123abc',
        graphName: 'Test Graph',
        nodes: [],
        connections: [],
        nextNodeId: 1,
      };
      const nodes = [createMockNode(1)];
      const connections: Connection[] = [];
      const nextNodeId = 2;

      mockSave.mockResolvedValue(null);

      // Act
      await exportCanvasState(graph, nodes, connections, nextNodeId);

      // Assert
      expect(mockWriteTextFile).not.toHaveBeenCalled();
    });
  });

  describe('loadCanvasStateFromPath', () => {
    it('should load canvas state from specified path', async () => {
      // Arrange
      const filePath = '/path/to/canvas.json';
      const graphId = 'gf-123abc';
      const mockContent = JSON.stringify({
        graphId: 'gf-123def',
        graphName: 'Loaded Graph',
        nodes: [createMockNode(1)],
        connections: [],
        nextNodeId: 2,
      });

      mockReadTextFile.mockResolvedValue(mockContent);

      // Act
      const result = await loadCanvasStateFromPath(filePath, graphId);

      // Assert
      expect(result).toEqual({
        graphId: 'gf-123def',
        graphName: 'Loaded Graph',
        nodes: [{
          id: 1,
          category: 'Test',
          title: 'Test Node',
          nodeType: 'test',
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          sockets: [],
          selected: false,
          processing: false,
        }],
        connections: [],
        nextNodeId: 2,
      });
      expect(mockReadTextFile).toHaveBeenCalledWith(filePath);
    });

    it('should handle JSON parse errors', async () => {
      // Arrange
      const filePath = '/path/to/canvas.json';
      const graphId = 'gf-123abc';

      mockReadTextFile.mockResolvedValue('invalid json');

      // Mock console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const result = await loadCanvasStateFromPath(filePath, graphId);

      // Assert
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to parse JSON from file:', expect.any(SyntaxError));

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should return default canvas state when file not found', async () => {
      // Arrange
      const filePath = '/path/to/canvas.json';
      const graphId = 'gf-123abc';

      mockReadTextFile.mockRejectedValue(new Error('File not found'));

      // Act
      const result = await loadCanvasStateFromPath(filePath, graphId);

      // Assert
      expect(result).toEqual({
        graphId: 'gf-123abc',
        graphName: null,
        nodes: [],
        connections: [],
        nextNodeId: 0,
      });
    });
  });

  describe('saveRecentGraphs', () => {
    it('should save graph state to recent graphs file', async () => {
      // Arrange
      const graphState = createMockGraphState('gf-123abc', 'Test Graph', '/path/to/graph.json');

      mockReadTextFile.mockRejectedValue(new Error('File not found')); // No existing file
      mockWriteTextFile.mockResolvedValue(undefined);
      localStorageMock.setItem.mockImplementation(() => {});

      // Act
      await saveRecentGraphs(graphState);

      // Assert
      expect(mockAppConfigDir).toHaveBeenCalled();
      expect(mockJoin).toHaveBeenCalledWith('/app/config', 'recent_graphs.json');
      expect(mockWriteTextFile).toHaveBeenCalledWith(
        '/app/config/recent_graphs.json',
        expect.stringContaining('"id": "gf-123abc"')
      );
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should update existing graph in recent graphs', async () => {
      // Arrange
      const existingGraphs = {
        graphs: [createMockGraphState('gf-123abc', 'Old Name', '/old/path.json')],
        lastAccessed: Date.now() - 1000,
      };
      const updatedGraphState = createMockGraphState('gf-123abc', 'Updated Graph', '/new/path.json');

      mockReadTextFile.mockResolvedValue(JSON.stringify(existingGraphs));
      mockWriteTextFile.mockResolvedValue(undefined);
      localStorageMock.setItem.mockImplementation(() => {});

      // Act
      await saveRecentGraphs(updatedGraphState);

      // Assert
      const writeCall = mockWriteTextFile.mock.calls[0][1];
      const savedData = JSON.parse(writeCall);
      expect(savedData.graphs).toHaveLength(1);
      expect(savedData.graphs[0].name).toBe('Updated Graph');
    });

    it('should limit recent graphs to 10 items', async () => {
      // Arrange
      const existingGraphs = {
        graphs: Array.from({ length: 10 }, (_, i) =>
          createMockGraphState(`gf-${i}`, `Graph ${i}`, `/path/${i}.json`)
        ),
        lastAccessed: Date.now() - 1000,
      };
      const newGraphState = createMockGraphState('gf-new', 'New Graph', '/path/new.json');

      mockReadTextFile.mockResolvedValue(JSON.stringify(existingGraphs));
      mockWriteTextFile.mockResolvedValue(undefined);
      localStorageMock.setItem.mockImplementation(() => {});

      // Act
      await saveRecentGraphs(newGraphState);

      // Assert
      const writeCall = mockWriteTextFile.mock.calls[0][1];
      const savedData = JSON.parse(writeCall);
      expect(savedData.graphs).toHaveLength(10);
      expect(savedData.graphs[0].name).toBe('New Graph'); // New one at the front
    });
  });

  describe('loadRecentGraphs', () => {
    it('should load recent graphs from file', async () => {
      // Arrange
      const recentGraphs = {
        graphs: [createMockGraphState('gf-123abc', 'Test Graph', '/path/to/graph.json')],
        lastAccessed: Date.now(),
      };

      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockResolvedValue(JSON.stringify(recentGraphs));

      // Act
      const result = await loadRecentGraphs();

      // Assert
      expect(result).toEqual(recentGraphs.graphs);
      expect(mockAppConfigDir).toHaveBeenCalled();
      expect(mockReadTextFile).toHaveBeenCalledWith('/app/config/recent_graphs.json');
    });

    it('should create directory and return empty array when config dir does not exist', async () => {
      // Arrange
      mockExists.mockResolvedValue(false);
      mockMkdir.mockResolvedValue(undefined);

      // Act
      const result = await loadRecentGraphs();

      // Assert
      expect(result).toEqual([]);
      expect(mockMkdir).toHaveBeenCalledWith('/app/config');
    });

    it('should return empty array when file does not exist', async () => {
      // Arrange
      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockRejectedValue(new Error('File not found'));

      // Act
      const result = await loadRecentGraphs();

      // Assert
      expect(result).toEqual([]);
    });
  });
});