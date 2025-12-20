-- CreateIndex
CREATE INDEX "prompts_is_compound_status_deleted_at_idx" ON "prompts"("is_compound", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "prompts_ai_generated_status_deleted_at_idx" ON "prompts"("ai_generated", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "prompts_copy_count_idx" ON "prompts"("copy_count");
