/**
 * Invite System - Actions
 *
 * Functions for creating and redeeming invite codes.
 */

import { prisma } from "../db/client";
import { CreateInviteResult, RedeemInviteResult } from "./types";

/**
 * Create a new invite code
 *
 * Only admins should call this function. Authorization should be checked
 * by the caller (e.g., API route or server action).
 *
 * @param createdBy - User ID of the admin creating the invite
 * @param baseUrl - Base URL for generating invite link (e.g., 'http://localhost:3001')
 * @returns Result with invite code and URL, or error message
 *
 * @example
 * ```ts
 * const result = await createInviteCode(adminUserId, 'https://example.com');
 * if (result.success) {
 *   console.log('Share this URL:', result.inviteUrl);
 * }
 * ```
 */
export async function createInviteCode(
  createdBy: string,
  baseUrl: string,
): Promise<CreateInviteResult> {
  try {
    // Create invite code (Prisma will auto-generate UUID for 'code' field)
    const invite = await prisma.invite_codes.create({
      data: {
        created_by: createdBy,
      },
      select: {
        code: true,
      },
    });

    // Generate invite URL
    const inviteUrl = `${baseUrl}/auth/signup?invite=${invite.code}`;

    return {
      success: true,
      inviteCode: invite.code,
      inviteUrl,
    };
  } catch (error) {
    console.error("Error creating invite code:", error);
    return {
      success: false,
      error: "Failed to create invite code",
    };
  }
}

/**
 * Redeem an invite code
 *
 * Marks the invite as used by the given user. Should be called after
 * successful user creation during signup.
 *
 * @param code - The invite code to redeem
 * @param redeemedBy - User ID of the user redeeming the invite
 * @returns Result indicating success or failure
 *
 * @example
 * ```ts
 * const result = await redeemInviteCode(inviteCode, newUserId);
 * if (!result.success) {
 *   console.error('Failed to redeem:', result.error);
 * }
 * ```
 */
export async function redeemInviteCode(
  code: string,
  redeemedBy: string,
): Promise<RedeemInviteResult> {
  try {
    // Mark invite as used
    const invite = await prisma.invite_codes.update({
      where: { code },
      data: {
        used_by: redeemedBy,
        used_at: new Date(),
      },
      select: {
        id: true,
      },
    });

    return {
      success: true,
      inviteId: invite.id,
    };
  } catch (error) {
    console.error("Error redeeming invite code:", error);
    return {
      success: false,
      error: "Failed to redeem invite code",
    };
  }
}

/**
 * Get all invite codes created by a user
 *
 * Useful for displaying invite history to admins.
 *
 * @param userId - User ID of the admin
 * @returns Array of invite codes with usage info
 *
 * @example
 * ```ts
 * const invites = await getInvitesByCreator(adminUserId);
 * console.log(`Created ${invites.length} invites`);
 * ```
 */
export async function getInvitesByCreator(userId: string) {
  return await prisma.invite_codes.findMany({
    where: {
      created_by: userId,
    },
    include: {
      redeemer: {
        select: {
          id: true,
          email: true,
          name: true,
          created_at: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

/**
 * Get all invite codes (admin only)
 *
 * Returns all invites across all creators. Use for admin dashboard.
 *
 * @returns Array of all invite codes with creator and redeemer info
 */
export async function getAllInvites() {
  return await prisma.invite_codes.findMany({
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      redeemer: {
        select: {
          id: true,
          email: true,
          name: true,
          created_at: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

/**
 * Get invite statistics (admin only)
 *
 * Returns aggregate data about invites.
 *
 * @returns Object with total, used, and unused counts
 */
export async function getInviteStats() {
  const [total, used] = await Promise.all([
    prisma.invite_codes.count(),
    prisma.invite_codes.count({
      where: {
        used_by: { not: null },
      },
    }),
  ]);

  return {
    total,
    used,
    unused: total - used,
    usageRate: total > 0 ? (used / total) * 100 : 0,
  };
}
