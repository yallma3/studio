import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceData } from '@/modules/workspace/types/Types';
import { ManualTrigger } from '@/modules/task/types/types';
import { getWorkflow } from '@/modules/workspace/utils/runtimeUtils';

vi.mock('@/modules/workspace/utils/runtimeUtils');

function createMockWorkspaceData(): WorkspaceData {
  const now = Date.now();
  return {
    id: 'ws-test-001',
    createdAt: now,
    updatedAt: now,
    name: 'Test Workspace',
    description: 'A test workspace',
    mainLLM: {
      provider: 'Groq',
      model: { name: 'Llama 3.1 8B', id: 'llama-3.1-8b-instant' },
    },
    apiKey: '',
    useSavedCredentials: false,
    trigger: {
      id: 'trigger-manual-1',
      type: 'manual',
      enabled: true,
      createdAt: now,
      updatedAt: now,
      config: {
        description: 'Run manually',
        requiresConfirmation: false,
      },
    } as ManualTrigger,
    tasks: [
      {
        id: 'tk-001',
        title: 'Research',
        description: 'Gather information',
        expectedOutput: 'Research report',
        type: 'agentic',
        executorId: null,
        position: { x: 100, y: 200 },
        selected: false,
        sockets: [
          { id: 1, title: 'Input', type: 'input' },
          { id: 2, title: 'Output', type: 'output' },
        ],
      },
    ],
    connections: [{ fromSocket: 2, toSocket: 1 }],
    agents: [
      {
        id: 'ag-001',
        name: 'Researcher',
        role: 'Research Agent',
        objective: 'Find information',
        background: 'Expert researcher',
        capabilities: 'web search, analysis',
        tools: [],
        llm: {
          provider: 'Groq',
          model: { name: 'Llama 3.1 8B', id: 'llama-3.1-8b-instant' },
        },
        apiKey: '',
      },
    ],
    workflows: [
      { id: 'wf-001', name: 'Data Processing', description: 'Process data workflow' },
    ],
    mcpTools: [
      {
        id: 'mcp-001',
        type: 'mcp',
        name: 'File Reader',
        description: 'Read files from disk',
        parameters: { command: 'cat', args: [] },
      },
    ],
    environmentVariables: [
      {
        id: 'env-001',
        key: 'API_KEY',
        value: 'sk-test-123',
        sensitive: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

describe('WorkspaceData serialization', () => {
  it('serializes all expected top-level keys', () => {
    const ws = createMockWorkspaceData();
    ws.tasks[0].type = 'workflow';
    ws.tasks[0].executorId = 'wf-001';
    const serialized = JSON.stringify(ws);
    const parsed = JSON.parse(serialized);

    const expectedKeys = [
      'id',
      'name',
      'description',
      'mainLLM',
      'apiKey',
      'useSavedCredentials',
      'trigger',
      'tasks',
      'connections',
      'agents',
      'workflows',
      'mcpTools',
      'environmentVariables',
    ];

    for (const key of expectedKeys) {
      expect(parsed).toHaveProperty(key);
    }

    expect(Object.keys(parsed)).toEqual(expect.arrayContaining(expectedKeys));
  });

  it('round-trips through JSON parse correctly', () => {
    const ws = createMockWorkspaceData();
    ws.tasks[0].type = 'workflow';
    ws.tasks[0].executorId = 'wf-001';
    const serialized = JSON.stringify(ws);
    const parsed = JSON.parse(serialized) as WorkspaceData;

    expect(parsed.id).toBe('ws-test-001');
    expect(parsed.name).toBe('Test Workspace');
    expect(parsed.mainLLM.provider).toBe('Groq');
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.agents).toHaveLength(1);
    expect(parsed.workflows).toHaveLength(1);
    expect(parsed.mcpTools).toHaveLength(1);
    expect(parsed.environmentVariables).toHaveLength(1);
    expect(parsed.connections).toHaveLength(1);
    expect(parsed.trigger).not.toBeNull();
  });

  it('serialized output is valid JSON', () => {
    const ws = createMockWorkspaceData();
    ws.tasks[0].type = 'workflow';
    ws.tasks[0].executorId = 'wf-001';
    const serialized = JSON.stringify(ws);
    expect(() => JSON.parse(serialized)).not.toThrow();
  });

  it('workflows include full graph data when enriched for runtime', () => {
    const ws = createMockWorkspaceData();
    ws.tasks[0].type = 'workflow';
    ws.tasks[0].executorId = 'wf-001';
    const enrichedWorkflows = ws.workflows.map((wf) => ({
      ...wf,
      nodes: [
        { id: 1, title: 'Start', nodeType: 'start', x: 0, y: 0, width: 200, height: 100, sockets: [], category: '' },
        { id: 2, title: 'End', nodeType: 'end', x: 400, y: 0, width: 200, height: 100, sockets: [], category: '' },
      ],
      connections: [{ fromSocket: 101, toSocket: 201, label: '' }],
    }));
    const enrichedPayload = { ...ws, workflows: enrichedWorkflows };
    const serialized = JSON.stringify(enrichedPayload);
    const parsed = JSON.parse(serialized);

    for (const wf of parsed.workflows) {
      expect(wf).toHaveProperty('id');
      expect(wf).toHaveProperty('name');
      expect(wf).toHaveProperty('description');
      expect(wf).toHaveProperty('nodes');
      expect(wf).toHaveProperty('connections');
      expect(Array.isArray(wf.nodes)).toBe(true);
      expect(Array.isArray(wf.connections)).toBe(true);
    }
  });

  it('mcpTools are present in serialized output', () => {
    const ws = createMockWorkspaceData();
    ws.tasks[0].type = 'workflow';
    ws.tasks[0].executorId = 'wf-001';
    const serialized = JSON.stringify(ws);
    const parsed = JSON.parse(serialized);

    expect(parsed.mcpTools).toHaveLength(1);
    expect(parsed.mcpTools[0]).toHaveProperty('id');
    expect(parsed.mcpTools[0]).toHaveProperty('type');
    expect(parsed.mcpTools[0]).toHaveProperty('name');
  });

  it('environmentVariables is always an array', () => {
    const ws = createMockWorkspaceData();
    ws.tasks[0].type = 'workflow';
    ws.tasks[0].executorId = 'wf-001';
    ws.environmentVariables = [];
    const serialized = JSON.stringify(ws);
    const parsed = JSON.parse(serialized);

    expect(Array.isArray(parsed.environmentVariables)).toBe(true);
    expect(parsed.environmentVariables).toHaveLength(0);
  });
});

describe('enrichWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inlines workflow nodes and connections from disk', async () => {
    const { enrichWorkspace } = await import('@/modules/workspace/utils/buildRunPayload');
    const ws = createMockWorkspaceData();
    ws.tasks[0].type = 'workflow';
    ws.tasks[0].executorId = 'wf-001';

    vi.mocked(getWorkflow).mockResolvedValue({
      id: 'wf-001',
      name: 'Data Processing',
      description: 'Process data workflow',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      canvasState: {
        graphId: 'gf-001',
        graphName: 'Data Processing',
        nodes: [
          { id: 1, title: 'Start', nodeType: 'start', x: 0, y: 0, width: 200, height: 100, sockets: [], category: '' },
        ],
        connections: [{ fromSocket: 101, toSocket: 201 }],
        nextNodeId: 2,
      },
    });

    const enriched = await enrichWorkspace(ws);

    const workflows = enriched.workflows as Array<Record<string, unknown>>;
    expect(workflows).toHaveLength(1);
    expect(workflows[0]).toHaveProperty('nodes');
    expect(workflows[0]).toHaveProperty('connections');
    expect(Array.isArray(workflows[0].nodes)).toBe(true);
    expect((workflows[0].nodes as Array<unknown>)).toHaveLength(1);
    expect(Array.isArray(workflows[0].connections)).toBe(true);
  });

  it('returns workflows as-is when workflow file is missing', async () => {
    const { enrichWorkspace } = await import('@/modules/workspace/utils/buildRunPayload');
    const ws = createMockWorkspaceData();
    ws.tasks[0].type = 'workflow';
    ws.tasks[0].executorId = 'wf-001';

    vi.mocked(getWorkflow).mockResolvedValue(null);

    const enriched = await enrichWorkspace(ws);
    const workflows = enriched.workflows as Array<Record<string, unknown>>;

    expect(workflows).toHaveLength(1);
    expect(workflows[0]).not.toHaveProperty('nodes');
    expect(workflows[0]).not.toHaveProperty('connections');
  });

  it('copies workspace when no workflows exist', async () => {
    const { enrichWorkspace } = await import('@/modules/workspace/utils/buildRunPayload');
    const ws = createMockWorkspaceData();
    ws.tasks[0].type = 'workflow';
    ws.tasks[0].executorId = 'wf-001';
    ws.workflows = [];

    const enriched = await enrichWorkspace(ws);
    expect(enriched).toHaveProperty('id', 'ws-test-001');
  });
});
