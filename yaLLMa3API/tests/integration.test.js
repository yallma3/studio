const request = require('supertest');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');

const API_KEY = 'test-api-key-12345';
const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

describe('yaLLMa3API Integration Tests', () => {
  let serverProcess;
  let agent;

  beforeAll(async () => {
    // Start the server process
    serverProcess = spawn('node', ['index.js'], {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        SIDECAR_PORT: '3001',
        SIDECAR_API_KEY: API_KEY,
        NODE_ENV: 'test'
      },
      stdio: 'inherit'
    });

    // Wait for server to start
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    agent = request.agent(BASE_URL);
  }, 10000);

  afterAll(async () => {
    // Clean up server process
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    }
  });

  describe('Health Endpoints', () => {
    test('GET /health should return ok status', async () => {
      const response = await agent.get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });

    test('GET /health/detailed should return detailed health info', async () => {
      const response = await agent.get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
      expect(response.body.services).toBeDefined();
      expect(response.body.services.websocket).toBeDefined();
    });

    test('GET /metrics should return system metrics', async () => {
      const response = await agent.get('/metrics');

      expect(response.status).toBe(200);
      expect(response.body.memory).toBeDefined();
      expect(response.body.websocket).toBeDefined();
      expect(response.body.process).toBeDefined();
    });
  });

  describe('Command API Endpoints', () => {
    const validCommand = {
      command: 'run_workspace',
      workspaceId: 'test-workspace-123',
      parameters: { test: true }
    };

    test('POST /api/commands without API key should return 401', async () => {
      const response = await request(BASE_URL)
        .post('/api/commands')
        .send(validCommand);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('API key required');
    });

    test('POST /api/commands with invalid API key should return 403', async () => {
      const response = await request(BASE_URL)
        .post('/api/commands')
        .set('x-api-key', 'invalid-key')
        .send(validCommand);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid API key');
    });

    test('POST /api/commands with valid API key should accept command', async () => {
      const response = await request(BASE_URL)
        .post('/api/commands')
        .set('x-api-key', API_KEY)
        .send(validCommand);

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.id).toMatch(/^cmd_\d+_[a-zA-Z0-9]+$/);
      expect(response.body.command).toBe('run_workspace');
    });

    test('POST /api/commands with invalid command should return 400', async () => {
      const invalidCommand = {
        command: 'invalid_command!!!',
        workspaceId: 'test'
      };

      const response = await request(BASE_URL)
        .post('/api/commands')
        .set('x-api-key', API_KEY)
        .send(invalidCommand);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    test('POST /api/commands with missing required fields should return 400', async () => {
      const invalidCommand = {
        command: 'run_workspace'
        // missing workspaceId
      };

      const response = await request(BASE_URL)
        .post('/api/commands')
        .set('x-api-key', API_KEY)
        .send(invalidCommand);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    test('GET /api/commands/:id with valid API key should return command status', async () => {
      const commandId = 'cmd_1234567890_test123';

      const response = await request(BASE_URL)
        .get(`/api/commands/${commandId}`)
        .set('x-api-key', API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(commandId);
      expect(response.body.status).toBeDefined();
    });

    test('GET /api/commands/:id with invalid ID format should return 400', async () => {
      const invalidId = 'invalid-id';

      const response = await request(BASE_URL)
        .get(`/api/commands/${invalidId}`)
        .set('x-api-key', API_KEY);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    test('GET /api/commands should return command list', async () => {
      const response = await request(BASE_URL)
        .get('/api/commands')
        .set('x-api-key', API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.commands).toBeDefined();
      expect(Array.isArray(response.body.commands)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('POST /api/commands should be rate limited', async () => {
      const promises = [];

      // Send many requests quickly
      for (let i = 0; i < 120; i++) {
        promises.push(
          request(BASE_URL)
            .post('/api/commands')
            .set('x-api-key', API_KEY)
            .send({
              command: 'run_workspace',
              workspaceId: 'test-workspace'
            })
        );
      }

      const responses = await Promise.all(promises);

      // At least one should be rate limited (429)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('WebSocket Communication', () => {
    test('WebSocket connection should be established', (done) => {
      const ws = new WebSocket(WS_URL);

      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('connected');
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('WebSocket should handle ping-pong', (done) => {
      const ws = new WebSocket(WS_URL);

      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'ping' }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'pong') {
          expect(message.timestamp).toBeDefined();
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });
});