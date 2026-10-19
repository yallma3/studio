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
import { SidecarClient, SidecarCommand, SidecarResponse } from '@/modules/api/SidecarClient';

// Mock WebSocket
const mockWebSocket = {
  readyState: 0,
  OPEN: 1,
  CONNECTING: 0,
  CLOSING: 2,
  CLOSED: 3,
  send: vi.fn(),
  close: vi.fn(),
  onopen: null as (() => void) | null,
  onmessage: null as ((event: any) => void) | null,
  onclose: null as (() => void) | null,
  onerror: null as ((error: any) => void) | null,
};

// Mock WebSocket constructor
global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket) as any;

// Mock console methods
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_CORE_WS: 'ws://localhost:3001',
  },
  writable: true,
});

describe('SidecarClient', () => {
  let client: SidecarClient;
  let mockWS: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mock WebSocket for each test
    mockWS = {
      readyState: 0,
      OPEN: 1,
      CONNECTING: 0,
      CLOSING: 2,
      CLOSED: 3,
      send: vi.fn(),
      close: vi.fn(),
      onopen: null as (() => void) | null,
      onmessage: null as ((event: any) => void) | null,
      onclose: null as (() => void) | null,
      onerror: null as ((error: any) => void) | null,
    };

// Mock WebSocket constructor and constants
global.WebSocket = vi.fn().mockImplementation(() => mockWS) as any;
(global.WebSocket as any).OPEN = 1;
(global.WebSocket as any).CONNECTING = 0;
(global.WebSocket as any).CLOSING = 2;
(global.WebSocket as any).CLOSED = 3;

    client = new SidecarClient();
  });

  afterEach(() => {
    vi.clearAllTimers();
    consoleLogSpy.mockClear();
    consoleWarnSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  describe('Constructor', () => {
    it('should use default WebSocket URL when no URL provided', () => {
      const client = new SidecarClient();
      expect(client).toBeDefined();
      // The URL is set in constructor but private, we'll test it through connection
    });

    it('should use provided WebSocket URL', () => {
      const customUrl = 'ws://custom:8080';
      const client = new SidecarClient(customUrl);
      expect(client).toBeDefined();
    });
  });

  describe('Connection Management', () => {
    it('should establish connection successfully', () => {
      client.connect();

      expect(global.WebSocket).toHaveBeenCalledTimes(1);
      expect(client.getConnectionStatus()).toBe('connecting');

      // Simulate successful connection
      mockWS.readyState = 1;
      mockWS.onopen();

      expect(client.getConnectionStatus()).toBe('connected');
      expect(consoleLogSpy).toHaveBeenCalledWith('Connected to sidecar WebSocket');
    });

    it('should not create new connection if already connected', () => {
      client.connect();
      mockWS.readyState = 1; // Set to OPEN
      mockWS.onopen();

      client.connect(); // Should not create new connection

      expect(global.WebSocket).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors', () => {
      client.connect();

      const testError = new Error('Connection failed');
      mockWS.onerror(testError);

      expect(client.getConnectionStatus()).toBe('error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('WebSocket error:', testError);
    });

    it('should send abort_workspace on connection error when previously connected', () => {
      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      mockWS.onerror(new Error('Connection lost'));

      expect(client.getConnectionStatus()).toBe('error');
      expect(mockWS.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(mockWS.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('abort_workspace');
      expect(sentMessage.timestamp).toBeDefined();
    });

    it('should handle WebSocket creation errors', () => {
      (global.WebSocket as any).mockImplementationOnce(() => {
        throw new Error('WebSocket creation failed');
      });

      client.connect();

      expect(client.getConnectionStatus()).toBe('error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create WebSocket connection:', expect.any(Error));
    });

    it('should disconnect properly', () => {
      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      client.disconnect();

      expect(mockWS.close).toHaveBeenCalledTimes(1);
      expect(client.getConnectionStatus()).toBe('disconnected');
    });

    it('should handle disconnection', () => {
      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      mockWS.onclose();

      expect(client.getConnectionStatus()).toBe('disconnected');
      expect(consoleLogSpy).toHaveBeenCalledWith('Disconnected from sidecar WebSocket');
    });
  });

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should attempt reconnection on disconnection', () => {
      client.connect();
      mockWS.onclose();

      expect(client.getConnectionStatus()).toBe('disconnected');

      vi.advanceTimersByTime(3000);

      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it('should stop reconnection after max attempts and set failed status', () => {
      client.connect();

      // Simulate 6 failed reconnections (max is 5)
      for (let i = 0; i < 6; i++) {
        mockWS.onclose();
        vi.advanceTimersByTime(3000);
      }

      expect(global.WebSocket).toHaveBeenCalledTimes(6); // 1 initial + 5 reconnections
      expect(consoleErrorSpy).toHaveBeenCalledWith('Max reconnection attempts reached');
      expect(client.getConnectionStatus()).toBe('failed');
    });

    it('should not reconnect when shouldReconnect is false', () => {
      client.connect();
      client.disconnect(); // This sets shouldReconnect to false

      mockWS.onclose();

      vi.advanceTimersByTime(3000);

      expect(global.WebSocket).toHaveBeenCalledTimes(1); // Only initial connection
    });
  });

  describe('Message Handling', () => {
    it('should parse and handle incoming commands', () => {
      const mockCallback = vi.fn();
      client.onCommand(mockCallback);

      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      const testCommand: SidecarCommand = {
        requestId: 'test-id',
        type: 'message',
        data: { message: 'test' },
      };

      mockWS.onmessage({ data: JSON.stringify(testCommand) });

      expect(mockCallback).toHaveBeenCalledWith(testCommand);
      expect(consoleLogSpy).toHaveBeenCalledWith('Received command from sidecar:', testCommand);
    });

    it('should handle invalid JSON messages', () => {
      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      mockWS.onmessage({ data: 'invalid json' });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to parse WebSocket message:', expect.any(SyntaxError));
    });

    it('should trigger console event callbacks for workflow_output commands', () => {
      const mockConsoleCallback = vi.fn();
      client.onConsoleEvent(mockConsoleCallback);

      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      const testCommand: SidecarCommand = {
        type: 'workflow_output',
        data: { output: 'test output' },
      };

      mockWS.onmessage({ data: JSON.stringify(testCommand) });

      expect(mockConsoleCallback).toHaveBeenCalledWith(testCommand.data);
    });
  });

  describe('Message Sending', () => {
    it('should send messages when connected', () => {
      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      const testMessage: SidecarCommand = {
        type: 'ping',
      };

      const { requestId, promise } = client.sendMessage(testMessage);

      expect(requestId).toBeDefined();
      expect(testMessage.requestId).toBe(requestId);
      expect(mockWS.send).toHaveBeenCalled();
      const sent = JSON.parse(mockWS.send.mock.calls[0][0]);
      expect(sent.type).toBe('ping');
      expect(sent.requestId).toBe(requestId);
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should send messages with existing requestId', () => {
      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      const testMessage: SidecarCommand = {
        requestId: 'custom-id',
        type: 'ping',
      };

      const { requestId, promise } = client.sendMessage(testMessage);

      expect(requestId).toBe('custom-id');
      expect(mockWS.send).toHaveBeenCalledWith(JSON.stringify(testMessage));
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should reject promise when not connected', async () => {
      const testMessage: SidecarCommand = {
        type: 'ping',
      };

      const { promise } = client.sendMessage(testMessage);

      await expect(promise).rejects.toMatchObject({
        code: 'INTERNAL_ERROR',
        message: 'WebSocket not connected',
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot send message: WebSocket not connected');
    });

    it('should send responses when connected', () => {
      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      const testResponse: SidecarResponse = {
        id: 'test-id',
        success: true,
        message: 'OK',
        data: { result: 'success' },
      };

      client.sendResponse(testResponse);

      expect(mockWS.send).toHaveBeenCalledWith(JSON.stringify(testResponse));
    });

    it('should not send responses when not connected', () => {
      const testResponse: SidecarResponse = {
        id: 'test-id',
        success: false,
        message: 'Error',
      };

      client.sendResponse(testResponse);

      expect(mockWS.send).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot send response: WebSocket not connected');
    });
  });

  describe('Callback Management', () => {
    it('should register and call status change callbacks', () => {
      const mockCallback = vi.fn();
      client.onStatusChange(mockCallback);

      client.connect();
      mockWS.onopen();

      expect(mockCallback).toHaveBeenCalledWith('connected');
    });

    it('should remove status change callbacks', () => {
      const mockCallback = vi.fn();
      client.onStatusChange(mockCallback);
      client.offStatusChange(mockCallback);

      client.connect();
      mockWS.onopen();

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should register and call command callbacks', () => {
      const mockCallback = vi.fn();
      client.onCommand(mockCallback);

      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      const testCommand: SidecarCommand = { type: 'ping' };
      mockWS.onmessage({ data: JSON.stringify(testCommand) });

      expect(mockCallback).toHaveBeenCalledWith(testCommand);
    });

    it('should remove command callbacks', () => {
      const mockCallback = vi.fn();
      client.onCommand(mockCallback);
      client.offCommand(mockCallback);

      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      const testCommand: SidecarCommand = { type: 'ping' };
      mockWS.onmessage({ data: JSON.stringify(testCommand) });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should register and call console event callbacks', () => {
      const mockCallback = vi.fn();
      client.onConsoleEvent(mockCallback);

      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      const testCommand: SidecarCommand = {
        type: 'workflow_output',
        data: 'test data',
      };
      mockWS.onmessage({ data: JSON.stringify(testCommand) });

      expect(mockCallback).toHaveBeenCalledWith('test data');
    });

    it('should remove console event callbacks', () => {
      const mockCallback = vi.fn();
      client.onConsoleEvent(mockCallback);
      client.offConsoleEvent(mockCallback);

      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      const testCommand: SidecarCommand = {
        type: 'workflow_output',
        data: 'test data',
      };
      mockWS.onmessage({ data: JSON.stringify(testCommand) });

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should reject pending promise on incoming error response', async () => {
      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      const testMessage: SidecarCommand = {
        type: 'run_workspace',
      };

      const { requestId, promise } = client.sendMessage(testMessage);

      const errorResponse = {
        type: 'error',
        requestId,
        commandType: 'run_workspace',
        code: 'EXECUTION_ERROR',
        message: 'Something went wrong',
        timestamp: new Date().toISOString(),
      };

      mockWS.onmessage({ data: JSON.stringify(errorResponse) });

      await expect(promise).rejects.toMatchObject({
        code: 'EXECUTION_ERROR',
        message: 'Something went wrong',
      });
    });

    it('should reject on timeout', async () => {
      vi.useFakeTimers();
      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      const testMessage: SidecarCommand = {
        type: 'run_workspace',
      };

      const { promise } = client.sendMessage(testMessage, 500);

      vi.advanceTimersByTime(500);

      await expect(promise).rejects.toMatchObject({
        code: 'TIMEOUT',
      });

      vi.useRealTimers();
    });

    it('should reject all pending requests onclose', async () => {
      client.connect();
      mockWS.readyState = 1;
      mockWS.onopen();

      const { promise: p1 } = client.sendMessage({ type: 'ping' });
      const { promise: p2 } = client.sendMessage({ type: 'run_workspace' });

      mockWS.onclose();

      await expect(p1).rejects.toMatchObject({ message: 'Connection lost' });
      await expect(p2).rejects.toMatchObject({ message: 'Connection lost' });
    });
  });

  describe('Reconnection', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set status to failed after max reconnect attempts', () => {
      client.connect();

      // Simulate max reconnection attempts (5 successful, 1 that exceeds)
      for (let i = 0; i < 6; i++) {
        mockWS.onclose();
        vi.advanceTimersByTime(3000);
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith('Max reconnection attempts reached');
      expect(client.getConnectionStatus()).toBe('failed');
    });

    it('should reset and reconnect via reconnect()', () => {
      client.connect();
      mockWS.onopen();

      client.disconnect();
      expect(client.getConnectionStatus()).toBe('disconnected');

      // Simulate that reconnect attempts were exhausted
      vi.advanceTimersByTime(3000);

      client.reconnect();

      expect(global.WebSocket).toHaveBeenCalledTimes(2);
      expect(client.getConnectionStatus()).toBe('connecting');
    });
  });

  describe('Connection Status', () => {
    it('should return correct initial status', () => {
      expect(client.getConnectionStatus()).toBe('disconnected');
    });

    it('should return correct status during connection lifecycle', () => {
      expect(client.getConnectionStatus()).toBe('disconnected');

      client.connect();
      expect(client.getConnectionStatus()).toBe('connecting');

      mockWS.onopen();
      expect(client.getConnectionStatus()).toBe('connected');

      mockWS.onclose();
      expect(client.getConnectionStatus()).toBe('disconnected');
    });
  });
});