-- CreateEnum
CREATE TYPE "PriceEstimateStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "QuoteVerdict" AS ENUM ('FAIR', 'SLIGHTLY_HIGH', 'OVERPRICED', 'BARGAIN', 'UNUSUALLY_LOW');

-- CreateEnum
CREATE TYPE "PricingDataSource" AS ENUM ('COMPLETED_BOOKING', 'PROVIDER_QUOTE', 'MANUAL_ENTRY', 'INDUSTRY_SURVEY');

-- CreateTable
CREATE TABLE "price_estimates" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "categoryId" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "jobTitle" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "postcode" TEXT,
    "estimatedLow" DECIMAL(10,2) NOT NULL,
    "estimatedAvg" DECIMAL(10,2) NOT NULL,
    "estimatedHigh" DECIMAL(10,2) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB,
    "similarJobsCount" INTEGER NOT NULL DEFAULT 0,
    "regionalFactor" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "seasonalFactor" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "aiModel" TEXT NOT NULL,
    "aiResponse" JSONB,
    "reasoning" TEXT,
    "status" "PriceEstimateStatus" NOT NULL DEFAULT 'COMPLETED',
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT NOW() + INTERVAL '30 days',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_audits" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "estimateId" TEXT,
    "providerName" TEXT,
    "quotedAmount" DECIMAL(10,2) NOT NULL,
    "quoteDescription" TEXT,
    "quoteFileUrl" TEXT,
    "marketAverage" DECIMAL(10,2) NOT NULL,
    "variance" DECIMAL(10,2) NOT NULL,
    "variancePercent" DOUBLE PRECISION NOT NULL,
    "verdict" "QuoteVerdict" NOT NULL,
    "analysis" TEXT NOT NULL,
    "redFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historical_pricing" (
    "id" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "subcategorySlug" TEXT,
    "jobType" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "laborCost" DECIMAL(10,2),
    "materialsCost" DECIMAL(10,2),
    "duration" INTEGER,
    "complexity" TEXT,
    "urgency" TEXT,
    "sourceType" "PricingDataSource" NOT NULL DEFAULT 'COMPLETED_BOOKING',
    "bookingId" TEXT,
    "providerId" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historical_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_prices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sku" TEXT,
    "supplier" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "lastScrapedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_estimates_categoryId_idx" ON "price_estimates"("categoryId");

-- CreateIndex
CREATE INDEX "price_estimates_postcode_idx" ON "price_estimates"("postcode");

-- CreateIndex
CREATE INDEX "price_estimates_createdAt_idx" ON "price_estimates"("createdAt");

-- CreateIndex
CREATE INDEX "quote_audits_userId_idx" ON "quote_audits"("userId");

-- CreateIndex
CREATE INDEX "historical_pricing_categorySlug_postcode_idx" ON "historical_pricing"("categorySlug", "postcode");

-- CreateIndex
CREATE INDEX "historical_pricing_city_idx" ON "historical_pricing"("city");

-- CreateIndex
CREATE INDEX "historical_pricing_completedAt_idx" ON "historical_pricing"("completedAt");

-- CreateIndex
CREATE INDEX "material_prices_category_name_idx" ON "material_prices"("category", "name");

-- CreateIndex
CREATE INDEX "material_prices_isActive_idx" ON "material_prices"("isActive");

-- AddForeignKey
ALTER TABLE "quote_audits" ADD CONSTRAINT "quote_audits_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "price_estimates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
