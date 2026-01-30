import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@servicematch.co.uk';
const FROM_NAME = 'ServiceMatch';

// Email template IDs (from SendGrid dynamic templates)
const TEMPLATES = {
    welcome: 'd-welcome-template-id',
    emailVerification: 'd-email-verification-template-id',
    passwordReset: 'd-password-reset-template-id',
    newQuoteRequest: 'd-new-quote-request-template-id',
    quoteReceived: 'd-quote-received-template-id',
    quoteAccepted: 'd-quote-accepted-template-id',
    bookingConfirmed: 'd-booking-confirmed-template-id',
    bookingReminder: 'd-booking-reminder-template-id',
    bookingCompleted: 'd-booking-completed-template-id',
    reviewRequest: 'd-review-request-template-id',
    newReview: 'd-new-review-template-id',
    payoutSent: 'd-payout-sent-template-id',
    disputeOpened: 'd-dispute-opened-template-id',
    disputeResolved: 'd-dispute-resolved-template-id',
    subscriptionConfirmed: 'd-subscription-confirmed-template-id',
    subscriptionCanceled: 'd-subscription-canceled-template-id',
    subscriptionPaymentFailed: 'd-subscription-payment-failed-template-id',
};

interface SendEmailParams {
    to: string;
    template: keyof typeof TEMPLATES;
    data: Record<string, any>;
}

export async function sendEmail({ to, template, data }: SendEmailParams) {
    const templateId = TEMPLATES[template];

    if (!templateId || templateId.startsWith('d-')) {
        // If no real template ID, send plain text fallback
        console.log(`📧 Would send ${template} email to ${to} with data:`, data);

        // In development, just log
        if (process.env.NODE_ENV === 'development') {
            return;
        }
    }

    try {
        await sgMail.send({
            to,
            from: {
                email: FROM_EMAIL,
                name: FROM_NAME,
            },
            templateId,
            dynamicTemplateData: {
                ...data,
                year: new Date().getFullYear(),
                appUrl: process.env.NEXT_PUBLIC_APP_URL,
            },
        });
    } catch (error) {
        console.error('SendGrid error:', error);
        throw error;
    }
}

// Convenience methods for specific emails
export async function sendWelcomeEmail(email: string, name: string) {
    await sendEmail({
        to: email,
        template: 'welcome',
        data: { name },
    });
}

export async function sendVerificationEmail(email: string, name: string, verificationUrl: string) {
    await sendEmail({
        to: email,
        template: 'emailVerification',
        data: { name, verificationUrl },
    });
}

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
    await sendEmail({
        to: email,
        template: 'passwordReset',
        data: { name, resetUrl },
    });
}

export async function sendNewQuoteRequestEmail(
    providerEmail: string,
    providerName: string,
    data: {
        customerName: string;
        service: string;
        location: string;
        quoteRequestUrl: string;
    }
) {
    await sendEmail({
        to: providerEmail,
        template: 'newQuoteRequest',
        data: {
            name: providerName,
            ...data,
        },
    });
}

export async function sendQuoteReceivedEmail(
    customerEmail: string,
    customerName: string,
    data: {
        providerName: string;
        amount: string;
        service: string;
        viewQuoteUrl: string;
    }
) {
    await sendEmail({
        to: customerEmail,
        template: 'quoteReceived',
        data: {
            name: customerName,
            ...data,
        },
    });
}

export async function sendBookingConfirmedEmail(
    email: string,
    name: string,
    data: {
        bookingId: string;
        service: string;
        providerName?: string;
        customerName?: string;
        date: string;
        time: string;
        amount: string;
        viewBookingUrl: string;
    }
) {
    await sendEmail({
        to: email,
        template: 'bookingConfirmed',
        data: {
            name,
            ...data,
        },
    });
}

export async function sendReviewRequestEmail(
    customerEmail: string,
    customerName: string,
    data: {
        providerName: string;
        service: string;
        reviewUrl: string;
    }
) {
    await sendEmail({
        to: customerEmail,
        template: 'reviewRequest',
        data: {
            name: customerName,
            ...data,
        },
    });
}

export async function sendPayoutEmail(
    providerEmail: string,
    providerName: string,
    data: {
        amount: string;
        payoutDate: string;
        bankLast4: string;
    }
) {
    await sendEmail({
        to: providerEmail,
        template: 'payoutSent',
        data: {
            name: providerName,
            ...data,
        },
    });
}
