// =============================================================================
// Server Actions - Core Business Logic
// =============================================================================

'use server';

import { prisma } from '@service-match/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { hash, compare } from 'bcryptjs';
import { getSession, requireAuth, requireProvider, requireAdmin } from '@/lib/auth';
import { stripe, createBookingCheckoutSession, createConnectAccount } from '@/lib/stripe';

// =============================================================================
// Auth Actions
// =============================================================================

const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.enum(['CUSTOMER', 'PROVIDER']).default('CUSTOMER'),
});

export async function signUp(formData: FormData) {
    const result = signUpSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        role: formData.get('role'),
    });

    if (!result.success) {
        return { error: 'Invalid input', details: result.error.flatten() };
    }

    const { email, password, firstName, lastName, role } = result.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });

    if (existingUser) {
        return { error: 'An account with this email already exists' };
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
        data: {
            email: email.toLowerCase(),
            passwordHash,
            firstName,
            lastName,
            role,
        },
    });

    // Create profile based on role
    if (role === 'CUSTOMER') {
        await prisma.customerProfile.create({
            data: { userId: user.id },
        });
    } else if (role === 'PROVIDER') {
        await prisma.providerProfile.create({
            data: {
                userId: user.id,
                businessName: `${firstName} ${lastName}`,
                slug: `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now().toString(36)}`,
            },
        });
    }

    // Create notification preferences
    await prisma.notificationPreference.create({
        data: { userId: user.id },
    });

    return { success: true, userId: user.id };
}

// =============================================================================
// Quote Request Actions
// =============================================================================

const quoteRequestSchema = z.object({
    categoryId: z.string(),
    title: z.string().min(5).max(200),
    description: z.string().min(20).max(2000),
    postcode: z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i),
    urgency: z.enum(['EMERGENCY', 'URGENT', 'THIS_WEEK', 'THIS_MONTH', 'FLEXIBLE']),
    budgetMin: z.number().optional(),
    budgetMax: z.number().optional(),
    preferredDate: z.string().optional(),
    preferredTime: z.string().optional(),
    requirements: z.record(z.any()).optional(),
    photos: z.array(z.string()).optional(),
    propertyId: z.string().optional(),
});

export async function createQuoteRequest(data: z.infer<typeof quoteRequestSchema>) {
    const session = await requireAuth();

    const customerProfile = await prisma.customerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!customerProfile) {
        return { error: 'Customer profile not found' };
    }

    const result = quoteRequestSchema.safeParse(data);
    if (!result.success) {
        return { error: 'Invalid input', details: result.error.flatten() };
    }

    const validatedData = result.data;

    // Geocode postcode (simplified - in production use Google Maps API)
    const geocodeResult = await geocodePostcode(validatedData.postcode);

    // Calculate expiry (default 72 hours, configurable)
    const config = await prisma.platformConfig.findUnique({
        where: { key: 'quote_expiry_hours' },
    });
    const expiryHours = config ? parseInt(config.value) : 72;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    // Create quote request
    const quoteRequest = await prisma.quoteRequest.create({
        data: {
            customerId: customerProfile.id,
            categoryId: validatedData.categoryId,
            title: validatedData.title,
            description: validatedData.description,
            postcode: validatedData.postcode.toUpperCase(),
            city: geocodeResult?.city || null,
            latitude: geocodeResult?.latitude || null,
            longitude: geocodeResult?.longitude || null,
            urgency: validatedData.urgency,
            budgetMin: validatedData.budgetMin,
            budgetMax: validatedData.budgetMax,
            preferredDate: validatedData.preferredDate ? new Date(validatedData.preferredDate) : null,
            preferredTime: validatedData.preferredTime,
            requirements: validatedData.requirements,
            photos: validatedData.photos || [],
            propertyId: validatedData.propertyId,
            expiresAt,
        },
    });

    // Find and invite matching providers
    await matchAndInviteProviders(quoteRequest.id);

    revalidatePath('/dashboard');
    return { success: true, quoteRequestId: quoteRequest.id };
}

