/**
 * Logger Utility
 * Provides structured logging with correlation IDs and log levels
 * Supports debug/info/warn/error levels with automatic formatting
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  correlationId?: string;
  category: string;
  message: string;
  data?: unknown;
}

/**
 * Generate a unique correlation ID for tracking requests
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Logger class for structured logging
 */
class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;
  private minLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxStoredLogs = 100; // Keep last 100 logs in memory

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.isProduction = import.meta.env.PROD;
    this.minLevel = this.isDevelopment ? 'debug' : 'info';
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * Format log entry for console output
   */
  private formatLogEntry(entry: LogEntry): string {
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };

    const parts = [
      emoji[entry.level],
      `[${entry.timestamp}]`,
      `[${entry.category}]`,
      entry.correlationId ? `[CID:${entry.correlationId}]` : '',
      entry.message
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * Store log entry in memory
   */
  private storeLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the last N logs
    if (this.logs.length > this.maxStoredLogs) {
      this.logs.shift();
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    category: string,
    message: string,
    data?: unknown,
    correlationId?: string
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      correlationId
    };

    // Store in memory
    this.storeLog(entry);

    // Console output
    const formattedMessage = this.formatLogEntry(entry);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, data);
        break;
      case 'info':
        console.info(formattedMessage, data);
        break;
      case 'warn':
        console.warn(formattedMessage, data);
        break;
      case 'error':
        console.error(formattedMessage, data);
        break;
    }
  }

  /**
   * Debug level logging (development only)
   */
  debug(category: string, message: string, data?: unknown, correlationId?: string): void {
    this.log('debug', category, message, data, correlationId);
  }

  /**
   * Info level logging
   */
  info(category: string, message: string, data?: unknown, correlationId?: string): void {
    this.log('info', category, message, data, correlationId);
  }

  /**
   * Warning level logging
   */
  warn(category: string, message: string, data?: unknown, correlationId?: string): void {
    this.log('warn', category, message, data, correlationId);
  }

  /**
   * Error level logging
   */
  error(category: string, message: string, error?: unknown, correlationId?: string): void {
    // Extract error details if it's an Error object
    const errorData = error instanceof Error 
      ? { 
          name: error.name, 
          message: error.message, 
          stack: this.isDevelopment ? error.stack : undefined 
        }
      : error;

    this.log('error', category, message, errorData, correlationId);
  }

  /**
   * Get stored logs (for debug screen)
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON (for debugging)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const logger = new Logger();

/**
 * Create a logger with automatic correlation ID
 */
export function createCorrelatedLogger(category: string) {
  const correlationId = generateCorrelationId();
  
  return {
    correlationId,
    debug: (message: string, data?: unknown) => logger.debug(category, message, data, correlationId),
    info: (message: string, data?: unknown) => logger.info(category, message, data, correlationId),
    warn: (message: string, data?: unknown) => logger.warn(category, message, data, correlationId),
    error: (message: string, error?: unknown) => logger.error(category, message, error, correlationId),
  };
}

// Export default logger for convenience
export default logger;
