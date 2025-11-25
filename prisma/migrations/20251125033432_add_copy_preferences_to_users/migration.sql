-- AlterTable
ALTER TABLE "users" ADD COLUMN     "copy_add_prefix" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "copy_add_suffix" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "copy_prefix" TEXT,
ADD COLUMN     "copy_suffix" TEXT;
