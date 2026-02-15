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
  generateUniqueId,
  isWorkspaceIdUnique,
  generateUniqueWorkspaceId,
  saveWorkspaceState,
  saveWorkspace,
  loadWorkspaceState,
  loadWorkspaceStateFromPath,
  loadAllWorkspaces,
  saveRecentWorkspaces,
  loadRecentWorkspaces,
  saveFavoriteWorkspaces,
  loadFavoriteWorkspaces,
  workspaceFileExists,
  initializeDefaultDirectories,
  saveWorkspaceToDefaultLocation,
  deleteWorkspace,
} from '@/modules/workspace/utils/storageUtils';
import { WorkspaceData } from '@/modules/workspace/types/Types';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/path', () => ({
  join: vi.fn(),
  appDataDir: vi.fn(),
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
  readDir: vi.fn(),
  remove: vi.fn(),
}));

import { join, appDataDir } from '@tauri-apps/api/path';
import { open, save } from '@tauri-apps/plugin-dialog';
import {
  writeTextFile,
  readTextFile,
  exists,
  mkdir,
  readDir,
  remove,
} from '@tauri-apps/plugin-fs';

// Test data factories
const createMockWorkspaceData = (overrides = {}): WorkspaceData => ({
  id: 'ws-123456abc',
  createdAt: 1640995200000,
  updatedAt: 1640995200000,
  name: 'Test Workspace',
  description: 'A test workspace',
  mainLLM: {
    provider: 'OpenAI',
    model: {
      id: 'gpt-4',
      name: 'GPT-4',
    },
  },
  apiKey: 'test-api-key',
  useSavedCredentials: true,
  tasks: [],
  connections: [],
  agents: [],
  workflows: [],
  mcpTools: [],
  trigger: null,
  ...overrides,
});

describe('generateUniqueId', () => {
  it('should generate an ID with correct format', () => {
    const id = generateUniqueId();
    expect(id).toMatch(/^ws-\d{6}[a-z0-9]{4}$/);
  });

  it('should generate unique IDs', () => {
    const id1 = generateUniqueId();
    const id2 = generateUniqueId();
    expect(id1).not.toBe(id2);
  });
});

describe('isWorkspaceIdUnique', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
  });

  it('should return true when workspace ID is unique', async () => {
    vi.mocked(exists).mockResolvedValue(false);

    const result = await isWorkspaceIdUnique('ws-123456abcd');

    expect(result).toBe(true);
    expect(exists).toHaveBeenCalledWith('/app/data/Workspaces/ws-123456abcd.yallma3');
  });

  it('should return false when workspace ID already exists', async () => {
    vi.mocked(exists).mockResolvedValue(true);

    const result = await isWorkspaceIdUnique('ws-123456abcd');

    expect(result).toBe(false);
  });

  it('should return true when exists check fails', async () => {
    vi.mocked(exists).mockRejectedValue(new Error('Check failed'));

    const result = await isWorkspaceIdUnique('ws-123456abcd');

    expect(result).toBe(true); // Assume unique on error
  });
});

describe('generateUniqueWorkspaceId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
  });

  it('should return the first generated ID if unique', async () => {
    vi.mocked(exists).mockResolvedValue(false);

    const result = await generateUniqueWorkspaceId();

    expect(result).toMatch(/^ws-\d{6}[a-z0-9]{4}$/);
  });

  it('should keep generating until finding a unique ID', async () => {
    vi.mocked(exists)
      .mockResolvedValueOnce(true)  // First check fails
      .mockResolvedValueOnce(true)  // Second check fails
      .mockResolvedValueOnce(false); // Third check succeeds

    const result = await generateUniqueWorkspaceId();

    expect(result).toMatch(/^ws-\d{6}[a-z0-9]{4}$/);
    expect(exists).toHaveBeenCalledTimes(3);
  });
});

