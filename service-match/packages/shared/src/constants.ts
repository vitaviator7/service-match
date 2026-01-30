// =============================================================================
// ServiceMatch Constants
// =============================================================================

// Platform fees by provider tier
export const PLATFORM_FEES = {
    STARTER: 0.22,
    PRO: 0.18,
    PREMIUM: 0.15,
} as const;

// Lead pricing
export const LEAD_PRICING = {
    STARTER_FREE_QUOTA: 5,
    STARTER_LEAD_FEE: 3.0,
    PRO_INCLUDED: true,
    PREMIUM_INCLUDED: true,
} as const;

// Subscription pricing (GBP)
export const SUBSCRIPTION_PRICES = {
    CUSTOMER_PLUS: 7.99,
    PROVIDER_PRO: 79,
    PROVIDER_PREMIUM: 199,
} as const;

// Customer Plus benefits
export const CUSTOMER_PLUS_BENEFITS = {
    CASHBACK_RATE: 0.05,
    PRIORITY_SUPPORT: true,
    EXTENDED_GUARANTEE: true,
    BETTER_CANCELLATION: true,
} as const;

// Time constants
export const TIME_CONSTANTS = {
    AUTO_CONFIRM_HOURS: 48,
    REVIEW_WINDOW_DAYS: 14,
    QUOTE_EXPIRY_HOURS: 72,
    QUOTE_REQUEST_EXPIRY_HOURS: 168, // 7 days
    PAYOUT_DAY: 5, // Friday
} as const;

// Search & matching
export const SEARCH_CONSTANTS = {
    DEFAULT_RADIUS_MILES: 15,
    MAX_RADIUS_MILES: 50,
    MAX_QUOTES_PER_REQUEST: 5,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
    MAX_IMAGE_SIZE_MB: 10,
    MAX_DOCUMENT_SIZE_MB: 25,
    MAX_VIDEO_SIZE_MB: 100,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;

// Rate limiting
export const RATE_LIMITS = {
    AUTH_ATTEMPTS_PER_HOUR: 10,
    QUOTE_REQUESTS_PER_DAY: 10,
    MESSAGES_PER_MINUTE: 20,
    API_REQUESTS_PER_MINUTE: 100,
} as const;

// SEO thresholds for indexing
export const SEO_THRESHOLDS = {
    MIN_PROVIDERS_FOR_INDEX: 3,
    MIN_REVIEWS_FOR_INDEX: 1,
    MIN_CONTENT_BLOCKS: 1,
} as const;

// Notification quiet hours (UK time)
export const QUIET_HOURS = {
    START: '22:00',
    END: '08:00',
} as const;

// Booking state transitions
export const BOOKING_TRANSITIONS: Record<string, string[]> = {
    REQUESTED: ['ACCEPTED', 'CANCELLED'],
    ACCEPTED: ['PAID', 'CANCELLED'],
    PAID: ['IN_PROGRESS', 'CANCELLED', 'DISPUTED'],
    IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
    COMPLETED: ['DISPUTED', 'REFUNDED'],
    CANCELLED: [],
    DISPUTED: ['REFUNDED', 'COMPLETED'],
    REFUNDED: [],
};

// Quote state transitions
export const QUOTE_TRANSITIONS: Record<string, string[]> = {
    SENT: ['VIEWED', 'EXPIRED', 'WITHDRAWN'],
    VIEWED: ['ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN'],
    ACCEPTED: [],
    DECLINED: [],
    EXPIRED: [],
    WITHDRAWN: [],
};

// UK postcodes regex pattern
export const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|GIR ?0A{2})$/i;

// UK phone number regex
export const UK_PHONE_REGEX = /^(\+44|0)7\d{9}$/;

// Error codes
export const ERROR_CODES = {
    // Auth
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    PHONE_NOT_VERIFIED: 'PHONE_NOT_VERIFIED',
    TWO_FA_REQUIRED: 'TWO_FA_REQUIRED',
    INVALID_TWO_FA: 'INVALID_TWO_FA',

    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',

    // Resources
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    CONFLICT: 'CONFLICT',

    // Booking
    INVALID_BOOKING_STATUS: 'INVALID_BOOKING_STATUS',
    BOOKING_NOT_PAYABLE: 'BOOKING_NOT_PAYABLE',
    BOOKING_ALREADY_COMPLETED: 'BOOKING_ALREADY_COMPLETED',

    // Payment
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
    PAYOUT_NOT_AVAILABLE: 'PAYOUT_NOT_AVAILABLE',

    // Provider
    PROVIDER_NOT_ACTIVE: 'PROVIDER_NOT_ACTIVE',
    PROVIDER_NOT_VERIFIED: 'PROVIDER_NOT_VERIFIED',
    LEAD_QUOTA_EXCEEDED: 'LEAD_QUOTA_EXCEEDED',

    // Rate limiting
    RATE_LIMITED: 'RATE_LIMITED',

    // System
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

// Admin roles and permissions
export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'FINANCE', 'MARKETING'] as const;

export const ADMIN_PERMISSIONS = {
    SUPER_ADMIN: ['*'],
    ADMIN: [
        'users:read', 'users:write',
        'providers:read', 'providers:write', 'providers:verify',
        'bookings:read', 'bookings:write',
        'disputes:read', 'disputes:write', 'disputes:resolve',
        'reviews:read', 'reviews:moderate',
        'content:read', 'content:write',
        'analytics:read',
        'config:read',
    ],
    SUPPORT: [
        'users:read',
        'providers:read',
        'bookings:read', 'bookings:write',
        'disputes:read', 'disputes:write',
        'reviews:read',
    ],
    FINANCE: [
        'users:read',
        'providers:read',
        'bookings:read',
        'payouts:read', 'payouts:write',
        'refunds:read', 'refunds:write',
        'ledger:read',
        'analytics:read',
    ],
    MARKETING: [
        'analytics:read',
        'content:read', 'content:write',
        'promos:read', 'promos:write',
        'emails:read', 'emails:write',
    ],
} as const;

// Category colors (for UI)
export const CATEGORY_COLORS: Record<string, string> = {
    plumbing: '#2563eb',
    electrical: '#eab308',
    cleaning: '#22c55e',
    gardening: '#16a34a',
    handyman: '#f97316',
    'heating-boilers': '#ef4444',
    'painting-decorating': '#8b5cf6',
    carpentry: '#92400e',
    tutoring: '#6366f1',
    'beauty-wellness': '#ec4899',
};