async function matchAndInviteProviders(quoteRequestId: string) {
    const quoteRequest = await prisma.quoteRequest.findUnique({
        where: { id: quoteRequestId },
        include: { category: true },
    });

    if (!quoteRequest) return;

    // Find matching providers
    const providers = await prisma.providerProfile.findMany({
        where: {
            status: 'ACTIVE',
            onboardingComplete: true,
            services: {
                some: { categoryId: quoteRequest.categoryId, isActive: true },
            },
        },
        include: {
            locations: true,
            user: true,
        },
        orderBy: [
            { avgRating: 'desc' },
            { responseRate: 'desc' },
        ],
        take: 10, // Invite top 10, but limit to maxQuotes
    });

    // Filter by distance if geo data available
    let matchingProviders = providers;
    if (quoteRequest.latitude && quoteRequest.longitude) {
        matchingProviders = providers.filter((provider) => {
            const location = provider.locations.find((l) => l.isDefault) || provider.locations[0];
            if (!location) return false;

            const distance = calculateDistance(
                quoteRequest.latitude!,
                quoteRequest.longitude!,
                location.latitude,
                location.longitude
            );
            return distance <= location.radius;
        });
    }

    // Create invitations (limit to maxQuotes * 2 to allow for non-responses)
    const inviteCount = Math.min(matchingProviders.length, quoteRequest.maxQuotes * 2);
    for (let i = 0; i < inviteCount; i++) {
        await prisma.quoteInvitation.create({
            data: {
                quoteRequestId,
                providerId: matchingProviders[i].id,
            },
        });

        // TODO: Queue notification to provider
        // await emailQueue.add('new_quote_request', { ... });
    }

    // Update invite count
    await prisma.quoteRequest.update({
        where: { id: quoteRequestId },
        data: { invitedCount: inviteCount },
    });
}

// =============================================================================
// Quote Actions (Provider)
// =============================================================================

const submitQuoteSchema = z.object({
    quoteRequestId: z.string(),
    serviceId: z.string().optional(),
    amount: z.number().positive(),
    breakdown: z.record(z.number()).optional(),
    message: z.string().min(20).max(1000),
    estimatedDuration: z.number().optional(),
    availableDate: z.string().optional(),
    availableTime: z.string().optional(),
});

