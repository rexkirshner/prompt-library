-- AlterTable
ALTER TABLE "users" ADD COLUMN     "invited_by" TEXT;

-- CreateTable
CREATE TABLE "invite_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_by" TEXT,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invite_codes_code_key" ON "invite_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "invite_codes_used_by_key" ON "invite_codes"("used_by");

-- CreateIndex
CREATE INDEX "invite_codes_code_idx" ON "invite_codes"("code");

-- CreateIndex
CREATE INDEX "invite_codes_created_by_idx" ON "invite_codes"("created_by");

-- CreateIndex
CREATE INDEX "invite_codes_used_by_idx" ON "invite_codes"("used_by");

-- CreateIndex
CREATE INDEX "users_invited_by_idx" ON "users"("invited_by");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
