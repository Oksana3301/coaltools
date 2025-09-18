/**
 * Logging utility untuk CoalTools
 * Hanya log di development environment untuk menghindari console log di production
 */

export class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Log error messages - hanya di development
   */
  static error(message: string, error?: any, context?: Record<string, any>) {
    if (this.isDevelopment) {
      console.error(`❌ ${message}`, error)
      if (context) {
        console.error('Context:', context)
      }
    }
  }

  /**
   * Log warning messages - hanya di development
   */
  static warn(message: string, data?: any) {
    if (this.isDevelopment) {
      console.warn(`⚠️ ${message}`, data)
    }
  }

  /**
   * Log info messages - hanya di development
   */
  static info(message: string, data?: any) {
    if (this.isDevelopment) {
      console.info(`ℹ️ ${message}`, data)
    }
  }

  /**
   * Log debug messages - hanya di development
   */
  static debug(message: string, data?: any) {
    if (this.isDevelopment) {
      console.debug(`🐛 ${message}`, data)
    }
  }

  /**
   * Log API errors dengan format yang konsisten
   */
  static apiError(endpoint: string, error: any, context?: Record<string, any>) {
    if (this.isDevelopment) {
      console.error(`❌ API Error [${endpoint}]:`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack',
        ...context
      })
    }
  }

  /**
   * Log database errors dengan format yang konsisten
   */
  static dbError(operation: string, error: any, context?: Record<string, any>) {
    if (this.isDevelopment) {
      console.error(`❌ Database Error [${operation}]:`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        code: error?.code,
        ...context
      })
    }
  }
}

// Export default instance
export const logger = Logger