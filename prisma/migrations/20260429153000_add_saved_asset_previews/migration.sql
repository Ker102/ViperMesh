-- AlterTable
ALTER TABLE "saved_assets" ADD COLUMN "previewObjectKey" TEXT;
ALTER TABLE "saved_assets" ADD COLUMN "previewUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "saved_assets_previewObjectKey_key" ON "saved_assets"("previewObjectKey");
