// =============================================================================
// Serious Control Zod Validation Schemas
// =============================================================================

import { z } from 'zod';
import { UK_POSTCODE_REGEX, UK_PHONE_REGEX } from './constants';

// =============================================================================
// Common Schemas
// =============================================================================

export const ukPostcodeSchema = z.string().regex(UK_POSTCODE_REGEX, 'Invalid UK postcode');

export const ukPhoneSchema = z.string().regex(UK_PHONE_REGEX, 'Invalid UK phone number');

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

export const slugSchema = z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format');

export const currencySchema = z.number().min(0).multipleOf(0.01);

export const ratingSchema = z.number().int().min(1).max(5);

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

// =============================================================================
// Auth Schemas
// =============================================================================

export const signUpSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    role: z.enum(['CUSTOMER', 'PROVIDER']).default('CUSTOMER'),
});

export const signInSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

export const magicLinkSchema = z.object({
    email: emailSchema,
});

export const phoneVerificationSchema = z.object({
    phone: ukPhoneSchema,
    code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

export const twoFactorSchema = z.object({
    code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

// =============================================================================
// Provider Schemas
// =============================================================================

export const providerOnboardingStep1Schema = z.object({
    businessName: z.string().min(2, 'Business name is required').max(100),
    businessPhone: ukPhoneSchema,
    businessEmail: emailSchema.optional(),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const providerOnboardingStep2Schema = z.object({
    description: z.string().min(50, 'Description must be at least 50 characters').max(2000),
    shortBio: z.string().max(300).optional(),
    categoryIds: z.array(z.string()).min(1, 'Select at least one category'),
});

export const providerOnboardingStep3Schema = z.object({
    postcode: ukPostcodeSchema,
    addressLine1: z.string().min(1, 'Address is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    serviceRadius: z.number().int().min(1).max(50),
});

export const providerServiceSchema = z.object({
    categoryId: z.string(),
    subcategoryId: z.string().optional(),
    name: z.string().min(2).max(100),
    description: z.string().max(1000).optional(),
    pricingModel: z.enum(['FIXED', 'HOURLY', 'QUOTE', 'PACKAGE']),
    fixedPrice: currencySchema.optional(),
    priceFrom: currencySchema.optional(),
    priceTo: currencySchema.optional(),
    hourlyRate: currencySchema.optional(),
    minHours: z.number().min(0.5).optional(),
    callOutFee: currencySchema.optional(),
    duration: z.number().int().min(15).optional(),
});

export const providerAvailabilitySchema = z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
    isAvailable: z.boolean(),
});

// =============================================================================
// Quote Schemas
// =============================================================================

export const quoteRequestSchema = z.object({
    categoryId: z.string(),
    serviceId: z.string().optional(),
    propertyId: z.string().optional(),
    title: z.string().min(5, 'Title must be at least 5 characters').max(200),
    description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
    requirements: z.record(z.unknown()).optional(),
    postcode: ukPostcodeSchema,
    city: z.string().optional(),
    urgency: z.enum(['EMERGENCY', 'URGENT', 'THIS_WEEK', 'THIS_MONTH', 'FLEXIBLE']).default('FLEXIBLE'),
    preferredDate: z.string().datetime().optional(),
    preferredTime: z.string().optional(),
    budgetMin: currencySchema.optional(),
    budgetMax: currencySchema.optional(),
    photos: z.array(z.string().url()).max(10).default([]),
});

export const quoteResponseSchema = z.object({
    quoteRequestId: z.string(),
    amount: currencySchema.min(1, 'Amount must be greater than 0'),
    breakdown: z.object({
        labor: currencySchema.optional(),
        materials: currencySchema.optional(),
        callOut: currencySchema.optional(),
        other: currencySchema.optional(),
    }).optional(),
    message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
    estimatedDuration: z.number().int().min(15).optional(),
    availableDate: z.string().datetime(),
    availableTime: z.string().optional(),
    validDays: z.number().int().min(1).max(30).default(3),
});

// =============================================================================
// Booking Schemas
// =============================================================================

export const instantBookingSchema = z.object({
    providerId: z.string(),
    serviceId: z.string(),
    propertyId: z.string().optional(),
    scheduledDate: z.string().datetime(),
    scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
    notes: z.string().max(1000).optional(),
    promoCode: z.string().optional(),
});

export const acceptQuoteSchema = z.object({
    quoteId: z.string(),
    propertyId: z.string().optional(),
    promoCode: z.string().optional(),
});

// =============================================================================
// Review Schemas
// =============================================================================

export const reviewSchema = z.object({
    bookingId: z.string(),
    overallRating: ratingSchema,
    qualityRating: ratingSchema.optional(),
    valueRating: ratingSchema.optional(),
    punctualityRating: ratingSchema.optional(),
    communicationRating: ratingSchema.optional(),
    title: z.string().max(100).optional(),
    comment: z.string().min(10, 'Review must be at least 10 characters').max(2000),
    photos: z.array(z.string().url()).max(5).default([]),
});

export const reviewResponseSchema = z.object({
    reviewId: z.string(),
    comment: z.string().min(10).max(1000),
});

// =============================================================================
// Dispute Schemas
// =============================================================================

export const disputeSchema = z.object({
    bookingId: z.string(),
    reason: z.enum([
        'SERVICE_NOT_COMPLETED',
        'POOR_QUALITY',
        'OVERCHARGED',
        'PROVIDER_NO_SHOW',
        'CUSTOMER_NO_SHOW',
        'PROPERTY_DAMAGE',
        'LATE_ARRIVAL',
        'MISCONDUCT',
        'OTHER',
    ]),
    description: z.string().min(20, 'Please provide more details').max(5000),
});

export const disputeResolutionSchema = z.object({
    disputeId: z.string(),
    outcome: z.enum([
        'FULL_REFUND',
        'PARTIAL_REFUND',
        'RELEASE_TO_PROVIDER',
        'SPLIT',
        'CLOSE_NO_ACTION',
    ]),
    resolution: z.string().min(10).max(2000),
    refundAmount: currencySchema.optional(),
});

// =============================================================================
// Messaging Schemas
// =============================================================================

export const messageSchema = z.object({
    threadId: z.string(),
    content: z.string().min(1).max(5000),
});

// =============================================================================
// Search Schemas
// =============================================================================

export const providerSearchSchema = z.object({
    postcode: ukPostcodeSchema.optional(),
    categorySlug: z.string().optional(),
    subcategorySlug: z.string().optional(),
    radius: z.coerce.number().int().min(1).max(50).default(15),
    minRating: z.coerce.number().min(1).max(5).optional(),
    maxPrice: currencySchema.optional(),
    instantBooking: z.coerce.boolean().optional(),
    verified: z.coerce.boolean().optional(),
    sort: z.enum(['recommended', 'rating', 'price_low', 'price_high', 'response_time']).default('recommended'),
    ...paginationSchema.shape,
});

// =============================================================================
// Admin Schemas
// =============================================================================

export const refundSchema = z.object({
    bookingId: z.string(),
    amount: currencySchema,
    reason: z.string().min(5).max(500),
    isPartial: z.boolean().default(false),
});

export const promoCodeSchema = z.object({
    code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/, 'Code must be uppercase alphanumeric'),
    description: z.string().max(200).optional(),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_BOOKING']),
    value: currencySchema,
    minBookingValue: currencySchema.optional(),
    maxDiscountValue: currencySchema.optional(),
    categoryId: z.string().optional(),
    usageLimit: z.number().int().min(1).optional(),
    perUserLimit: z.number().int().min(1).default(1),
    firstBookingOnly: z.boolean().default(false),
    newUsersOnly: z.boolean().default(false),
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
});

export const featureFlagSchema = z.object({
    key: z.string().min(2).max(50).regex(/^[a-z_]+$/, 'Key must be lowercase with underscores'),
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    enabled: z.boolean().default(false),
    rolloutPercentage: z.number().int().min(0).max(100).default(100),
    targetRoles: z.array(z.enum(['CUSTOMER', 'PROVIDER', 'ADMIN'])).default([]),
});

export const contentBlockSchema = z.object({
    pageType: z.enum(['CATEGORY', 'CATEGORY_LOCATION', 'CITY', 'PROVIDER', 'BLOG']),
    categoryId: z.string().optional(),
    cityId: z.string().optional(),
    blockType: z.enum(['INTRO', 'FAQ', 'TIPS', 'PRICING_GUIDE', 'TESTIMONIALS']),
    title: z.string().max(200).optional(),
    content: z.string().min(10),
    displayOrder: z.number().int().min(0).default(0),
});

// =============================================================================
// Type Exports
// =============================================================================

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type QuoteResponseInput = z.infer<typeof quoteResponseSchema>;
export type InstantBookingInput = z.infer<typeof instantBookingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type DisputeInput = z.infer<typeof disputeSchema>;
export type ProviderSearchInput = z.infer<typeof providerSearchSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
export type PromoCodeInput = z.infer<typeof promoCodeSchema>;
