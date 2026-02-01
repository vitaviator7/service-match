import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';

// Conditional OpenAI import
let openai: any = null;
try {
    if (process.env.OPENAI_API_KEY) {
        const OpenAI = require('openai').default || require('openai');
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
} catch {
    console.log('QuoteAudit: OpenAI package not installed, using fallbacks');
}

interface QuoteAuditRequest {
    jobTitle: string;
    jobDescription?: string;
    quotedAmount: number;
    providerName?: string;
    category?: string;
    postcode?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: QuoteAuditRequest = await request.json();
        const {
            jobTitle,
            jobDescription = '',
            quotedAmount,
            providerName = 'Unknown Provider',
            category = '',
            postcode = '',
        } = body;

        if (!jobTitle || !quotedAmount) {
            return NextResponse.json(
                { error: 'Job title and quoted amount are required' },
                { status: 400 }
            );
        }

        // Step 1: Get market average using our estimator
        let marketAvg = quotedAmount; // Default to quoted amount

        try {
            const estimateResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/fairprice/estimate`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jobTitle,
                        jobDescription,
                        category,
                        postcode,
                    }),
                }
            );

            if (estimateResponse.ok) {
                const estimateData = await estimateResponse.json();
                if (estimateData.estimate?.avg) {
                    marketAvg = estimateData.estimate.avg;
                }
            }
        } catch (error) {
            console.log('Could not fetch market estimate, using quoted amount as baseline');
        }

        // Step 2: Calculate variance
        const variance = quotedAmount - marketAvg;
        const variancePercent = (variance / marketAvg) * 100;

        // Step 3: Determine verdict
        let verdict: 'FAIR' | 'SLIGHTLY_HIGH' | 'OVERPRICED' | 'BARGAIN' | 'UNUSUALLY_LOW';

        if (variancePercent <= -25) {
            verdict = 'UNUSUALLY_LOW';
        } else if (variancePercent < -10) {
            verdict = 'BARGAIN';
        } else if (variancePercent <= 10) {
            verdict = 'FAIR';
        } else if (variancePercent <= 25) {
            verdict = 'SLIGHTLY_HIGH';
        } else {
            verdict = 'OVERPRICED';
        }

        // Step 4: Get AI analysis
        const aiAnalysis = await getAIQuoteAnalysis(
            jobTitle,
            jobDescription,
            quotedAmount,
            marketAvg,
            variancePercent,
            verdict
        );

        // Step 5: Save to database (optional)
        try {
            if ((prisma as any).quoteAudit) {
                await (prisma as any).quoteAudit.create({
                    data: {
                        providerName,
                        quotedAmount,
                        quoteDescription: jobDescription,
                        marketAverage: marketAvg,
                        variance,
                        variancePercent,
                        verdict,
                        analysis: aiAnalysis.analysis,
                        redFlags: aiAnalysis.redFlags,
                        recommendations: aiAnalysis.recommendations,
                    },
                });
            }
        } catch (dbError) {
            console.log('Database save skipped:', dbError);
        }

        return NextResponse.json({
            success: true,
            audit: {
                quotedAmount,
                marketAverage: marketAvg,
                variance,
                variancePercent: Math.round(variancePercent * 10) / 10,
                verdict,
                analysis: aiAnalysis.analysis,
                redFlags: aiAnalysis.redFlags,
                recommendations: aiAnalysis.recommendations,
            },
        });
    } catch (error) {
        console.error('Quote Audit API error:', error);
        return NextResponse.json(
            { error: 'Failed to audit quote' },
            { status: 500 }
        );
    }
}

async function getAIQuoteAnalysis(
    jobTitle: string,
    jobDescription: string,
    quotedAmount: number,
    marketAvg: number,
    variancePercent: number,
    verdict: string
) {
    // Fallback analyses based on verdict
    const fallbackAnalyses: Record<string, any> = {
        FAIR: {
            analysis: 'This quote is in line with typical market rates for this type of work. The price appears fair and reasonable.',
            redFlags: [],
            recommendations: [
                'Verify the provider\'s credentials and insurance',
                'Ask for a detailed breakdown of labor and materials',
                'Check recent customer reviews',
            ],
        },
        SLIGHTLY_HIGH: {
            analysis: 'This quote is slightly above average market rates. This could reflect higher quality materials, more experience, or additional services included.',
            redFlags: ['Price is 10-25% above market average'],
            recommendations: [
                'Ask what justifies the premium pricing',
                'Request a detailed breakdown of costs',
                'Consider getting 1-2 additional quotes for comparison',
            ],
        },
        OVERPRICED: {
            analysis: 'This quote is significantly higher than typical market rates. Unless there are special circumstances or premium services included, you may want to seek alternative quotes.',
            redFlags: ['Price is more than 25% above market average'],
            recommendations: [
                'Get at least 2 additional quotes',
                'Ask for a detailed justification of the high quote',
                'Verify what is included in the price',
                'Consider if premium  materials or expertise justify the cost',
            ],
        },
        BARGAIN: {
            analysis: 'This quote is notably below market average, which could indicate competitive pricing or a promotional rate. Ensure all necessary work is included.',
            redFlags: [],
            recommendations: [
                'Confirm exactly what is included in the quote',
                'Verify the provider has appropriate insurance',
                'Check for any hidden costs or exclusions',
                'Read recent customer reviews carefully',
            ],
        },
        UNUSUALLY_LOW: {
            analysis: 'This quote is significantly below market rates. While it could be a great deal, ensure the provider is legitimate, experienced, and properly insured.',
            redFlags: [
                'Price is more than 25% below market average',
                'Unusually low pricing may indicate inexperience or hidden costs',
            ],
            recommendations: [
                'Verify the provider\'s credentials thoroughly',
                'Confirm insurance coverage',
                'Ask why the price is so competitive',
                'Get a detailed breakdown in writing',
                'Consider if quality might be compromised',
            ],
        },
    };

    if (!openai) {
        return fallbackAnalyses[verdict] || fallbackAnalyses.FAIR;
    }

    try {
        const prompt = `You are a UK home services pricing auditor. Analyze this quote and provide feedback.

Job: ${jobTitle}
Description: ${jobDescription || 'Not provided'}
Quoted Amount: £${quotedAmount}
Market Average: £${marketAvg}
Variance: ${variancePercent > 0 ? '+' : ''}${Math.round(variancePercent)}%
Verdict: ${verdict}

Provide a JSON response with:
{
  "analysis": string (2-3 sentences explaining whether this quote is fair, considering the market rate and typical costs for this service),
  "redFlags": string[] (array of potential concerns or warning signs, if any),
  "recommendations": string[] (array of actionable advice for the customer)
}

Be honest but balanced. Consider:
- Quality of work may justify premium pricing
- Very low prices might indicate inexperience or cutting corners
- Fair pricing varies by provider experience and quality
- Hidden costs that might not be included

Your goal is to help customers make informed decisions, not to discourage them from hiring professionals.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'You are a fair and balanced pricing auditor for UK home services. Always respond with valid JSON only.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.4,
            response_format: { type: 'json_object' },
        });

        const response = JSON.parse(completion.choices[0].message.content || '{}');

        return {
            analysis: response.analysis || fallbackAnalyses[verdict].analysis,
            redFlags: response.redFlags || fallbackAnalyses[verdict].redFlags,
            recommendations: response.recommendations || fallbackAnalyses[verdict].recommendations,
        };
    } catch (error) {
        console.error('AI analysis error:', error);
        return fallbackAnalyses[verdict] || fallbackAnalyses.FAIR;
    }
}
