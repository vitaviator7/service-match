// =============================================================================
// Serious Control Utility Functions
// =============================================================================

import { PLATFORM_FEES, BOOKING_TRANSITIONS, QUOTE_TRANSITIONS } from './constants';
import type { BookingStatus, QuoteStatus, PriceBreakdown } from './types';

// =============================================================================
// Price Calculations
// =============================================================================

export function calculatePlatformFee(
    amount: number,
    providerTier: 'STARTER' | 'PRO' | 'PREMIUM'
): number {
    const rate = PLATFORM_FEES[providerTier];
    return Math.round(amount * rate * 100) / 100;
}

export function calculateProviderEarnings(
    amount: number,
    providerTier: 'STARTER' | 'PRO' | 'PREMIUM'
): number {
    const platformFee = calculatePlatformFee(amount, providerTier);
    return Math.round((amount - platformFee) * 100) / 100;
}

export function calculatePriceBreakdown(params: {
    subtotal: number;
    providerTier: 'STARTER' | 'PRO' | 'PREMIUM';
    bookingFee?: number;
    dynamicPricingMultiplier?: number;
    creditBalance?: number;
    cashbackBalance?: number;
    promoDiscount?: number;
    isCustomerPlus?: boolean;
}): PriceBreakdown {
    const {
        subtotal,
        providerTier,
        bookingFee = 0,
        dynamicPricingMultiplier = 1,
        creditBalance = 0,
        cashbackBalance = 0,
        promoDiscount = 0,
        isCustomerPlus = false,
    } = params;

    // Apply dynamic pricing
    const dynamicPricing = Math.round((subtotal * (dynamicPricingMultiplier - 1)) * 100) / 100;
    const adjustedSubtotal = subtotal + dynamicPricing;

    // Calculate platform fee on adjusted subtotal
    const platformFee = calculatePlatformFee(adjustedSubtotal, providerTier);

    // Calculate total before credits
    let total = adjustedSubtotal + bookingFee;

    // Apply promo discount
    total = Math.max(0, total - promoDiscount);

    // Apply credits (up to total amount)
    const creditApplied = Math.min(creditBalance, total);
    total = Math.max(0, total - creditApplied);

    // Apply cashback (up to remaining amount)
    const cashbackApplied = Math.min(cashbackBalance, total);
    total = Math.max(0, total - cashbackApplied);

    // Provider earnings (based on original subtotal + dynamic pricing, minus platform fee)
    const providerEarnings = adjustedSubtotal - platformFee;

    return {
        subtotal,
        bookingFee,
        platformFee,
        dynamicPricing,
        creditApplied,
        cashbackApplied,
        promoDiscount,
        total: Math.round(total * 100) / 100,
        providerEarnings: Math.round(providerEarnings * 100) / 100,
    };
}

export function calculateCashback(amount: number, rate: number): number {
    return Math.round(amount * rate * 100) / 100;
}

// =============================================================================
// State Machine Helpers
// =============================================================================

export function canTransitionBooking(
    currentStatus: BookingStatus,
    targetStatus: BookingStatus
): boolean {
    const allowedTransitions = BOOKING_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(targetStatus);
}

export function canTransitionQuote(
    currentStatus: QuoteStatus,
    targetStatus: QuoteStatus
): boolean {
    const allowedTransitions = QUOTE_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(targetStatus);
}

export function getNextBookingStatuses(currentStatus: BookingStatus): BookingStatus[] {
    return (BOOKING_TRANSITIONS[currentStatus] || []) as BookingStatus[];
}

// =============================================================================
// UK Postcode Helpers
// =============================================================================

export function normalizePostcode(postcode: string): string {
    return postcode.toUpperCase().replace(/\s+/g, '').replace(/^(.+?)(\d[A-Z]{2})$/, '$1 $2');
}

export function getPostcodeOutcode(postcode: string): string {
    const normalized = normalizePostcode(postcode);
    return normalized.split(' ')[0];
}

export function getPostcodeArea(postcode: string): string {
    const outcode = getPostcodeOutcode(postcode);
    return outcode.replace(/\d+$/, '');
}

// =============================================================================
// Distance Calculations
// =============================================================================

export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 3959; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// =============================================================================
// Date & Time Helpers
// =============================================================================

export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
}

export function formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatRelativeTime(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(d);
}

export function isWithinQuietHours(time: Date = new Date()): boolean {
    const hours = time.getHours();
    // Quiet hours: 22:00 - 08:00
    return hours >= 22 || hours < 8;
}

export function getNextFriday(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + daysUntilFriday);
    nextFriday.setHours(0, 0, 0, 0);
    return nextFriday;
}

// =============================================================================
// Currency Helpers
// =============================================================================

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
    }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
    if (amount >= 1000) {
        return `£${(amount / 1000).toFixed(1)}k`;
    }
    return formatCurrency(amount);
}

// =============================================================================
// Slug Helpers
// =============================================================================

export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100);
}

export function generateUniqueSlug(text: string, id: string): string {
    const baseSlug = generateSlug(text);
    const suffix = id.substring(0, 8);
    return `${baseSlug}-${suffix}`;
}

// =============================================================================
// Rating Helpers
// =============================================================================

export function calculateAverageRating(ratings: number[]): number | null {
    if (ratings.length === 0) return null;
    const sum = ratings.reduce((acc, r) => acc + r, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
}

export function formatRating(rating: number | null): string {
    if (rating === null) return 'New';
    return rating.toFixed(1);
}

// =============================================================================
// String Helpers
// =============================================================================

export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

export function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function pluralize(count: number, singular: string, plural?: string): string {
    const p = plural || singular + 's';
    return count === 1 ? `${count} ${singular}` : `${count} ${p}`;
}

// =============================================================================
// Validation Helpers
// =============================================================================

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isValidUKPostcode(postcode: string): boolean {
    const postcodeRegex = /^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|GIR ?0A{2})$/i;
    return postcodeRegex.test(postcode);
}

export function isValidUKPhone(phone: string): boolean {
    const phoneRegex = /^(\+44|0)7\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// =============================================================================
// ID Generation
// =============================================================================

export function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
