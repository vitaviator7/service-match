import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | Serious Control',
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
            <div className="prose dark:prose-invert">
                <p>Last updated: January 2024</p>
                <p>Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.</p>

                <h3>1. Information We Collect</h3>
                <p>We collect information you provide directly to us, such as when you create an account, post a job, or contact support.</p>

                <h3>2. How We Use Your Information</h3>
                <p>We use your information to facilitate service bookings, communicate with you, and improve our platform.</p>

                <h3>3. Information Sharing</h3>
                <p>We share necessary details with Service Providers to fulfill your job requests. We do not sell your data to third parties.</p>

                <h3>4. Data Security</h3>
                <p>We implement appropriate technical measures to protect your personal data.</p>
            </div>
        </div>
    );
}