describe('saveWorkspaceState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(save).mockResolvedValue('/path/to/saved/workspace.yallma3');
    vi.mocked(writeTextFile).mockResolvedValue(undefined);
  });

  it('should save workspace with dialog and return result', async () => {
    const workspaceData = createMockWorkspaceData();

    const result = await saveWorkspaceState(workspaceData);

    expect(save).toHaveBeenCalledWith({
      title: 'Export workspace',
      defaultPath: 'Test Workspace.yallma3',
      filters: [{ name: 'yaLLma3 workspace', extensions: ['yallma3'] }],
    });
    expect(writeTextFile).toHaveBeenCalledWith('/path/to/saved/workspace.yallma3', expect.any(String));
    expect(result).toEqual({
      path: '/path/to/saved/workspace.yallma3',
      workspaceState: expect.objectContaining({
        ...workspaceData,
        updatedAt: expect.any(Number),
      }),
      encrypted: false,
    });
  });

  it('should use ID as filename when no name provided', async () => {
    const workspaceData = createMockWorkspaceData({ name: undefined });

    await saveWorkspaceState(workspaceData);

    expect(save).toHaveBeenCalledWith({
      title: 'Export workspace',
      defaultPath: 'ws-123456abc.yallma3',
      filters: [{ name: 'yaLLma3 workspace', extensions: ['yallma3'] }],
    });
  });

  it('should update updatedAt timestamp', async () => {
    const workspaceData = createMockWorkspaceData({ updatedAt: 1640995200000 });
    const beforeSave = Date.now();

    await saveWorkspaceState(workspaceData);

    const writeCall = vi.mocked(writeTextFile).mock.calls[0];
    const savedContent = JSON.parse(writeCall[1] as string);

    expect(savedContent.updatedAt).toBeGreaterThanOrEqual(beforeSave);
    expect(savedContent.updatedAt).not.toBe(1640995200000);
  });

  it('should throw error when save dialog is cancelled', async () => {
    vi.mocked(save).mockResolvedValue(null);

    const workspaceData = createMockWorkspaceData();

    await expect(saveWorkspaceState(workspaceData)).rejects.toThrow('Export operation cancelled');
  });

  it('should throw error when file write fails', async () => {
    vi.mocked(writeTextFile).mockRejectedValue(new Error('Write failed'));

    const workspaceData = createMockWorkspaceData();

    await expect(saveWorkspaceState(workspaceData)).rejects.toThrow('Write failed');
  });
});

describe('saveWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(save).mockResolvedValue('/path/to/saved/workspace.yallma3');
    vi.mocked(writeTextFile).mockResolvedValue(undefined);
  });

  it('should save workspace with ID-based filename', async () => {
    const workspaceData = createMockWorkspaceData();

    const result = await saveWorkspace(workspaceData);

    expect(save).toHaveBeenCalledWith({
      title: 'Save workspace',
      defaultPath: 'ws-123456abc.yallma3',
      filters: [{ name: 'yaLLma3 workspace', extensions: ['yallma3'] }],
    });
    expect(result.workspaceState!.updatedAt).toBeGreaterThan(workspaceData.updatedAt);
  });
});

describe('loadWorkspaceState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(open).mockResolvedValue('/path/to/workspace.yallma3');
    vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(createMockWorkspaceData()));
  });

  it('should load workspace and regenerate IDs', async () => {
    const originalData = createMockWorkspaceData({ id: 'original-id' });
    vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(originalData));

    const result = await loadWorkspaceState();

    expect(open).toHaveBeenCalledWith({
      title: 'Load workspace',
      multiple: false,
      filters: [{ name: 'yaLLma3 workspace', extensions: ['yallma3'] }],
    });
    expect(result.path).toBe('/path/to/workspace.yallma3');
    expect(result.workspaceState!.id).not.toBe('original-id'); // ID should be regenerated
    expect(result.workspaceState!.createdAt).toBeGreaterThan(originalData.createdAt); // Creation time updated
  });

  it('should throw error when no file selected', async () => {
    vi.mocked(open).mockResolvedValue(null);

    await expect(loadWorkspaceState()).rejects.toThrow('No file selected or multiple files selected');
  });

  it('should throw error when multiple files selected', async () => {
    vi.mocked(open).mockResolvedValue(['file1', 'file2']);

    await expect(loadWorkspaceState()).rejects.toThrow('No file selected or multiple files selected');
  });

  it('should throw error when JSON parsing fails', async () => {
    vi.mocked(readTextFile).mockResolvedValue('invalid json');

    await expect(loadWorkspaceState()).rejects.toThrow();
  });
});

