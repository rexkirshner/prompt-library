-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "prompts_category_idx" ON "prompts"("category");

-- CreateIndex
CREATE INDEX "prompts_deleted_at_idx" ON "prompts"("deleted_at");

-- CreateIndex
CREATE INDEX "prompts_status_deleted_at_idx" ON "prompts"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "tags_usage_count_idx" ON "tags"("usage_count");