export async function submitQuote(data: z.infer<typeof submitQuoteSchema>) {
    const session = await requireProvider();

    const providerProfile = await prisma.providerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!providerProfile) {
        return { error: 'Provider profile not found' };
    }

    const result = submitQuoteSchema.safeParse(data);
    if (!result.success) {
        return { error: 'Invalid input', details: result.error.flatten() };
    }

    const validatedData = result.data;

    // Check if already quoted
    const existingQuote = await prisma.quote.findFirst({
        where: {
            quoteRequestId: validatedData.quoteRequestId,
            providerId: providerProfile.id,
        },
    });

    if (existingQuote) {
        return { error: 'You have already submitted a quote for this request' };
    }

    // Check quote request is still open
    const quoteRequest = await prisma.quoteRequest.findUnique({
        where: { id: validatedData.quoteRequestId },
        include: { _count: { select: { quotes: true } } },
    });

    if (!quoteRequest || quoteRequest.status !== 'OPEN') {
        return { error: 'This quote request is no longer accepting quotes' };
    }

    if (quoteRequest._count.quotes >= quoteRequest.maxQuotes) {
        return { error: 'Maximum number of quotes reached for this request' };
    }

    // Calculate lead fee for Starter tier
    let leadCharged = false;
    let leadAmount: number | undefined;

    if (providerProfile.subscriptionTier === 'STARTER') {
        const starterFreeLeads = await prisma.platformConfig.findUnique({
            where: { key: 'starter_free_leads' },
        });
        const freeLeadLimit = starterFreeLeads ? parseInt(starterFreeLeads.value) : 5;

        if (providerProfile.leadQuotaUsed >= freeLeadLimit) {
            const leadFeeConfig = await prisma.platformConfig.findUnique({
                where: { key: 'lead_fee_starter' },
            });
            leadAmount = leadFeeConfig ? parseFloat(leadFeeConfig.value) : 3;

            // Check wallet balance or charge
            if (providerProfile.leadWalletBalance.toNumber() >= leadAmount) {
                // Deduct from wallet
                await prisma.providerProfile.update({
                    where: { id: providerProfile.id },
                    data: {
                        leadWalletBalance: { decrement: leadAmount },
                    },
                });

                await prisma.leadTransaction.create({
                    data: {
                        providerId: providerProfile.id,
                        type: 'LEAD_DEBIT',
                        amount: -leadAmount,
                        description: `Quote for "${quoteRequest.title}"`,
                        quoteRequestId: quoteRequest.id,
                        balanceAfter: providerProfile.leadWalletBalance.toNumber() - leadAmount,
                    },
                });

                leadCharged = true;
            } else {
                // TODO: Charge via Stripe invoice
                return { error: 'Insufficient lead wallet balance. Please top up or upgrade to Pro.' };
            }
        }
    }

    // Calculate quote valid until
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create quote
    const quote = await prisma.quote.create({
        data: {
            quoteRequestId: validatedData.quoteRequestId,
            providerId: providerProfile.id,
            serviceId: validatedData.serviceId,
            amount: validatedData.amount,
            breakdown: validatedData.breakdown,
            message: validatedData.message,
            estimatedDuration: validatedData.estimatedDuration,
            validUntil,
            availableDate: validatedData.availableDate ? new Date(validatedData.availableDate) : null,
            availableTime: validatedData.availableTime,
            leadCharged,
            leadAmount,
        },
    });

    // Update quote request status if first quote
    if (quoteRequest._count.quotes === 0) {
        await prisma.quoteRequest.update({
            where: { id: validatedData.quoteRequestId },
            data: { status: 'QUOTES_RECEIVED' },
        });
    }

    // Update lead quota
    await prisma.providerProfile.update({
        where: { id: providerProfile.id },
        data: { leadQuotaUsed: { increment: 1 } },
    });

    // TODO: Notify customer of new quote

    revalidatePath('/provider/leads');
    return { success: true, quoteId: quote.id };
}

// =============================================================================
// Booking Actions
// =============================================================================

