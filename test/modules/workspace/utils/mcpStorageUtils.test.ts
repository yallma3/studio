import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateMcpToolId,
  saveMcpToolToFile,
  loadMcpToolFromFile,
  loadAllMcpToolsFromFiles,
  deleteMcpToolFile,
  createNewMcpTool,
  updateMcpToolFile,
  toolToMcpToolFile,
  mcpToolFileToTool,
  McpToolFile,
} from '@/modules/workspace/utils/mcpStorageUtils';
import { Tool } from '@/modules/workspace/types/Types';

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

const createMockMcpToolFile = (overrides = {}): McpToolFile => ({
  id: 'mcp-123456abc',
  name: 'Test MCP Tool',
  description: 'Test MCP Description',
  type: 'STDIO',
  parameters: {
    command: 'npx',
    args: ['-y', 'server'],
  },
  createdAt: 1640995200000,
  updatedAt: 1640995200000,
  ...overrides,
});

describe('mcpStorageUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appDataDir).mockResolvedValue('/app/data');
    vi.mocked(join).mockImplementation((...paths) => Promise.resolve(paths.join('/')));
  });

  describe('generateMcpToolId', () => {
    it('should generate ID matching mcp-date-random pattern', () => {
      const id = generateMcpToolId();
      expect(id).toMatch(/^mcp-\d{6}[a-z0-9]{3}$/);
    });

    it('should generate unique IDs on consecutive calls', () => {
      const id1 = generateMcpToolId();
      const id2 = generateMcpToolId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('saveMcpToolToFile', () => {
    beforeEach(() => {
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(writeTextFile).mockResolvedValue(undefined);
    });

    it('should save MCP tool to file as JSON', async () => {
      const tool = createMockMcpToolFile();
      await saveMcpToolToFile(tool);

      expect(writeTextFile).toHaveBeenCalled();
      const call = vi.mocked(writeTextFile).mock.calls[0];
      expect(call[0]).toBe('/app/data/mcp-tools/mcp-123456abc.json');
      const savedData = JSON.parse(call[1] as string);
      expect(savedData.id).toBe(tool.id);
      expect(savedData.name).toBe(tool.name);
      expect(savedData.type).toBe(tool.type);
      expect(savedData.updatedAt).toBeGreaterThan(1640995200000);
    });

    it('should create directory if it does not exist', async () => {
      vi.mocked(exists).mockResolvedValue(false);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const tool = createMockMcpToolFile();
      await saveMcpToolToFile(tool);

      expect(mkdir).toHaveBeenCalledWith('/app/data/mcp-tools', { recursive: true });
    });
  });

  describe('loadMcpToolFromFile', () => {
    it('should load and parse MCP tool file', async () => {
      const tool = createMockMcpToolFile();
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(tool));

      const result = await loadMcpToolFromFile('mcp-123456abc');

      expect(result).toEqual(tool);
    });

    it('should return null when file does not exist', async () => {
      vi.mocked(exists).mockResolvedValue(false);

      const result = await loadMcpToolFromFile('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('loadAllMcpToolsFromFiles', () => {
    it('should load all json files from mcp-tools directory', async () => {
      const tool1 = createMockMcpToolFile({ id: 'mcp-1', updatedAt: 1000 });
      const tool2 = createMockMcpToolFile({ id: 'mcp-2', updatedAt: 2000 });

      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(readDir).mockResolvedValue([
        { name: 'mcp-1.json', isDirectory: false, isFile: true, isSymlink: false },
        { name: 'mcp-2.json', isDirectory: false, isFile: true, isSymlink: false },
        { name: 'ignored.txt', isDirectory: false, isFile: true, isSymlink: false },
      ]);

      vi.mocked(readTextFile)
        .mockResolvedValueOnce(JSON.stringify(tool1))
        .mockResolvedValueOnce(JSON.stringify(tool2));

      const results = await loadAllMcpToolsFromFiles();

      expect(results.length).toBe(2);
      expect(results.map((r) => r.id)).toContain('mcp-1');
      expect(results.map((r) => r.id)).toContain('mcp-2');
    });
  });

  describe('deleteMcpToolFile', () => {
    it('should remove file if it exists', async () => {
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(remove).mockResolvedValue(undefined);

      await deleteMcpToolFile('mcp-123456abc');

      expect(remove).toHaveBeenCalledWith('/app/data/mcp-tools/mcp-123456abc.json');
    });

    it('should not throw if file does not exist', async () => {
      vi.mocked(exists).mockResolvedValue(false);

      await deleteMcpToolFile('nonexistent');

      expect(remove).not.toHaveBeenCalled();
    });
  });

  describe('createNewMcpTool', () => {
    beforeEach(() => {
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(writeTextFile).mockResolvedValue(undefined);
    });

    it('should create and save new MCP tool', async () => {
      const result = await createNewMcpTool(
        'New Tool',
        'New Description',
        'STDIO',
        { command: 'node', args: ['index.js'] }
      );

      expect(result.id).toMatch(/^mcp-\d{6}[a-z0-9]{3}$/);
      expect(result.name).toBe('New Tool');
      expect(result.description).toBe('New Description');
      expect(result.type).toBe('STDIO');
      expect(result.parameters.command).toBe('node');
      expect(result.createdAt).toBeGreaterThan(0);
      expect(writeTextFile).toHaveBeenCalled();
    });
  });

  describe('updateMcpToolFile', () => {
    beforeEach(() => {
      vi.mocked(exists).mockResolvedValue(true);
      vi.mocked(writeTextFile).mockResolvedValue(undefined);
    });

    it('should update existing MCP tool in place', async () => {
      const existing = createMockMcpToolFile({
        id: 'mcp-existing',
        name: 'Old Tool',
        updatedAt: 1000,
      });

      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(existing));

      const result = await updateMcpToolFile('mcp-existing', {
        name: 'Updated Tool',
        description: 'Updated Description',
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe('mcp-existing');
      expect(result?.name).toBe('Updated Tool');
      expect(result?.description).toBe('Updated Description');
      expect(result?.updatedAt).toBeGreaterThan(1000);
    });

    it('should return null when tool does not exist', async () => {
      vi.mocked(exists).mockResolvedValue(false);

      const result = await updateMcpToolFile('nonexistent', { name: 'New' });

      expect(result).toBeNull();
    });
  });

  describe('conversion utilities', () => {
    it('toolToMcpToolFile converts Tool to McpToolFile', () => {
      const tool: Tool = {
        id: 'tool-1',
        type: 'mcp',
        name: 'Converted Tool',
        description: 'Converted Description',
        parameters: {
          type: 'HTTP',
          url: 'http://localhost:8080',
          headers: { Authorization: 'Bearer token' },
        },
      };

      const mcpFile = toolToMcpToolFile(tool);

      expect(mcpFile.id).toBe('tool-1');
      expect(mcpFile.name).toBe('Converted Tool');
      expect(mcpFile.type).toBe('HTTP');
      expect(mcpFile.parameters.url).toBe('http://localhost:8080');
      expect(mcpFile.parameters.headers).toEqual({ Authorization: 'Bearer token' });
    });

    it('mcpToolFileToTool converts McpToolFile to Tool', () => {
      const mcpFile = createMockMcpToolFile({
        id: 'mcp-file-1',
        name: 'File Tool',
        type: 'STDIO',
        parameters: { command: 'python', args: ['script.py'] },
      });

      const tool = mcpToolFileToTool(mcpFile);

      expect(tool.id).toBe('mcp-file-1');
      expect(tool.type).toBe('mcp');
      expect(tool.name).toBe('File Tool');
      expect(tool.parameters?.type).toBe('STDIO');
      expect(tool.parameters?.command).toBe('python');
      expect(tool.parameters?.args).toEqual(['script.py']);
    });
  });
});
