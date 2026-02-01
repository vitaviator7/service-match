import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';

// Conditional OpenAI import - works with or without the package installed
let openai: any = null;
try {
    if (process.env.OPENAI_API_KEY) {
        const OpenAI = require('openai').default || require('openai');
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
} catch {
    console.log('FairPrice: OpenAI package not installed, using intelligent fallbacks');
}

// Fallback pricing data based on common UK service categories
const FALLBACK_PRICING = {
    plumbing: { low: 80, avg: 150, high: 280 },
    electrical: { low: 90, avg: 165, high: 320 },
    cleaning: { low: 50, avg: 85, high: 150 },
    handyman: { low: 60, avg: 110, high: 200 },
    gardening: { low: 70, avg: 120, high: 220 },
    'heating-boilers': { low: 120, avg: 220, high: 450 },
    'painting-decorating': { low: 100, avg: 180, high: 350 },
    locksmith: { low: 80, avg: 145, high: 280 },
    default: { low: 80, avg: 150, high: 280 },
};

interface PriceEstimateRequest {
    jobTitle: string;
    jobDescription?: string;
    category?: string;
    postcode?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: PriceEstimateRequest = await request.json();
        const { jobTitle, jobDescription = '', category = '', postcode = '' } = body;

        if (!jobTitle) {
            return NextResponse.json(
                { error: 'Job title is required' },
                { status: 400 }
            );
        }

        // Step 1: Get historical pricing data from our database (optional - will work without schema migration)
        const historicalData = await getHistoricalPricing(category, postcode);

        // Step 2: Get AI-powered estimate
        const aiEstimate = await getAIPriceEstimate(
            jobTitle,
            jobDescription,
            category,
            postcode,
            historicalData
        );

        // Step 3: Calculate regional and seasonal factors
        const regionalFactor = await calculateRegionalFactor(postcode);
        const seasonalFactor = calculateSeasonalFactor();

        // Step 4: Apply adjustments
        const adjustedEstimate = {
            low: Math.round(aiEstimate.low * regionalFactor * seasonalFactor),
            avg: Math.round(aiEstimate.avg * regionalFactor * seasonalFactor),
            high: Math.round(aiEstimate.high * regionalFactor * seasonalFactor),
        };

        // Step 5: Save the estimate to database (optional - will skip if tables don't exist yet)
        try {
            if ((prisma as any).priceEstimate) {
                await (prisma as any).priceEstimate.create({
                    data: {
                        jobTitle,
                        jobDescription,
                        category: category || aiEstimate.detectedCategory,
                        subcategory: aiEstimate.subcategory,
                        postcode,
                        estimatedLow: adjustedEstimate.low,
                        estimatedAvg: adjustedEstimate.avg,
                        estimatedHigh: adjustedEstimate.high,
                        confidence: aiEstimate.confidence,
                        breakdown: aiEstimate.breakdown,
                        similarJobsCount: historicalData.length,
                        regionalFactor,
                        seasonalFactor,
                        aiModel: aiEstimate.model,
                        aiResponse: aiEstimate.rawResponse,
                        reasoning: aiEstimate.reasoning,
                        status: 'COMPLETED',
                    },
                });
            }
        } catch (dbError) {
            console.log('Database save skipped (tables may not exist yet):', dbError);
        }

        return NextResponse.json({
            success: true,
            estimate: {
                low: adjustedEstimate.low,
                avg: adjustedEstimate.avg,
                high: adjustedEstimate.high,
                confidence: aiEstimate.confidence,
                reasoning: aiEstimate.reasoning,
                dataPoints: historicalData.length,
                breakdown: aiEstimate.breakdown,
            },
        });
    } catch (error) {
        console.error('FairPrice API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate price estimate' },
            { status: 500 }
        );
    }
}

async function getHistoricalPricing(category: string, postcode: string) {
    try {
        // Only try if the model exists
        if (!(prisma as any).historicalPricing) {
            return [];
        }

        const historicalPrices = await (prisma as any).historicalPricing.findMany({
            where: {
                categorySlug: category,
                ...(postcode ? { postcode: { startsWith: postcode.substring(0, 4) } } : {}),
            },
            orderBy: {
                completedAt: 'desc',
            },
            take: 100,
        });

        return historicalPrices;
    } catch (error) {
        console.log('Historical pricing not available');
        return [];
    }
}

