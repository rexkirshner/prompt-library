/**
 * Tests for Invite Code Validation
 */

import { validateInviteCode, isInviteCodeValid } from "../validation";
import { InviteValidationError } from "../types";
import { prisma } from "../../db/client";
import { randomUUID } from "crypto";

describe("validateInviteCode", () => {
  const testUserId = randomUUID();
  let validInviteCode: string;
  let usedInviteCode: string;

  beforeAll(async () => {
    // Create test user
    await prisma.users.create({
      data: {
        id: testUserId,
        email: "invite-test@example.com",
        password: "hashed",
        is_admin: true,
      },
    });

    // Create a valid (unused) invite
    const validInvite = await prisma.invite_codes.create({
      data: {
        created_by: testUserId,
      },
    });
    validInviteCode = validInvite.code;

    // Create a used invite
    const usedInvite = await prisma.invite_codes.create({
      data: {
        created_by: testUserId,
        used_by: testUserId,
        used_at: new Date(),
      },
    });
    usedInviteCode = usedInvite.code;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.invite_codes.deleteMany({
      where: { created_by: testUserId },
    });
    await prisma.users.delete({
      where: { id: testUserId },
    });
  });

  describe("Format Validation", () => {
    it("rejects invalid UUID format", async () => {
      const result = await validateInviteCode("not-a-uuid");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe(InviteValidationError.INVALID_FORMAT);
      }
    });

    it("rejects empty string", async () => {
      const result = await validateInviteCode("");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe(InviteValidationError.INVALID_FORMAT);
      }
    });

    it("rejects malformed UUID", async () => {
      const result = await validateInviteCode("12345678-1234-1234-1234");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe(InviteValidationError.INVALID_FORMAT);
      }
    });
  });

  describe("Existence Validation", () => {
    it("rejects non-existent code", async () => {
      const nonExistentCode = randomUUID();
      const result = await validateInviteCode(nonExistentCode);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe(InviteValidationError.NOT_FOUND);
      }
    });

    it("accepts valid existing code", async () => {
      const result = await validateInviteCode(validInviteCode);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.inviteId).toBeDefined();
        expect(typeof result.inviteId).toBe("string");
      }
    });
  });

  describe("Usage Validation", () => {
    it("rejects already-used code", async () => {
      const result = await validateInviteCode(usedInviteCode);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe(InviteValidationError.ALREADY_USED);
      }
    });
  });

  describe("isInviteCodeValid helper", () => {
    it("returns true for valid code", async () => {
      const isValid = await isInviteCodeValid(validInviteCode);
      expect(isValid).toBe(true);
    });

    it("returns false for invalid code", async () => {
      const isValid = await isInviteCodeValid("not-a-uuid");
      expect(isValid).toBe(false);
    });

    it("returns false for used code", async () => {
      const isValid = await isInviteCodeValid(usedInviteCode);
      expect(isValid).toBe(false);
    });

    it("returns false for non-existent code", async () => {
      const isValid = await isInviteCodeValid(randomUUID());
      expect(isValid).toBe(false);
    });
  });
});
