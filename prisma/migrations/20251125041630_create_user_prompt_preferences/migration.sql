-- CreateTable
CREATE TABLE "user_prompt_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prompt_id" TEXT NOT NULL,
    "copy_prefix" TEXT,
    "copy_suffix" TEXT,
    "copy_add_prefix" BOOLEAN NOT NULL DEFAULT false,
    "copy_add_suffix" BOOLEAN NOT NULL DEFAULT false,
    "copy_use_ultrathink" BOOLEAN NOT NULL DEFAULT false,
    "copy_github_reminder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_prompt_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_prompt_preferences_user_id_idx" ON "user_prompt_preferences"("user_id");

-- CreateIndex
CREATE INDEX "user_prompt_preferences_prompt_id_idx" ON "user_prompt_preferences"("prompt_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_prompt_preferences_user_id_prompt_id_key" ON "user_prompt_preferences"("user_id", "prompt_id");

-- AddForeignKey
ALTER TABLE "user_prompt_preferences" ADD CONSTRAINT "user_prompt_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_prompt_preferences" ADD CONSTRAINT "user_prompt_preferences_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
