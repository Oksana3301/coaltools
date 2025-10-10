export const SECURITY_CONFIG = {
  // Rate Limiting
  rateLimit: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutMs: 30 * 60 * 1000, // 30 minutes
    enabled: true
  },

  // Multi-Factor Authentication
  mfa: {
    enabled: process.env.NODE_ENV === 'production',
    required: {
      admin: true,
      manager: true,
      staff: false
    },
    backupCodesCount: 10,
    totpWindow: 1 // Allow 1 step before/after for clock drift
  },

  // Session Management
  session: {
    timeoutMs: 8 * 60 * 60 * 1000, // 8 hours
    extendOnActivity: true,
    secureCookies: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const
  },

  // Password Requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    preventReuse: 5 // Last 5 passwords
  },

  // Account Security
  account: {
    maxLoginAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    passwordResetExpiry: 24 * 60 * 60 * 1000, // 24 hours
    emailVerificationRequired: false
  },

  // Audit & Monitoring
  audit: {
    logFailedLogins: true,
    logSuccessfulLogins: true,
    logLogouts: true,
    logPasswordChanges: true,
    logMFAEvents: true,
    retentionDays: 90
  },

  // Content Security
  csp: {
    enabled: process.env.NODE_ENV === 'production',
    reportOnly: false,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'blob:'],
      'connect-src': ["'self'"],
      'font-src': ["'self'"],
      'frame-src': ["'none'"],
      'object-src': ["'none'"]
    }
  }
}

export type SecurityConfig = typeof SECURITY_CONFIG
