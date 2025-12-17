-- AlterTable
ALTER TABLE "user_prompt_preferences" ADD COLUMN     "copy_remove_paste_placeholders" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "copy_remove_paste_placeholders" BOOLEAN NOT NULL DEFAULT false;
