import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

/**
 * Hashes a plaintext password using bcrypt with standard cost factor.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false
  return bcrypt.compare(password, hash)
}

/**
 * Validates password strength policy:
 * - Minimum 8 characters
 * - At least one uppercase letter or lowercase letter
 * - At least one number or special character
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter')
  }
  if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one number or special symbol')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
