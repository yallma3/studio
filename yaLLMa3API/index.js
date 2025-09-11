require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const WebSocket = require('ws');
const http = require('http');
const logger = require('./logger');
const errorMonitor = require('./errorMonitor');
const { setupWebSocketServer } = require('./websocket/server');
const commandsRouter = require('./routes/commands');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined', { stream: logger.stream }));
app.use(express.json());

// Routes
app.use('/api/commands', commandsRouter);

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.version,
    memory: process.memoryUsage()
  });
});

// Detailed health check
app.get('/health/detailed', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.version,
    memory: process.memoryUsage(),
    environment: {
      node_env: process.env.NODE_ENV,
      http_port: HTTP_PORT,
      ws_port: WS_PORT
    },
    services: {
      websocket: wsServerInstance ? 'connected' : 'disconnected',
      websocket_clients: wsServerInstance ? wsServerInstance.getClientCount() : 0
    }
  };

  // Check if services are healthy
  if (!wsServerInstance) {
    health.status = 'degraded';
    health.services.websocket = 'disconnected';
  }

  res.json(health);
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    websocket: {
      clients: wsServerInstance ? wsServerInstance.getClientCount() : 0,
      status: wsServerInstance ? 'active' : 'inactive'
    },
    process: {
      pid: process.pid,
      platform: process.platform,
      arch: process.arch
    }
  };

  res.json(metrics);
});

// Error monitoring endpoint
app.get('/errors', (req, res) => {
  res.json(errorMonitor.getStats());
});

// Error monitoring middleware (must be last)
app.use(errorMonitor.middleware());

// Start HTTP server
const HTTP_PORT = process.env.SIDECAR_PORT || 3001;
server.listen(HTTP_PORT, () => {
  logger.info(`yaLLMa3API HTTP server running on port ${HTTP_PORT}`);
});

// Start separate WebSocket server
const WS_PORT = process.env.SIDECAR_WS_PORT || 3002;
const wsServer = http.createServer();
const wss = new WebSocket.Server({ server: wsServer });
const wsServerInstance = setupWebSocketServer(wss);

wsServer.listen(WS_PORT, () => {
  logger.info(`WebSocket server ready on ws://localhost:${WS_PORT}`);
});

// Set WebSocket server reference for commands router
commandsRouter.setWebSocketServer(wsServerInstance);

process.on('SIGTERM', () => {
  logger.info('Shutting down yaLLMa3API server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});