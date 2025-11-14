/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
    If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
    WITHOUT WARRANTY OF ANY KIND, either express or implied.
    See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateWorkflowId,
  saveWorkflowToFile,
  loadWorkflowFromFile,
  loadAllWorkflowsFromFiles,
  deleteWorkflowFile,
  createNewWorkflow,
  updateWorkflowFile,
} from '@/modules/workspace/utils/workflowStorageUtils';
import { CanvasState } from '@/modules/flow/utils/storageUtils';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/path', () => ({
  join: vi.fn(),
  appDataDir: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  writeTextFile: vi.fn(),
  readTextFile: vi.fn(),
  exists: vi.fn(),
  mkdir: vi.fn(),
  readDir: vi.fn(),
  remove: vi.fn(),
}));

import { join, appDataDir } from '@tauri-apps/api/path';
import {
  writeTextFile,
  readTextFile,
  exists,
  mkdir,
  readDir,
  remove,
} from '@tauri-apps/plugin-fs';

// Test data factories
const createMockCanvasState = (): CanvasState => ({
  graphId: 'test-graph-123',
  graphName: 'Test Graph',
  nodes: [],
  connections: [],
  nextNodeId: 1,
});

const createMockWorkflowFile = (overrides = {}) => ({
  id: 'wf-123456abc',
  name: 'Test Workflow',
  description: 'A test workflow',
  createdAt: 1640995200000, // 2022-01-01
  updatedAt: 1640995200000,
  canvasState: createMockCanvasState(),
  ...overrides,
});

describe('generateWorkflowId', () => {
  it('should generate an ID with correct format', () => {
    const id = generateWorkflowId();
    expect(id).toMatch(/^wf-\d{6}[a-z0-9]{3}$/);
  });

  it('should generate unique IDs', () => {
    const id1 = generateWorkflowId();
    const id2 = generateWorkflowId();
    expect(id1).not.toBe(id2);
  });
});

describe('saveWorkflowToFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
    vi.mocked(exists).mockResolvedValue(false);
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeTextFile).mockResolvedValue(undefined);
  });

  it('should save workflow to file with correct path and content', async () => {
    const workflow = createMockWorkflowFile();
    const expectedFlowsDir = '/app/data/flows';

    await saveWorkflowToFile(workflow);

    expect(appDataDir).toHaveBeenCalled();
    expect(join).toHaveBeenCalledWith('/app/data', 'flows');
    expect(exists).toHaveBeenCalledWith(expectedFlowsDir);
    expect(mkdir).toHaveBeenCalledWith(expectedFlowsDir, { recursive: true });
    expect(join).toHaveBeenCalledWith(expectedFlowsDir, 'wf-123456abc.json');

    const writeCall = vi.mocked(writeTextFile).mock.calls[0];
    const savedContent = JSON.parse(writeCall[1] as string);
    expect(savedContent.id).toBe('wf-123456abc');
  });

  it('should update updatedAt timestamp when saving', async () => {
    const workflow = createMockWorkflowFile({ updatedAt: 1640995200000 });
    const beforeSave = Date.now();

    await saveWorkflowToFile(workflow);

    const writeCall = vi.mocked(writeTextFile).mock.calls[0];
    const savedContent = JSON.parse(writeCall[1] as string);

    expect(savedContent.updatedAt).toBeGreaterThanOrEqual(beforeSave);
    expect(savedContent.updatedAt).not.toBe(1640995200000);
  });

  it('should create flows directory if it does not exist', async () => {
    vi.mocked(exists).mockResolvedValue(false);

    const workflow = createMockWorkflowFile();

    await saveWorkflowToFile(workflow);

    expect(mkdir).toHaveBeenCalledWith('/app/data/flows', { recursive: true });
  });

  it('should not create directory if it already exists', async () => {
    vi.mocked(exists).mockResolvedValue(true);

    const workflow = createMockWorkflowFile();

    await saveWorkflowToFile(workflow);

    expect(mkdir).not.toHaveBeenCalled();
  });

  it('should throw error when file operations fail', async () => {
    vi.mocked(writeTextFile).mockRejectedValue(new Error('Write failed'));

    const workflow = createMockWorkflowFile();

    await expect(saveWorkflowToFile(workflow)).rejects.toThrow('Write failed');
  });
});

