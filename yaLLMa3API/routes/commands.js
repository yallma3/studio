const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../logger');
const errorMonitor = require('../errorMonitor');
const router = express.Router();

// Rate limiting configurations
const createCommandLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many command requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// Validation chains
const validateCommandSubmission = [
  body('command')
    .exists({ checkFalsy: true })
    .withMessage('Command is required')
    .isString()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z_]+$/)
    .withMessage('Command must be a valid string identifier'),
  body('workspaceId')
    .if(body('command').equals('run_workspace'))
    .exists({ checkFalsy: true })
    .withMessage('workspaceId is required for run_workspace command')
    .isString()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('workspaceId must be alphanumeric with dashes/underscores'),
  body('taskId')
    .if(body('command').equals('run_task'))
    .exists({ checkFalsy: true })
    .withMessage('taskId is required for run_task command')
    .isString()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('taskId must be alphanumeric with dashes/underscores'),
  body('workflowId')
    .if(body('command').equals('run_workflow'))
    .exists({ checkFalsy: true })
    .withMessage('workflowId is required for run_workflow command')
    .isString()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('workflowId must be alphanumeric with dashes/underscores'),
  body('parameters')
    .optional()
    .isObject()
    .withMessage('parameters must be an object'),
  handleValidationErrors
];

const validateCommandId = [
  param('id')
    .isString()
    .matches(/^cmd_\d+_[a-zA-Z0-9]+$/)
    .withMessage('Invalid command ID format'),
  handleValidationErrors
];

const validateListCommands = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset must be non-negative'),
  handleValidationErrors
];


// Authentication middleware
const authenticateRequest = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide an API key in x-api-key header or Authorization header',
      timestamp: new Date().toISOString()
    });
  }

  const expectedKey = process.env.SIDECAR_API_KEY;
  if (!expectedKey) {
    console.warn('SIDECAR_API_KEY environment variable not set');
    return res.status(500).json({
      error: 'Server configuration error',
      timestamp: new Date().toISOString()
    });
  }

  if (apiKey !== expectedKey) {
    return res.status(403).json({
      error: 'Invalid API key',
      timestamp: new Date().toISOString()
    });
  }

  next();
};



// Global reference to WebSocket server (will be set from main server)
let wsServer = null;

// Set WebSocket server reference
const setWebSocketServer = (server) => {
  wsServer = server;
};

// Command processing function
const processCommand = async (commandData) => {
  const { command, ...data } = commandData;
  const commandId = generateCommandId();

  logger.info(`Processing command ${commandId}:`, { command, data });

  // Store command in a database/queue (placeholder for future implementation)
  // For now, simulate processing
  const result = {
    id: commandId,
    command,
    status: 'queued',
    message: `Command ${command} queued for execution`,
    timestamp: new Date().toISOString(),
    data
  };

  // Broadcast command to WebSocket clients for execution
  if (wsServer && wsServer.broadcastCommand) {
    try {
      wsServer.broadcastCommand(result);
      logger.info(`Command ${commandId} broadcasted to WebSocket clients`);
    } catch (error) {
      logger.error(`Failed to broadcast command ${commandId}:`, error);
      result.status = 'error';
      result.message = 'Failed to broadcast command to execution clients';
    }
  } else {
    logger.warn(`WebSocket server not available for command ${commandId}`);
  }

  return result;
};

// Generate unique command ID
const generateCommandId = () => {
  return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// POST /api/commands - Submit command
router.post('/', createCommandLimiter, authenticateRequest, validateCommandSubmission, async (req, res) => {
  try {
    const result = await processCommand(req.body);

    res.status(202).json({
      success: true,
      ...result
    });
  } catch (error) {
    errorMonitor.trackError(error, { endpoint: '/api/commands', method: 'POST' });
    res.status(500).json({
      error: 'Failed to process command',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/commands/:id - Get command status
router.get('/:id', generalLimiter, authenticateRequest, validateCommandId, (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, this would query the database for command status
    // For now, return a placeholder response
    res.json({
      id,
      status: 'completed', // This would be dynamic based on actual status
      message: 'Command completed successfully',
      timestamp: new Date().toISOString(),
      result: {
        // Placeholder result data
        executionTime: 1500,
        output: 'Command executed successfully'
      }
    });
  } catch (error) {
    errorMonitor.trackError(error, { endpoint: '/api/commands/:id', method: 'GET' });
    res.status(500).json({
      error: 'Failed to retrieve command status',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/commands - List recent commands (optional)
router.get('/', generalLimiter, authenticateRequest, validateListCommands, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // In a real implementation, this would query the database
    // For now, return empty array
    res.json({
      commands: [],
      total: 0,
      limit,
      offset,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    errorMonitor.trackError(error, { endpoint: '/api/commands', method: 'GET' });
    res.status(500).json({
      error: 'Failed to list commands',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
module.exports.setWebSocketServer = setWebSocketServer;