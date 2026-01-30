// =============================================================================
// ServiceMatch Type Definitions
// =============================================================================

// Booking State Machine
export type BookingStatus =
    | 'REQUESTED'
    | 'ACCEPTED'
    | 'PAID'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'DISPUTED'
    | 'REFUNDED';

export type QuoteRequestStatus =
    | 'OPEN'
    | 'QUOTES_RECEIVED'
    | 'ACCEPTED'
    | 'CANCELLED'
    | 'EXPIRED';

export type QuoteStatus =
    | 'SENT'
    | 'VIEWED'
    | 'ACCEPTED'
    | 'DECLINED'
    | 'EXPIRED'
    | 'WITHDRAWN';

export type DisputeStatus =
    | 'OPEN'
    | 'INVESTIGATING'
    | 'AWAITING_RESPONSE'
    | 'RESOLVED'
    | 'CLOSED';

export type DisputeOutcome =
    | 'FULL_REFUND'
    | 'PARTIAL_REFUND'
    | 'RELEASE_TO_PROVIDER'
    | 'SPLIT'
    | 'CLOSE_NO_ACTION';

// User & Profile Types
export interface PublicProviderProfile {
    id: string;
    slug: string;
    businessName: string;
    shortBio: string | null;
    city: string | null;
    avatarUrl: string | null;
    avgRating: number | null;
    totalReviews: number;
    totalBookings: number;
    responseRate: number | null;
    avgResponseTime: number | null;
    verified: {
        email: boolean;
        phone: boolean;
        identity: boolean;
        insurance: boolean;
        business: boolean;
    };
    subscriptionTier: 'STARTER' | 'PRO' | 'PREMIUM';
    featured: boolean;
    instantBookingEnabled: boolean;
}

export interface ProviderSearchResult extends PublicProviderProfile {
    services: {
        id: string;
        name: string;
        pricingModel: string;
        priceFrom: number | null;
        fixedPrice: number | null;
        hourlyRate: number | null;
    }[];
    distance: number | null;
    matchScore: number;
}

// Pricing
export interface PriceBreakdown {
    subtotal: number;
    bookingFee: number;
    platformFee: number;
    dynamicPricing: number;
    creditApplied: number;
    cashbackApplied: number;
    promoDiscount: number;
    total: number;
    providerEarnings: number;
}

export interface QuoteBreakdown {
    labor?: number;
    materials?: number;
    callOut?: number;
    other?: number;
    total: number;
}

// Notifications
export interface NotificationData {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    channels: ('IN_APP' | 'EMAIL' | 'SMS' | 'PUSH')[];
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, string[]>;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        hasMore?: boolean;
    };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}

// Job Brief Types
export interface JobBriefField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'time' | 'number' | 'boolean' | 'photos';
    required: boolean;
    options?: { value: string; label: string }[];
    placeholder?: string;
    helpText?: string;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
}

export interface JobBriefConfig {
    categorySlug: string;
    title: string;
    description: string;
    fields: JobBriefField[];
}

// Dashboard Stats
export interface ProviderDashboardStats {
    totalEarnings: number;
    pendingPayouts: number;
    activeBookings: number;
    pendingQuotes: number;
    newLeads: number;
    avgRating: number;
    responseRate: number;
    completionRate: number;
}

export interface AdminDashboardStats {
    gmv: number;
    revenue: number;
    takeRate: number;
    activeProviders: number;
    activeCustomers: number;
    totalBookings: number;
    totalDisputes: number;
    pendingVerifications: number;
}

// SEO Types
export interface SEOData {
    title: string;
    description: string;
    canonical?: string;
    noindex?: boolean;
    jsonLd?: Record<string, unknown>[];
}

// Feature Flags
export interface FeatureFlags {
    instantBooking: boolean;
    dynamicPricing: boolean;
    aiAssist: boolean;
    stripeIdentity: boolean;
    customerPlus: boolean;
    referralProgram: boolean;
    photoReviewBonus: boolean;
    serviceBundles: boolean;
    maintenanceReminders: boolean;
}
