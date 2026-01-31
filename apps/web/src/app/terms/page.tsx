import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | Serious Control',
};

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
            <div className="prose dark:prose-invert">
                <p>Last updated: January 2024</p>
                <p>Welcome to Serious Control. By accessing or using our website, you agree to be bound by these Terms of Service.</p>

                <h3>1. Acceptance of Terms</h3>
                <p>By using our platform, you agree to these terms. If you do not agree, please do not use our services.</p>

                <h3>2. Services Description</h3>
                <p>Serious Control connects customers with third-party service providers. We are a marketplace and do not directly provide home services.</p>

                <h3>3. User Accounts</h3>
                <p>You are responsible for maintaining the confidentiality of your account and password.</p>

                <h3>4. Payments</h3>
                <p>All payments are processed securely via Stripe. Serious Control charges a platform fee for facilitating bookings.</p>

                <h3>5. Limitation of Liability</h3>
                <p>Serious Control is not liable for the conduct of service providers or the quality of their work, although we do facilitate dispute resolution.</p>

                <p className="text-sm text-muted-foreground mt-8">For full terms, please contact legal@servicematch.com</p>
            </div>
        </div>
    );
}
