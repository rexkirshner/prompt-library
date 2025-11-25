-- CreateTable
CREATE TABLE "user_actions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_actions_user_id_created_at_idx" ON "user_actions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_actions_action_created_at_idx" ON "user_actions"("action", "created_at");

-- AddForeignKey
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
