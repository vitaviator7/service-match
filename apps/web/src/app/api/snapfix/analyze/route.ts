import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { put } from '@vercel/blob';

// Conditional OpenAI import with Vision support
let openai: any = null;
try {
    if (process.env.OPENAI_API_KEY) {
        const OpenAI = require('openai').default || require('openai');
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
} catch {
    console.log('SnapFix: OpenAI package not installed, using fallbacks');
}

// Fallback diagnoses for common visual patterns
const FALLBACK_DIAGNOSES = {
    water_leak: {
        issue: "Potential Water Leak",
        category: "plumbing",
        urgency: "URGENT",
        diagnosis: "Visual indicators suggest a water leak. This requires immediate attention to prevent water damage.",
        recommendations: [
            "Turn off the water supply if leak is active",
            "Place towels/bucket to contain water",
            "Contact a plumber immediately",
            "Document damage for insurance"
        ],
        confidence: 70
    },
    boiler_issue: {
        issue: "Boiler/Heating Problem",
        category: "heating-boilers",
        urgency: "URGENT",
        diagnosis: "The image shows a heating system component that may require professional inspection.",
        recommendations: [
            "Check boiler pressure gauge",
            "Note any error codes displayed",
            "Contact a Gas Safe registered engineer",
            "Do not attempt DIY repairs on gas appliances"
        ],
        confidence: 65
    },
    electrical: {
        issue: "Electrical Issue",
        category: "electrical",
        urgency: "URGENT",
        diagnosis: "Electrical components detected. Professional inspection recommended for safety.",
        recommendations: [
            "Do not touch exposed wires",
            "Turn off power at circuit breaker if safe",
            "Contact a certified electrician",
            "Keep area dry and clear"
        ],
        confidence: 60
    },
    general: {
        issue: "General Maintenance Required",
        category: "handyman",
        urgency: "STANDARD",
        diagnosis: "The image shows an issue that requires professional attention.",
        recommendations: [
            "Take additional photos if possible",
            "Note when the problem started",
            "Contact a professional for assessment",
            "Describe any unusual sounds or smells"
        ],
        confidence: 50
    }
};

interface SnapFixRequest {
    image?: string; // Base64 encoded image
    imageUrl?: string; // Or URL to image
    additionalNotes?: string;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const imageUrl = formData.get('imageUrl') as string | null;
        const additionalNotes = formData.get('additionalNotes') as string | '';

        if (!file && !imageUrl) {
            return NextResponse.json(
                { error: 'Please provide an image file or URL' },
                { status: 400 }
            );
        }

        let uploadedUrl = imageUrl;
        let mediaType: 'IMAGE' | 'VIDEO' = 'IMAGE';

        // Upload file to Vercel Blob if file provided
        if (file) {
            try {
                // Check file type
                const isVideo = file.type.startsWith('video/');
                mediaType = isVideo ? 'VIDEO' : 'IMAGE';

                // Upload to Vercel Blob
                const blob = await put(file.name, file, {
                    access: 'public',
                    addRandomSuffix: true,
                });

                uploadedUrl = blob.url;
            } catch (uploadError) {
                console.error('File upload error:', uploadError);
                return NextResponse.json(
                    { error: 'Failed to upload media file' },
                    { status: 500 }
                );
            }
        }

        if (!uploadedUrl) {
            return NextResponse.json(
                { error: 'No valid media URL available' },
                { status: 400 }
            );
        }

        // Perform AI analysis
        const diagnosis = await analyzeWithAI(uploadedUrl, additionalNotes, mediaType);

        // Get cost estimate from FairPrice
        let costEstimate = null;
        try {
            const priceResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/fairprice/estimate`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jobTitle: diagnosis.issue,
                        category: diagnosis.category,
                    }),
                }
            );

            if (priceResponse.ok) {
                const priceData = await priceResponse.json();
                if (priceData.estimate) {
                    costEstimate = {
                        low: priceData.estimate.low,
                        avg: priceData.estimate.avg,
                        high: priceData.estimate.high,
                    };
                }
            }
        } catch (priceError) {
            console.log('Could not get price estimate:', priceError);
        }

        // Save to database
        let savedDiagnosis = null;
        try {
            if ((prisma as any).snapFixDiagnosis) {
                savedDiagnosis = await (prisma as any).snapFixDiagnosis.create({
                    data: {
                        mediaUrl: uploadedUrl,
                        mediaType,
                        identifiedIssue: diagnosis.issue,
                        confidence: diagnosis.confidence,
                        suggestedCategory: diagnosis.category,
                        urgency: diagnosis.urgency,
                        aiModel: diagnosis.model,
                        aiResponse: diagnosis.rawResponse,
                        diagnosis: diagnosis.detailedDiagnosis,
                        recommendations: diagnosis.recommendations,
                        estimatedCost: costEstimate,
                        detectedBrand: diagnosis.detectedBrand,
                        detectedModel: diagnosis.detectedModel,
                        detectedAge: diagnosis.detectedAge,
                        location: diagnosis.location,
                        additionalNotes,
                        status: 'COMPLETED',
                    },
                });
            }
        } catch (dbError) {
            console.log('Database save skipped:', dbError);
        }

        return NextResponse.json({
            success: true,
            diagnosis: {
                id: savedDiagnosis?.id,
                mediaUrl: uploadedUrl,
                issue: diagnosis.issue,
                confidence: diagnosis.confidence,
                category: diagnosis.category,
                urgency: diagnosis.urgency,
                diagnosis: diagnosis.detailedDiagnosis,
                recommendations: diagnosis.recommendations,
                estimatedCost: costEstimate,
                detectedBrand: diagnosis.detectedBrand,
                detectedModel: diagnosis.detectedModel,
                detectedAge: diagnosis.detectedAge,
                location: diagnosis.location,
            },
        });
    } catch (error) {
        console.error('SnapFix API error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze image' },
            { status: 500 }
        );
    }
}

async function analyzeWithAI(
    imageUrl: string,
    additionalNotes: string,
    mediaType: 'IMAGE' | 'VIDEO'
) {
    // If OpenAI is not available or media is video, use fallback
    if (!openai || mediaType === 'VIDEO') {
        console.log('Using fallback diagnosis (OpenAI not available or video file)');
        return {
            issue: FALLBACK_DIAGNOSES.general.issue,
            category: FALLBACK_DIAGNOSES.general.category,
            urgency: FALLBACK_DIAGNOSES.general.urgency,
            detailedDiagnosis: FALLBACK_DIAGNOSES.general.diagnosis,
            recommendations: FALLBACK_DIAGNOSES.general.recommendations,
            confidence: FALLBACK_DIAGNOSES.general.confidence,
            model: 'fallback',
            rawResponse: {},
            detectedBrand: null,
            detectedModel: null,
            detectedAge: null,
            location: null,
        };
    }

    try {
        const prompt = `You are an expert home maintenance and repair diagnostic AI. Analyze this image and provide a detailed diagnosis.

Additional context from user: ${additionalNotes || 'None provided'}

Provide a JSON response with:
{
  "identifiedIssue": string (concise issue name, e.g., "Leaking Pipe", "Faulty Boiler"),
  "confidence": number (0-100, how confident you are in this diagnosis),
  "suggestedCategory": string (plumbing, electrical, heating-boilers, cleaning, handyman, painting-decorating, gardening, locksmith),
  "urgency": string (LOW, STANDARD, URGENT, EMERGENCY),
  "detailedDiagnosis": string (2-3 sentences explaining what you see and the likely problem),
  "recommendations": string[] (array of 3-5 actionable recommendations for the homeowner),
  "detectedBrand": string or null (if you can identify a brand name),
  "detectedModel": string or null (if you can identify a model number),
  "detectedAge": string or null (estimate like "5-10 years old" if possible),
  "location": string or null (room/area like "bathroom", "kitchen", "boiler cupboard")
}

Important guidelines:
1. Be specific but cautious - don't diagnose if image is unclear
2. URGENT means needs attention within 24 hours
3. EMERGENCY means immediate safety risk
4. Always recommend professional help for gas, electrical, or structural issues
5. If you can't identify the issue clearly, say so and suggest getting professional inspection

Be helpful and safety-conscious.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4-vision-preview',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: prompt,
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageUrl,
                                detail: 'high',
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1000,
            temperature: 0.3,
        });

        const responseText = completion.choices[0].message.content || '{}';

        // Extract JSON from markdown code blocks if present
        let jsonText = responseText;
        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
            jsonText = jsonMatch[1];
        }

        const response = JSON.parse(jsonText);

        return {
            issue: response.identifiedIssue || 'Unknown Issue',
            category: response.suggestedCategory || 'handyman',
            urgency: response.urgency || 'STANDARD',
            detailedDiagnosis: response.detailedDiagnosis || 'Unable to determine from image',
            recommendations: response.recommendations || ['Contact a professional for assessment'],
            confidence: response.confidence || 50,
            detectedBrand: response.detectedBrand,
            detectedModel: response.detectedModel,
            detectedAge: response.detectedAge,
            location: response.location,
            model: 'gpt-4-vision-preview',
            rawResponse: response,
        };
    } catch (error) {
        console.error('AI analysis error:', error);

        // Fallback based on keywords in notes
        const notesLower = additionalNotes.toLowerCase();
        if (notesLower.includes('leak') || notesLower.includes('water')) {
            return { ...FALLBACK_DIAGNOSES.water_leak, model: 'fallback', rawResponse: {} };
        } else if (notesLower.includes('boiler') || notesLower.includes('heating')) {
            return { ...FALLBACK_DIAGNOSES.boiler_issue, model: 'fallback', rawResponse: {} };
        } else if (notesLower.includes('electric') || notesLower.includes('socket') || notesLower.includes('wire')) {
            return { ...FALLBACK_DIAGNOSES.electrical, model: 'fallback', rawResponse: {} };
        } else {
            return {
                issue: FALLBACK_DIAGNOSES.general.issue,
                category: FALLBACK_DIAGNOSES.general.category,
                urgency: FALLBACK_DIAGNOSES.general.urgency,
                detailedDiagnosis: FALLBACK_DIAGNOSES.general.diagnosis,
                recommendations: FALLBACK_DIAGNOSES.general.recommendations,
                confidence: FALLBACK_DIAGNOSES.general.confidence,
                model: 'fallback',
                rawResponse: {},
                detectedBrand: null,
                detectedModel: null,
                detectedAge: null,
                location: null,
            };
        }
    }
}

// GET endpoint to retrieve diagnosis by ID
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json(
            { error: 'Diagnosis ID required' },
            { status: 400 }
        );
    }

    try {
        if (!(prisma as any).snapFixDiagnosis) {
            return NextResponse.json(
                { error: 'SnapFix feature not available' },
                { status: 503 }
            );
        }

        const diagnosis = await (prisma as any).snapFixDiagnosis.findUnique({
            where: { id },
        });

        if (!diagnosis) {
            return NextResponse.json(
                { error: 'Diagnosis not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, diagnosis });
    } catch (error) {
        console.error('SnapFix GET error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve diagnosis' },
            { status: 500 }
        );
    }
}