export async function acceptQuote(quoteId: string) {
    const session = await requireAuth();

    const customerProfile = await prisma.customerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!customerProfile) {
        return { error: 'Customer profile not found' };
    }

    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: {
            quoteRequest: true,
            provider: { include: { user: true } },
            service: true,
        },
    });

    if (!quote) {
        return { error: 'Quote not found' };
    }

    if (quote.quoteRequest.customerId !== customerProfile.id) {
        return { error: 'Unauthorized' };
    }

    if (quote.status !== 'SENT' && quote.status !== 'VIEWED') {
        return { error: 'This quote is no longer available' };
    }

    // Get platform fee rate based on provider tier
    const feeConfigs = await prisma.platformConfig.findMany({
        where: {
            key: {
                in: ['platform_fee_starter', 'platform_fee_pro', 'platform_fee_premium'],
            },
        },
    });

    const feeConfig = feeConfigs.find(
        (f) => f.key === `platform_fee_${quote.provider.subscriptionTier.toLowerCase()}`
    );
    const platformFeeRate = feeConfig ? parseFloat(feeConfig.value) : 0.18;

    // Calculate fees
    const subtotal = quote.amount.toNumber();
    const platformFee = subtotal * platformFeeRate;
    const total = subtotal; // Platform fee is taken from provider earnings, not charged to customer
    const providerEarnings = subtotal - platformFee;

    // Create booking
    const booking = await prisma.booking.create({
        data: {
            customerId: customerProfile.id,
            providerId: quote.providerId,
            serviceId: quote.serviceId,
            quoteId: quote.id,
            propertyId: quote.quoteRequest.propertyId,
            bookingType: 'QUOTE',
            title: quote.quoteRequest.title,
            description: quote.quoteRequest.description,
            addressLine1: '', // To be filled in next step
            city: quote.quoteRequest.city || '',
            postcode: quote.quoteRequest.postcode,
            latitude: quote.quoteRequest.latitude,
            longitude: quote.quoteRequest.longitude,
            scheduledDate: quote.availableDate || new Date(),
            scheduledTime: quote.availableTime || '09:00',
            estimatedDuration: quote.estimatedDuration,
            subtotal,
            platformFee,
            platformFeeRate,
            total,
            providerEarnings,
            paymentStatus: 'PENDING',
        },
    });

    // Update quote status
    await prisma.quote.update({
        where: { id: quoteId },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    // Update quote request status
    await prisma.quoteRequest.update({
        where: { id: quote.quoteRequestId },
        data: { status: 'ACCEPTED' },
    });

    // Decline other quotes
    await prisma.quote.updateMany({
        where: {
            quoteRequestId: quote.quoteRequestId,
            id: { not: quoteId },
            status: { in: ['SENT', 'VIEWED'] },
        },
        data: { status: 'DECLINED', declinedReason: 'Another quote was accepted' },
    });

    revalidatePath('/dashboard');
    return { success: true, bookingId: booking.id };
}

export async function createCheckoutSession(bookingId: string) {
    const session = await requireAuth();

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            customer: { include: { user: true } },
            provider: true,
            service: true,
        },
    });

    if (!booking) {
        return { error: 'Booking not found' };
    }

    if (booking.customer.userId !== session.user.id) {
        return { error: 'Unauthorized' };
    }

    if (booking.paymentStatus !== 'PENDING') {
        return { error: 'This booking has already been paid' };
    }

    // Ensure provider has Stripe Connect
    if (!booking.provider.stripeAccountId) {
        return { error: 'Provider payment setup incomplete' };
    }

    const checkoutSession = await createBookingCheckoutSession({
        bookingId: booking.id,
        customerId: booking.customerId,
        customerEmail: booking.customer.user.email,
        amount: booking.total.toNumber(),
        serviceName: booking.service?.name || booking.title,
        providerConnectAccountId: booking.provider.stripeAccountId,
        platformFeeAmount: booking.platformFee.toNumber(),
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${booking.id}?success=true`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${booking.id}?cancelled=true`,
    });

    return { url: checkoutSession.url };
}

// =============================================================================
// Provider Onboarding Actions
// =============================================================================

const providerProfileSchema = z.object({
    businessName: z.string().min(2).max(100),
    description: z.string().min(50).max(2000).optional(),
    shortBio: z.string().max(300).optional(),
    businessPhone: z.string().optional(),
    businessEmail: z.string().email().optional(),
    website: z.string().url().optional().or(z.literal('')),
    addressLine1: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
    serviceRadius: z.number().min(1).max(100).default(15),
});

export async function updateProviderProfile(data: z.infer<typeof providerProfileSchema>) {
    const session = await requireProvider();

    const result = providerProfileSchema.safeParse(data);
    if (!result.success) {
        return { error: 'Invalid input', details: result.error.flatten() };
    }

    const validatedData = result.data;

    // Generate slug from business name
    const slug = validatedData.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const providerProfile = await prisma.providerProfile.update({
        where: { userId: session.user.id },
        data: {
            ...validatedData,
            slug,
        },
    });

    // Geocode if postcode provided
    if (validatedData.postcode) {
        const geocodeResult = await geocodePostcode(validatedData.postcode);
        if (geocodeResult) {
            await prisma.providerProfile.update({
                where: { id: providerProfile.id },
                data: {
                    latitude: geocodeResult.latitude,
                    longitude: geocodeResult.longitude,
                    city: geocodeResult.city || validatedData.city,
                },
            });

            // Create/update default location
            await prisma.providerLocation.upsert({
                where: {
                    id: `${providerProfile.id}-default`,
                },
                create: {
                    id: `${providerProfile.id}-default`,
                    providerId: providerProfile.id,
                    postcode: validatedData.postcode.toUpperCase(),
                    city: geocodeResult.city || validatedData.city || '',
                    latitude: geocodeResult.latitude,
                    longitude: geocodeResult.longitude,
                    radius: validatedData.serviceRadius,
                    isDefault: true,
                },
                update: {
                    postcode: validatedData.postcode.toUpperCase(),
                    city: geocodeResult.city || validatedData.city || '',
                    latitude: geocodeResult.latitude,
                    longitude: geocodeResult.longitude,
                    radius: validatedData.serviceRadius,
                },
            });
        }
    }

    // Update profile score
    await updateProviderProfileScore(providerProfile.id);

    revalidatePath('/provider');
    return { success: true };
}

