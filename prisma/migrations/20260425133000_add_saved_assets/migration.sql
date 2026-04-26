-- CreateTable
CREATE TABLE "saved_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "projectId" UUID,
    "sourceStepId" VARCHAR(255),
    "label" VARCHAR(255) NOT NULL,
    "objectKey" TEXT NOT NULL,
    "viewerUrl" TEXT,
    "fileSizeBytes" INTEGER,
    "assetStats" JSONB,
    "librarySource" VARCHAR(50) NOT NULL DEFAULT 'saved',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_assets_objectKey_key" ON "saved_assets"("objectKey");

-- CreateIndex
CREATE INDEX "saved_assets_userId_createdAt_idx" ON "saved_assets"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "saved_assets_projectId_createdAt_idx" ON "saved_assets"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "saved_assets_userId_isPinned_idx" ON "saved_assets"("userId", "isPinned");

-- AddForeignKey
ALTER TABLE "saved_assets" ADD CONSTRAINT "saved_assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_assets" ADD CONSTRAINT "saved_assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