describe('loadWorkflowFromFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
  });

  it('should load workflow from file successfully', async () => {
    const workflow = createMockWorkflowFile();
    const workflowJson = JSON.stringify(workflow);

    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readTextFile).mockResolvedValue(workflowJson);

    const result = await loadWorkflowFromFile('wf-123456abc');

    expect(result).toEqual(workflow);
    expect(join).toHaveBeenCalledWith('/app/data/flows', 'wf-123456abc.json');
    expect(readTextFile).toHaveBeenCalledWith('/app/data/flows/wf-123456abc.json');
  });

  it('should return null when workflow file does not exist', async () => {
    vi.mocked(exists).mockResolvedValue(false);

    const result = await loadWorkflowFromFile('non-existent-id');

    expect(result).toBeNull();
    expect(readTextFile).not.toHaveBeenCalled();
  });

  it('should return null when JSON parsing fails', async () => {
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readTextFile).mockResolvedValue('invalid json');

    const result = await loadWorkflowFromFile('wf-123456abc');

    expect(result).toBeNull();
  });

  it('should return null when file read fails', async () => {
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readTextFile).mockRejectedValue(new Error('Read failed'));

    const result = await loadWorkflowFromFile('wf-123456abc');

    expect(result).toBeNull();
  });
});

describe('loadAllWorkflowsFromFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
  });

  it('should load all workflow files and sort by updatedAt descending', async () => {
    const workflow1 = createMockWorkflowFile({
      id: 'wf-1',
      name: 'Workflow 1',
      updatedAt: 1640995200000, // Older
    });
    const workflow2 = createMockWorkflowFile({
      id: 'wf-2',
      name: 'Workflow 2',
      updatedAt: 1641081600000, // Newer
    });

    const mockEntries = [
      { name: 'wf-1.json', isDirectory: false, isFile: true, isSymlink: false },
      { name: 'wf-2.json', isDirectory: false, isFile: true, isSymlink: false },
      { name: 'not-a-workflow.txt', isDirectory: false, isFile: true, isSymlink: false }, // Should be ignored
    ];

    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readDir).mockResolvedValue(mockEntries);
    vi.mocked(readTextFile)
      .mockResolvedValueOnce(JSON.stringify(workflow1))
      .mockResolvedValueOnce(JSON.stringify(workflow2));

    const result = await loadAllWorkflowsFromFiles();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('wf-2'); // Newer first
    expect(result[1].id).toBe('wf-1'); // Older second
  });

  it('should return empty array when flows directory does not exist', async () => {
    vi.mocked(exists).mockResolvedValue(false);
    vi.mocked(readDir).mockResolvedValue([]);

    const result = await loadAllWorkflowsFromFiles();

    expect(result).toEqual([]);
    expect(readDir).toHaveBeenCalledWith('/app/data/flows');
  });

  it('should handle file read errors gracefully', async () => {
    const mockEntries = [
      { name: 'wf-1.json', isDirectory: false, isFile: true, isSymlink: false },
      { name: 'wf-2.json', isDirectory: false, isFile: true, isSymlink: false },
    ];

    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readDir).mockResolvedValue(mockEntries);
    vi.mocked(readTextFile)
      .mockRejectedValueOnce(new Error('Read failed'))
      .mockResolvedValueOnce(JSON.stringify(createMockWorkflowFile({ id: 'wf-2' })));

    const result = await loadAllWorkflowsFromFiles();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('wf-2');
  });

  it('should handle JSON parse errors gracefully', async () => {
    const mockEntries = [
      { name: 'wf-1.json', isDirectory: false, isFile: true, isSymlink: false },
      { name: 'wf-2.json', isDirectory: false, isFile: true, isSymlink: false },
    ];

    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readDir).mockResolvedValue(mockEntries);
    vi.mocked(readTextFile)
      .mockResolvedValueOnce('invalid json')
      .mockResolvedValueOnce(JSON.stringify(createMockWorkflowFile({ id: 'wf-2' })));

    const result = await loadAllWorkflowsFromFiles();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('wf-2');
  });
});