describe('loadWorkspaceStateFromPath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
    vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(createMockWorkspaceData()));
  });

  it('should load workspace from specific path and regenerate IDs', async () => {
    const originalData = createMockWorkspaceData({ id: 'original-id' });
    vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(originalData));

    const result = await loadWorkspaceStateFromPath('/custom/path', 'workspace-id');

    expect(join).toHaveBeenCalledWith('/custom/path', 'workspace-id.yallma3');
    expect(result.id).not.toBe('original-id');
    expect(result.createdAt).toBeGreaterThan(originalData.createdAt);
  });
});

describe('loadAllWorkspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
  });

  it('should load all workspace files and sort by updatedAt', async () => {
    const workspace1 = createMockWorkspaceData({
      id: 'ws-1',
      name: 'Workspace 1',
      updatedAt: 1640995200000,
    });
    const workspace2 = createMockWorkspaceData({
      id: 'ws-2',
      name: 'Workspace 2',
      updatedAt: 1641081600000,
    });

    const mockEntries = [
      { name: 'ws-1.yallma3', isDirectory: false, isFile: true, isSymlink: false },
      { name: 'ws-2.yallma3', isDirectory: false, isFile: true, isSymlink: false },
      { name: 'not-a-workspace.txt', isDirectory: false, isFile: true, isSymlink: false },
    ];

    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readDir).mockResolvedValue(mockEntries);
    vi.mocked(readTextFile)
      .mockResolvedValueOnce(JSON.stringify(workspace1))
      .mockResolvedValueOnce(JSON.stringify(workspace2));

    const result = await loadAllWorkspaces();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('ws-2'); // Newer first
    expect(result[1].id).toBe('ws-1');
  });

  it('should return empty array when Workspaces directory does not exist', async () => {
    vi.mocked(exists).mockResolvedValue(false);

    const result = await loadAllWorkspaces();

    expect(result).toEqual([]);
    expect(readDir).not.toHaveBeenCalled();
  });

  it('should handle missing updatedAt field', async () => {
    const workspaceWithUpdatedAt = createMockWorkspaceData();
    const { updatedAt: _omit, ...workspace } = workspaceWithUpdatedAt;

    const mockEntries = [
      { name: 'ws-1.yallma3', isDirectory: false, isFile: true, isSymlink: false },
    ];

    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readDir).mockResolvedValue(mockEntries);
    vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(workspace));

    const result = await loadAllWorkspaces();

    expect(result).toHaveLength(1);
  });
});

describe('saveRecentWorkspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
    vi.mocked(writeTextFile).mockResolvedValue(undefined);
  });

  it('should save recent workspaces to file', async () => {
    const recentWorkspaces = ['ws-1', 'ws-2', 'ws-3'];

    await saveRecentWorkspaces(recentWorkspaces);

    expect(writeTextFile).toHaveBeenCalledWith(
      '/app/data/recent-workspaces.json',
      JSON.stringify(recentWorkspaces, null, 2)
    );
  });

  it('should handle save errors gracefully', async () => {
    vi.mocked(writeTextFile).mockRejectedValue(new Error('Write failed'));

    // Should not throw
    await saveRecentWorkspaces(['ws-1']);
  });
});

describe('loadRecentWorkspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
  });

  it('should load recent workspaces from file', async () => {
    const recentWorkspaces = ['ws-1', 'ws-2'];
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(recentWorkspaces));

    const result = await loadRecentWorkspaces();

    expect(result).toEqual(recentWorkspaces);
  });

  it('should return empty array when file does not exist', async () => {
    vi.mocked(exists).mockResolvedValue(false);

    const result = await loadRecentWorkspaces();

    expect(result).toEqual([]);
  });

  it('should return empty array when load fails', async () => {
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readTextFile).mockRejectedValue(new Error('Read failed'));

    const result = await loadRecentWorkspaces();

    expect(result).toEqual([]);
  });
});