export async function startStripeConnect() {
    const session = await requireProvider();

    const providerProfile = await prisma.providerProfile.findUnique({
        where: { userId: session.user.id },
        include: { user: true },
    });

    if (!providerProfile) {
        return { error: 'Provider profile not found' };
    }

    // Create or retrieve Connect account
    if (providerProfile.stripeAccountId) {
        // Already has account, create new login link
        const loginLink = await stripe.accounts.createLoginLink(providerProfile.stripeAccountId);
        return { url: loginLink.url };
    }

    const { account, accountLink } = await createConnectAccount({
        email: providerProfile.user.email,
        providerId: providerProfile.id,
        businessName: providerProfile.businessName,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/provider/settings/payments?connected=true`,
        refreshUrl: `${process.env.NEXT_PUBLIC_APP_URL}/provider/settings/payments?refresh=true`,
    });

    // Save account ID
    await prisma.providerProfile.update({
        where: { id: providerProfile.id },
        data: {
            stripeAccountId: account.id,
            stripeAccountStatus: 'ONBOARDING',
        },
    });

    return { url: accountLink.url };
}

// =============================================================================
// Review Actions
// =============================================================================

const reviewSchema = z.object({
    bookingId: z.string(),
    overallRating: z.number().min(1).max(5),
    qualityRating: z.number().min(1).max(5).optional(),
    valueRating: z.number().min(1).max(5).optional(),
    punctualityRating: z.number().min(1).max(5).optional(),
    communicationRating: z.number().min(1).max(5).optional(),
    title: z.string().max(100).optional(),
    comment: z.string().min(20).max(2000),
    photos: z.array(z.string()).optional(),
});

export async function submitReview(data: z.infer<typeof reviewSchema>) {
    const session = await requireAuth();

    const customerProfile = await prisma.customerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!customerProfile) {
        return { error: 'Customer profile not found' };
    }

    const result = reviewSchema.safeParse(data);
    if (!result.success) {
        return { error: 'Invalid input', details: result.error.flatten() };
    }

    const validatedData = result.data;

    const booking = await prisma.booking.findUnique({
        where: { id: validatedData.bookingId },
        include: { review: true },
    });

    if (!booking || booking.customerId !== customerProfile.id) {
        return { error: 'Booking not found or unauthorized' };
    }

    if (booking.status !== 'COMPLETED') {
        return { error: 'Can only review completed bookings' };
    }

    if (booking.review) {
        return { error: 'You have already reviewed this booking' };
    }

    // Check review window
    const reviewWindowConfig = await prisma.platformConfig.findUnique({
        where: { key: 'review_window_days' },
    });
    const reviewWindowDays = reviewWindowConfig ? parseInt(reviewWindowConfig.value) : 14;
    const reviewDeadline = new Date(booking.customerConfirmedAt || booking.updatedAt);
    reviewDeadline.setDate(reviewDeadline.getDate() + reviewWindowDays);

    if (new Date() > reviewDeadline) {
        return { error: 'Review window has expired' };
    }

    // Check for photo bonus
    let photoBonus: number | undefined;
    if (validatedData.photos && validatedData.photos.length > 0) {
        const bonusConfig = await prisma.platformConfig.findUnique({
            where: { key: 'photo_review_credit' },
        });
        photoBonus = bonusConfig ? parseFloat(bonusConfig.value) : 5;
    }

    // Create review
    const review = await prisma.review.create({
        data: {
            bookingId: validatedData.bookingId,
            customerId: customerProfile.id,
            providerId: booking.providerId,
            overallRating: validatedData.overallRating,
            qualityRating: validatedData.qualityRating,
            valueRating: validatedData.valueRating,
            punctualityRating: validatedData.punctualityRating,
            communicationRating: validatedData.communicationRating,
            title: validatedData.title,
            comment: validatedData.comment,
            photoBonus,
        },
    });

    // Create photo records
    if (validatedData.photos && validatedData.photos.length > 0) {
        await prisma.reviewMedia.createMany({
            data: validatedData.photos.map((url) => ({
                reviewId: review.id,
                url,
                type: 'IMAGE',
            })),
        });
    }

    // Award photo bonus credit
    if (photoBonus) {
        await prisma.customerProfile.update({
            where: { id: customerProfile.id },
            data: { creditBalance: { increment: photoBonus } },
        });

        await prisma.creditTransaction.create({
            data: {
                customerId: customerProfile.id,
                type: 'REVIEW_BONUS',
                amount: photoBonus,
                description: 'Photo review bonus',
                bookingId: validatedData.bookingId,
                balanceAfter: customerProfile.creditBalance.toNumber() + photoBonus,
            },
        });
    }

    // Update provider stats
    await updateProviderStats(booking.providerId);

    revalidatePath('/dashboard');
    return { success: true, reviewId: review.id };
}

// =============================================================================
// Helper Functions
// =============================================================================

async function geocodePostcode(postcode: string): Promise<{
    latitude: number;
    longitude: number;
    city?: string;
} | null> {
    // Simplified UK postcode geocoding
    // In production, use Google Maps Geocoding API
    try {
        const response = await fetch(
            `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`
        );
        if (response.ok) {
            const data = await response.json();
            if (data.result) {
                return {
                    latitude: data.result.latitude,
                    longitude: data.result.longitude,
                    city: data.result.admin_district || data.result.region,
                };
            }
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    return null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula
    const R = 3959; // Radius of Earth in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function updateProviderProfileScore(providerId: string) {
    const provider = await prisma.providerProfile.findUnique({
        where: { id: providerId },
        include: {
            services: true,
            portfolio: true,
            certifications: true,
            documents: true,
        },
    });

    if (!provider) return;

    let score = 0;

    // Basic info (25%)
    if (provider.businessName) score += 5;
    if (provider.description && provider.description.length >= 100) score += 10;
    if (provider.shortBio) score += 5;
    if (provider.businessPhone) score += 5;

    // Verification (25%)
    if (provider.emailVerified) score += 5;
    if (provider.phoneVerified) score += 10;
    if (provider.identityVerified) score += 5;
    if (provider.insuranceVerified) score += 5;

    // Services & Portfolio (25%)
    if (provider.services.length > 0) score += 10;
    if (provider.portfolio.length >= 3) score += 10;
    else if (provider.portfolio.length > 0) score += 5;
    if (provider.certifications.length > 0) score += 5;

    // Stripe & Availability (25%)
    if (provider.stripeAccountStatus === 'ACTIVE') score += 15;
    else if (provider.stripeAccountId) score += 5;
    // Availability checked separately

    await prisma.providerProfile.update({
        where: { id: providerId },
        data: { profileScore: Math.min(score, 100) },
    });
}

async function updateProviderStats(providerId: string) {
    const reviews = await prisma.review.findMany({
        where: { providerId, status: 'PUBLISHED' },
    });

    const totalReviews = reviews.length;
    const avgRating =
        totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews
            : null;

    const bookings = await prisma.booking.findMany({
        where: { providerId },
    });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : null;

    // Calculate repeat customer rate
    const customerBookings = bookings.reduce((acc, b) => {
        acc[b.customerId] = (acc[b.customerId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const totalCustomers = Object.keys(customerBookings).length;
    const repeatCustomers = Object.values(customerBookings).filter((c) => c > 1).length;
    const repeatCustomerRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : null;

    await prisma.providerProfile.update({
        where: { id: providerId },
        data: {
            avgRating,
            totalReviews,
            totalBookings,
            completionRate,
            repeatCustomerRate,
        },
    });
}