describe('deleteWorkflowFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
  });

  it('should delete workflow file when it exists', async () => {
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(remove).mockResolvedValue(undefined);

    await deleteWorkflowFile('wf-123456abc');

    expect(exists).toHaveBeenCalledWith('/app/data/flows/wf-123456abc.json');
    expect(remove).toHaveBeenCalledWith('/app/data/flows/wf-123456abc.json');
  });

  it('should not attempt deletion when file does not exist', async () => {
    vi.mocked(exists).mockResolvedValue(false);

    await deleteWorkflowFile('non-existent-id');

    expect(remove).not.toHaveBeenCalled();
  });

  it('should throw error when deletion fails', async () => {
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(remove).mockRejectedValue(new Error('Delete failed'));

    await expect(deleteWorkflowFile('wf-123456abc')).rejects.toThrow('Delete failed');
  });
});

describe('createNewWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
    vi.mocked(exists).mockResolvedValue(false);
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeTextFile).mockResolvedValue(undefined);
  });

  it('should create new workflow with generated ID and timestamps', async () => {
    const name = 'New Workflow';
    const description = 'A new workflow description';
    const canvasState = createMockCanvasState();

    const result = await createNewWorkflow(name, description, canvasState);

    expect(result.id).toMatch(/^wf-\d{6}[a-z0-9]{3}$/);
    expect(result.name).toBe(name);
    expect(result.description).toBe(description);
    expect(result.canvasState).toBe(canvasState);
    expect(result.createdAt).toBeGreaterThan(0);
    expect(result.updatedAt).toBeGreaterThan(0);
    expect(result.createdAt).toBe(result.updatedAt);
  });

  it('should save the workflow to file', async () => {
    const name = 'Test Workflow';
    const description = 'Test description';
    const canvasState = createMockCanvasState();

    await createNewWorkflow(name, description, canvasState);

    expect(writeTextFile).toHaveBeenCalled();
    const writeCall = vi.mocked(writeTextFile).mock.calls[0];
    const savedContent = JSON.parse(writeCall[1] as string);

    expect(savedContent.name).toBe(name);
    expect(savedContent.description).toBe(description);
  });
});

describe('updateWorkflowFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeTextFile).mockResolvedValue(undefined);
  });

  it('should update existing workflow with new data', async () => {
    const existingWorkflow = createMockWorkflowFile({
      id: 'wf-existing',
      name: 'Old Name',
      updatedAt: 1640995200000,
    });

    vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(existingWorkflow));

    const updates = {
      name: 'New Name',
      description: 'Updated description',
    };

    const result = await updateWorkflowFile('wf-existing', updates);

    expect(result).not.toBeNull();
    expect(result?.name).toBe('New Name');
    expect(result?.description).toBe('Updated description');
    expect(result?.id).toBe('wf-existing'); // ID unchanged
    expect(result?.updatedAt).toBeGreaterThan(1640995200000); // Updated timestamp
  });

  it('should return null when workflow does not exist', async () => {
    vi.mocked(exists).mockResolvedValue(false);

    const result = await updateWorkflowFile('non-existent', { name: 'New Name' });

    expect(result).toBeNull();
  });

  it('should preserve existing data when partially updating', async () => {
    const existingWorkflow = createMockWorkflowFile({
      id: 'wf-existing',
      name: 'Original Name',
      description: 'Original description',
    });

    vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(existingWorkflow));

    const result = await updateWorkflowFile('wf-existing', { name: 'Updated Name' });

    expect(result?.name).toBe('Updated Name');
    expect(result?.description).toBe('Original description'); // Unchanged
  });
});