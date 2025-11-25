/**
 * Invite System - Type Definitions
 *
 * Core types for the invite-only registration system.
 */

import { invite_codes, users } from "@prisma/client";

/**
 * Invite code with related user data
 */
export type InviteCodeWithUsers = invite_codes & {
  creator: Pick<users, "id" | "email" | "name">;
  redeemer?: Pick<users, "id" | "email" | "name"> | null;
};

/**
 * Result of invite validation
 */
export type InviteValidationResult =
  | { valid: true; inviteId: string }
  | { valid: false; error: InviteValidationError };

/**
 * Possible invite validation errors
 */
export enum InviteValidationError {
  NOT_FOUND = "Invite code not found",
  ALREADY_USED = "Invite code has already been used",
  INVALID_FORMAT = "Invalid invite code format",
}

/**
 * Result of invite creation
 */
export interface CreateInviteResult {
  success: boolean;
  inviteCode?: string;
  inviteUrl?: string;
  error?: string;
}

/**
 * Result of invite redemption
 */
export interface RedeemInviteResult {
  success: boolean;
  inviteId?: string;
  error?: string;
}
