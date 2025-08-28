import * as speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export interface MFASecret {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export interface MFASetup {
  secret: string
  qrCodeUrl: string
  manualEntryKey: string
  backupCodes: string[]
}

/**
 * Generate MFA secret and QR code for user setup
 */
export async function generateMFASecret(userEmail: string, appName = 'CoalTools'): Promise<MFASetup> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: userEmail,
    issuer: appName,
    length: 32
  })

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

  // Generate backup codes
  const backupCodes = generateBackupCodes()

  return {
    secret: secret.base32!,
    qrCodeUrl,
    manualEntryKey: secret.base32!,
    backupCodes
  }
}

/**
 * Verify MFA token
 */
export function verifyMFAToken(token: string, secret: string, window = 1): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window // Allow 1 step before and after for clock drift
  })
}

/**
 * Generate backup codes for MFA recovery
 */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    codes.push(code)
  }
  
  return codes
}

/**
 * Verify backup code (should be used only once)
 */
export function verifyBackupCode(inputCode: string, validCodes: string[]): boolean {
  return validCodes.includes(inputCode.toUpperCase())
}

/**
 * Remove used backup code from valid codes
 */
export function removeUsedBackupCode(usedCode: string, validCodes: string[]): string[] {
  return validCodes.filter(code => code !== usedCode.toUpperCase())
}

/**
 * Check if MFA is required for user
 */
export function isMFARequired(userRole: string): boolean {
  // Require MFA for admin and manager roles
  return ['ADMIN', 'MANAGER', 'admin', 'approver'].includes(userRole)
}

/**
 * Validate MFA setup completion
 */
export function validateMFASetup(secret: string, verificationToken: string): boolean {
  return verifyMFAToken(verificationToken, secret, 2) // Wider window for setup
}
