import winston from 'winston';

/**
 * Production-grade logging system
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'signal-recruitment' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Write errors to file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // Write all logs to file
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// Create logs directory if it doesn't exist
if (process.env.NODE_ENV !== 'production') {
  const fs = require('fs');
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
  }
}

export default logger;

