/**
 * Password Hashing Utilities
 *
 * Secure password hashing and verification using bcrypt.
 */

import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

/**
 * Hash a plain text password
 *
 * @param password - Plain text password to hash
 * @returns Hashed password
 *
 * @example
 * const hashed = await hashPassword('mysecretpassword')
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns True if password matches hash
 *
 * @example
 * const isValid = await verifyPassword('mysecretpassword', user.password)
 * if (isValid) {
 *   // Password is correct
 * }
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}
