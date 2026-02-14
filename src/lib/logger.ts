/**
 * Logger Utility
 * Provides structured logging with correlation IDs and log levels
 * Supports debug/info/warn/error levels with automatic formatting
 * Now includes database persistence for production monitoring
 */

import { supabase } from './supabase';

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
 * Sensitive field names to sanitize in logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'apiKey',
  'api_key',
  'secret',
  'sessionId',
  'session_id'
];

/**
 * Sanitize sensitive data before logging
 */
function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  // Don't sanitize primitive types
  if (typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  // Handle objects
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(field => 
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      // For email, show partial
      if (lowerKey.includes('email')) {
        const emailStr = String(value);
        const parts = emailStr.split('@');
        if (parts.length === 2) {
          sanitized[key] = `${parts[0].substring(0, 2)}***@${parts[1]}`;
        } else {
          sanitized[key] = '***';
        }
      } else {
        sanitized[key] = '***hidden***';
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
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
  private dbPersistenceEnabled: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.isProduction = import.meta.env.PROD;
    this.minLevel = this.isDevelopment ? 'debug' : 'info';
    // Enable DB persistence in production for warn/error logs only
    this.dbPersistenceEnabled = this.isProduction;
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
    
    // Keep only the last N logs (prevent memory issues)
    if (this.logs.length > this.maxStoredLogs) {
      this.logs.shift();
    }
  }

  /**
   * Persist log to database (for production monitoring)
   * Only persists warn/error logs to avoid overwhelming the database
   */
  private async persistToDatabase(entry: LogEntry): Promise<void> {
    // Only persist warn/error in production
    if (!this.dbPersistenceEnabled || (entry.level !== 'warn' && entry.level !== 'error')) {
      return;
    }

    try {
      if (!supabase) {
        return; // Silently skip if Supabase not configured
      }

      // Call the RPC function to log the event
      await supabase.rpc('log_system_event', {
        p_level: entry.level,
        p_category: entry.category,
        p_message: entry.message,
        p_metadata: entry.data ? JSON.parse(JSON.stringify(entry.data)) : {},
        p_correlation_id: entry.correlationId || null,
        p_url: typeof window !== 'undefined' ? window.location.href : null,
        p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });
    } catch (error) {
      // Never let DB logging crash the app - fail silently
      if (this.isDevelopment) {
        console.debug('[Logger] Failed to persist to database:', error);
      }
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

    // Sanitize data before storing/logging
    const sanitizedData = data ? sanitizeData(data) : undefined;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: sanitizedData,
      correlationId
    };

    // Store in memory
    this.storeLog(entry);

    // Persist to database (async, fire-and-forget)
    this.persistToDatabase(entry).catch(() => {
      // Silently ignore DB persistence errors
    });

    // Console output
    const formattedMessage = this.formatLogEntry(entry);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, sanitizedData);
        break;
      case 'info':
        console.info(formattedMessage, sanitizedData);
        break;
      case 'warn':
        console.warn(formattedMessage, sanitizedData);
        break;
      case 'error':
        console.error(formattedMessage, sanitizedData);
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
