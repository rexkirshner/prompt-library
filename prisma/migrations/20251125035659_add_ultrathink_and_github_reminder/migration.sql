-- AlterTable
ALTER TABLE "users" ADD COLUMN     "copy_github_reminder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "copy_use_ultrathink" BOOLEAN NOT NULL DEFAULT false;
