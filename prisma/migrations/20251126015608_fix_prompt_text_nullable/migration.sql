-- DropForeignKey
ALTER TABLE "compound_prompt_components" DROP CONSTRAINT "compound_prompt_components_component_prompt_id_fkey";

-- DropForeignKey
ALTER TABLE "compound_prompt_components" DROP CONSTRAINT "compound_prompt_components_compound_prompt_id_fkey";

-- AlterTable
ALTER TABLE "compound_prompt_components" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "prompts" ALTER COLUMN "prompt_text" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "prompts_is_compound_idx" ON "prompts"("is_compound");

-- AddForeignKey
ALTER TABLE "compound_prompt_components" ADD CONSTRAINT "compound_prompt_components_compound_prompt_id_fkey" FOREIGN KEY ("compound_prompt_id") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compound_prompt_components" ADD CONSTRAINT "compound_prompt_components_component_prompt_id_fkey" FOREIGN KEY ("component_prompt_id") REFERENCES "prompts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_compound_components_base" RENAME TO "compound_prompt_components_component_prompt_id_idx";

-- RenameIndex
ALTER INDEX "idx_compound_components_order" RENAME TO "compound_prompt_components_compound_prompt_id_position_idx";
