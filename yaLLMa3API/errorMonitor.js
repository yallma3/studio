const logger = require('./logger');

class ErrorMonitor {
  constructor() {
    this.errors = [];
    this.errorCounts = new Map();
    this.alertThresholds = {
      errorRatePerMinute: 10,
      consecutiveErrors: 5
    };
    this.consecutiveErrorCount = 0;
    this.lastAlertTime = 0;
    this.alertCooldown = 5 * 60 * 1000; // 5 minutes
  }

  trackError(error, context = {}) {
    const errorKey = `${error.name || 'Error'}:${error.message}`;
    const timestamp = Date.now();

    // Track error count
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    // Track consecutive errors
    this.consecutiveErrorCount++;

    // Store error details
    this.errors.push({
      timestamp,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    });

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors.shift();
    }

    // Check for alerts
    this.checkAlerts();

    // Log the error
    logger.error('Error tracked:', {
      error: error.message,
      context,
      consecutiveCount: this.consecutiveErrorCount
    });
  }

  checkAlerts() {
    const now = Date.now();

    // Check if we're in cooldown period
    if (now - this.lastAlertTime < this.alertCooldown) {
      return;
    }

    // Check consecutive errors
    if (this.consecutiveErrorCount >= this.alertThresholds.consecutiveErrors) {
      this.sendAlert('HIGH_CONSECUTIVE_ERRORS', {
        consecutiveCount: this.consecutiveErrorCount,
        lastError: this.errors[this.errors.length - 1]
      });
      this.lastAlertTime = now;
      return;
    }

    // Check error rate (errors per minute in last 5 minutes)
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const recentErrors = this.errors.filter(e => e.timestamp > fiveMinutesAgo);
    const errorRate = recentErrors.length / 5; // errors per minute

    if (errorRate >= this.alertThresholds.errorRatePerMinute) {
      this.sendAlert('HIGH_ERROR_RATE', {
        errorRate,
        timeWindow: '5 minutes',
        errorCount: recentErrors.length
      });
      this.lastAlertTime = now;
    }
  }

  sendAlert(type, data) {
    const alert = {
      type,
      timestamp: new Date().toISOString(),
      data,
      severity: type === 'HIGH_CONSECUTIVE_ERRORS' ? 'critical' : 'warning'
    };

    logger.warn('ALERT TRIGGERED:', alert);

    // In a real implementation, this would send alerts to:
    // - Email
    // - Slack
    // - Monitoring service (DataDog, New Relic, etc.)
    // - SMS

    // For now, just log it
    console.log(`🚨 ALERT: ${type} - ${JSON.stringify(data, null, 2)}`);
  }

  resetConsecutiveErrors() {
    this.consecutiveErrorCount = 0;
  }

  getStats() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentErrors = this.errors.filter(e => e.timestamp > oneHourAgo);
    const dailyErrors = this.errors.filter(e => e.timestamp > oneDayAgo);

    return {
      totalErrors: this.errors.length,
      errorsLastHour: recentErrors.length,
      errorsLast24Hours: dailyErrors.length,
      consecutiveErrorCount: this.consecutiveErrorCount,
      topErrors: Array.from(this.errorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([error, count]) => ({ error, count })),
      lastError: this.errors[this.errors.length - 1] || null
    };
  }

  middleware() {
    return (err, req, res, next) => {
      this.trackError(err, {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Don't call next() since this is error handling middleware
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    };
  }
}

// Export singleton instance
module.exports = new ErrorMonitor();