async function getAIPriceEstimate(
    jobTitle: string,
    jobDescription: string,
    category: string,
    postcode: string,
    historicalData: any[]
) {
    // Calculate average from historical data if available
    const historicalAvg = historicalData.length > 0
        ? historicalData.reduce((sum, item) => sum + parseFloat(item.finalAmount.toString()), 0) / historicalData.length
        : null;

    // If OpenAI is not available, use intelligent fallbacks
    if (!openai) {
        const categoryKey = category.toLowerCase();
        const fallback = FALLBACK_PRICING[categoryKey as keyof typeof FALLBACK_PRICING] || FALLBACK_PRICING.default;

        return {
            low: fallback.low,
            avg: historicalAvg || fallback.avg,
            high: fallback.high,
            confidence: historicalAvg ? 70 : 55,
            detectedCategory: category || 'general',
            subcategory: null,
            breakdown: {
                labor: Math.round((historicalAvg || fallback.avg) * 0.6),
                materials: Math.round((historicalAvg || fallback.avg) * 0.3),
                callout: Math.round((historicalAvg || fallback.avg) * 0.1),
                complexity: 1.0,
            },
            reasoning: historicalAvg
                ? `Estimate based on ${historicalData.length} similar completed jobs in your area.`
                : 'Estimate based on typical UK market rates for this service category.',
            model: 'fallback',
            rawResponse: {},
        };
    }

    try {
        const prompt = `You are a UK home services pricing expert. Analyze this job request and provide a realistic price estimate in GBP.

Job Title: ${jobTitle}
Description: ${jobDescription || 'No additional details provided'}
Category: ${category || 'Not specified'}
Location: ${postcode ? `UK Postcode area ${postcode.substring(0, 4)}` : 'UK (location not specified)'}
Historical Average: ${historicalAvg ? `£${Math.round(historicalAvg)}` : 'No historical data'}

Provide a JSON response with:
{
  "estimatedLow": number (minimum reasonable price),
  "estimatedAvg": number (typical market rate),
  "estimatedHigh": number (premium service price),
  "confidence": number (0-100, how confident you are),
  "detectedCategory": string (plumbing, electrical, etc.),
  "subcategory": string (optional, more specific category),
  "breakdown": {
    "labor": number,
    "materials": number,
    "callout": number,
    "complexity": number (1.0 = standard, 1.5 = complex)
  },
  "reasoning": string (2-3 sentence explanation of the pricing)
}

Base your estimate on:
1. UK market rates for similar services
2. Typical labor costs (£30-80/hour depending on trade)
3. Standard materials costs
4. Job complexity and duration
5. Historical data when available

Be realistic and fair. Consider that customers will compare this to actual quotes.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'You are a pricing expert for UK home services. Always respond with valid JSON only, no markdown or additional text.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
        });

        const response = JSON.parse(completion.choices[0].message.content || '{}');

        return {
            low: response.estimatedLow || 80,
            avg: response.estimatedAvg || 150,
            high: response.estimatedHigh || 280,
            confidence: response.confidence || 75,
            detectedCategory: response.detectedCategory || category || 'general',
            subcategory: response.subcategory,
            breakdown: response.breakdown || {},
            reasoning: response.reasoning || 'Estimated based on typical UK market rates.',
            model: 'gpt-4-turbo-preview',
            rawResponse: response,
        };
    } catch (error) {
        console.error('OpenAI API error:', error);

        // Fallback to category-based pricing
        const categoryKey = category.toLowerCase();
        const fallback = FALLBACK_PRICING[categoryKey as keyof typeof FALLBACK_PRICING] || FALLBACK_PRICING.default;

        return {
            low: fallback.low,
            avg: historicalAvg || fallback.avg,
            high: fallback.high,
            confidence: historicalAvg ? 65 : 50,
            detectedCategory: category || 'general',
            subcategory: null,
            breakdown: {
                labor: Math.round((historicalAvg || fallback.avg) * 0.6),
                materials: Math.round((historicalAvg || fallback.avg) * 0.3),
                callout: Math.round((historicalAvg || fallback.avg) * 0.1),
                complexity: 1.0,
            },
            reasoning: historicalAvg
                ? `Estimate based on ${historicalData.length} similar completed jobs.`
                : 'Estimate based on typical market rates for this service category.',
            model: 'fallback',
            rawResponse: {},
        };
    }
}

async function calculateRegionalFactor(postcode: string): Promise<number> {
    if (!postcode) return 1.0;

    const postcodeArea = postcode.toUpperCase().substring(0, 2);

    const regionalFactors: Record<string, number> = {
        // London - Higher costs
        'EC': 1.35, 'WC': 1.35, 'E': 1.25, 'W': 1.30, 'N': 1.20, 'NW': 1.25, 'SE': 1.20, 'SW': 1.25,

        // Southeast - Above average
        'BR': 1.15, 'CR': 1.15, 'DA': 1.10, 'GU': 1.15, 'KT': 1.15, 'RH': 1.10, 'SM': 1.15,

        // Other major cities - Slightly above average
        'M': 1.10,   // Manchester
        'B': 1.05,   // Birmingham
        'LS': 1.05,  // Leeds
        'G': 1.05,   // Glasgow
        'EH': 1.10,  // Edinburgh

        //Rest of UK - Standard
        'DEFAULT': 1.0,
    };

    return regionalFactors[postcodeArea] || regionalFactors['DEFAULT'];
}

function calculateSeasonalFactor(): number {
    const month = new Date().getMonth(); // 0-11

    // Higher demand/prices in spring/summer for outdoor work
    // Higher demand in winter for heating/emergency work
    const seasonalFactors = [
        1.05, // January - Winter emergencies
        1.05, // February
        1.10, // March - Spring starts
        1.15, // April - Peak spring
        1.15, // May - Peak spring
        1.10, // June - Summer
        1.05, // July
        1.05, // August
        1.10, // September - Autumn prep
        1.10, // October
        1.05, // November
        1.10, // December - Winter emergencies
    ];

    return seasonalFactors[month];
}
