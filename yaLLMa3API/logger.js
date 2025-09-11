const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define the format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Get app data directory for logs
const getAppDataDir = () => {
  // Check for environment variable first (set by main application)
  if (process.env.YA_API_LOG_DIR) {
    return process.env.YA_API_LOG_DIR;
  }

  // Fallback to platform-specific defaults
  const os = require('os');
  const path = require('path');
  const platform = os.platform();
  const homeDir = os.homedir();

  switch (platform) {
    case 'linux':
      return path.join(homeDir, '.local', 'share', 'org.yallma3.studio');
    case 'darwin': // macOS
      return path.join(homeDir, 'Library', 'Application Support', 'org.yallma3.studio');
    case 'win32':
      return path.join(homeDir, 'AppData', 'Roaming', 'org.yallma3.studio');
    default:
      return path.join(homeDir, '.yaLLMa3');
  }
};

// Use app data directory for logs
const appDataDir = getAppDataDir();
const logsDir = path.join(appDataDir, 'logs');

// Ensure logs directory exists
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define which transports the logger must use
const transports = [
  // Console transport for development
  new winston.transports.Console(),

  // File transport for all logs with rotation
  new winston.transports.File({
    filename: path.join(logsDir, 'yaLLMa3API.log'),
    level: 'info',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5, // Keep 5 rotated files
  }),

  // File transport for error logs with rotation
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10, // Keep 10 rotated files
  }),

  // File transport for HTTP logs with rotation
  new winston.transports.File({
    filename: path.join(logsDir, 'http.log'),
    level: 'http',
    maxsize: 20 * 1024 * 1024, // 20MB
    maxFiles: 3, // Keep 3 rotated files
  }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
});

// Logs directory creation is now handled above with appDataDir

// Log cleanup function to remove old rotated files
const cleanupOldLogs = () => {
  const fs = require('fs');
  const path = require('path');

  try {
    // List all files in logs directory
    const files = fs.readdirSync(logsDir);

    // Group files by base name
    const fileGroups = {};

    files.forEach(file => {
      if (file.endsWith('.log')) {
        const baseName = file;
        if (!fileGroups[baseName]) {
          fileGroups[baseName] = [];
        }
        fileGroups[baseName].push(file);
      }
    });

    // Clean up each group (keep only the configured maxFiles)
    Object.keys(fileGroups).forEach(baseName => {
      const groupFiles = fileGroups[baseName].sort();

      // Find the transport config for this file type
      let maxFiles = 5; // default
      if (baseName === 'error.log') maxFiles = 10;
      if (baseName === 'http.log') maxFiles = 3;

      // Remove excess files
      if (groupFiles.length > maxFiles) {
        const filesToRemove = groupFiles.slice(0, groupFiles.length - maxFiles);
        filesToRemove.forEach(file => {
          try {
            fs.unlinkSync(path.join(logsDir, file));
            logger.info(`Cleaned up old log file: ${file}`);
          } catch (err) {
            logger.warn(`Failed to remove old log file ${file}:`, err.message);
          }
        });
      }
    });
  } catch (error) {
    logger.warn('Failed to cleanup old log files:', error.message);
  }
};

// Run cleanup on startup
setTimeout(cleanupOldLogs, 5000); // Delay to allow file creation first

// Export logger and stream for morgan HTTP logging
module.exports = logger;
module.exports.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};