/**
 * Invite System - Validation
 *
 * Functions for validating invite codes.
 */

import { prisma } from "../db/client";
import {
  InviteValidationResult,
  InviteValidationError,
} from "./types";

/**
 * Validate UUID format
 *
 * Invite codes are UUIDs, so we can validate the format before database lookup.
 */
function isValidUUID(code: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(code);
}

/**
 * Validate an invite code
 *
 * Checks:
 * 1. Code format (UUID)
 * 2. Code exists in database
 * 3. Code has not been used
 *
 * @param code - The invite code to validate
 * @returns Validation result with invite ID if valid, error message if invalid
 *
 * @example
 * ```ts
 * const result = await validateInviteCode('abc-123-def');
 * if (result.valid) {
 *   console.log('Valid invite:', result.inviteId);
 * } else {
 *   console.error('Invalid:', result.error);
 * }
 * ```
 */
export async function validateInviteCode(
  code: string,
): Promise<InviteValidationResult> {
  // Validate format first (fail fast)
  if (!isValidUUID(code)) {
    return {
      valid: false,
      error: InviteValidationError.INVALID_FORMAT,
    };
  }

  // Look up invite code
  const invite = await prisma.invite_codes.findUnique({
    where: { code },
    select: {
      id: true,
      used_by: true,
      used_at: true,
    },
  });

  // Check if code exists
  if (!invite) {
    return {
      valid: false,
      error: InviteValidationError.NOT_FOUND,
    };
  }

  // Check if code has been used
  if (invite.used_by || invite.used_at) {
    return {
      valid: false,
      error: InviteValidationError.ALREADY_USED,
    };
  }

  // Code is valid and unused
  return {
    valid: true,
    inviteId: invite.id,
  };
}

/**
 * Check if an invite code exists and is unused (simplified check)
 *
 * @param code - The invite code to check
 * @returns True if code is valid and unused, false otherwise
 */
export async function isInviteCodeValid(code: string): Promise<boolean> {
  const result = await validateInviteCode(code);
  return result.valid;
}
