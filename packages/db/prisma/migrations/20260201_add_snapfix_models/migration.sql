-- CreateEnum (only if not exists)
DO $$ BEGIN
    CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'STANDARD', 'URGENT', 'EMERGENCY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DiagnosisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "snapfix_diagnoses" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "thumbnailUrl" TEXT,
    "identifiedIssue" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "suggestedCategory" TEXT NOT NULL,
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'STANDARD',
    "aiModel" TEXT NOT NULL,
    "aiResponse" JSONB,
    "diagnosis" TEXT NOT NULL,
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estimatedCost" JSONB,
    "detectedBrand" TEXT,
    "detectedModel" TEXT,
    "detectedAge" TEXT,
    "location" TEXT,
    "additionalNotes" TEXT,
    "status" "DiagnosisStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "snapfix_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "snapfix_diagnoses_userId_idx" ON "snapfix_diagnoses"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "snapfix_diagnoses_createdAt_idx" ON "snapfix_diagnoses"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "snapfix_diagnoses_suggestedCategory_idx" ON "snapfix_diagnoses"("suggestedCategory");