describe('saveFavoriteWorkspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
    vi.mocked(writeTextFile).mockResolvedValue(undefined);
  });

  it('should save favorite workspaces to file', async () => {
    const favoriteWorkspaces = ['ws-1', 'ws-2'];

    await saveFavoriteWorkspaces(favoriteWorkspaces);

    expect(writeTextFile).toHaveBeenCalledWith(
      '/app/data/favorite-workspaces.json',
      JSON.stringify(favoriteWorkspaces, null, 2)
    );
  });
});

describe('loadFavoriteWorkspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
  });

  it('should load favorite workspaces from file', async () => {
    const favoriteWorkspaces = ['ws-1', 'ws-2'];
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(favoriteWorkspaces));

    const result = await loadFavoriteWorkspaces();

    expect(result).toEqual(favoriteWorkspaces);
  });

  it('should return empty array when file does not exist', async () => {
    vi.mocked(exists).mockResolvedValue(false);

    const result = await loadFavoriteWorkspaces();

    expect(result).toEqual([]);
  });
});

describe('workspaceFileExists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
  });

  it('should return true when workspace file exists', async () => {
    vi.mocked(exists).mockResolvedValue(true);

    const workspaceData = createMockWorkspaceData();
    const result = await workspaceFileExists(workspaceData);

    expect(result).toBe(true);
    expect(exists).toHaveBeenCalledWith('/app/data/Workspaces/ws-123456abc.yallma3');
  });

  it('should return false when workspace file does not exist', async () => {
    vi.mocked(exists).mockResolvedValue(false);

    const workspaceData = createMockWorkspaceData();
    const result = await workspaceFileExists(workspaceData);

    expect(result).toBe(false);
  });
});

describe('initializeDefaultDirectories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
    vi.mocked(exists).mockResolvedValue(false);
    vi.mocked(mkdir).mockResolvedValue(undefined);
  });

  it('should create flows and Workspaces directories when they do not exist', async () => {
    await initializeDefaultDirectories();

    expect(mkdir).toHaveBeenCalledTimes(2);
    expect(mkdir).toHaveBeenCalledWith('/app/data/flows', { recursive: true });
    expect(mkdir).toHaveBeenCalledWith('/app/data/Workspaces', { recursive: true });
  });

  it('should not create directories that already exist', async () => {
    vi.mocked(exists).mockResolvedValue(true);

    await initializeDefaultDirectories();

    expect(mkdir).not.toHaveBeenCalled();
  });
});

describe('saveWorkspaceToDefaultLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeTextFile).mockResolvedValue(undefined);
  });

  it('should save workspace to default location without dialog', async () => {
    const workspaceData = createMockWorkspaceData();

    const result = await saveWorkspaceToDefaultLocation(workspaceData);

    expect(result.path).toBe('/app/data/Workspaces/ws-123456abc.yallma3');
    expect(result.workspaceState!.updatedAt).toBeGreaterThan(workspaceData.updatedAt);
    expect(writeTextFile).toHaveBeenCalledWith(
      '/app/data/Workspaces/ws-123456abc.yallma3',
      expect.any(String)
    );
  });

  it('should create Workspaces directory if it does not exist', async () => {
    vi.mocked(exists).mockResolvedValue(false);

    const workspaceData = createMockWorkspaceData();

    await saveWorkspaceToDefaultLocation(workspaceData);

    expect(mkdir).toHaveBeenCalledWith('/app/data/Workspaces', { recursive: true });
  });
});

describe('deleteWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
  });

  it('should delete workspace file when it exists', async () => {
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(remove).mockResolvedValue(undefined);

    await deleteWorkspace('ws-123456abc');

    expect(remove).toHaveBeenCalledWith('/app/data/Workspaces/ws-123456abc.yallma3');
  });

  it('should not attempt deletion when file does not exist', async () => {
    vi.mocked(exists).mockResolvedValue(false);

    await deleteWorkspace('ws-123456abc');

    expect(remove).not.toHaveBeenCalled();
  });

  it('should throw error when deletion fails', async () => {
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(remove).mockRejectedValue(new Error('Delete failed'));

    await expect(deleteWorkspace('ws-123456abc')).rejects.toThrow('Delete failed');
  });
});