import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Cookie Policy | ServiceMatch',
};

export default function CookiesPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">Cookie Policy</h1>
            <div className="prose dark:prose-invert">
                <p>We use cookies to enhance your experience on ServiceMatch.</p>
                <h3>What are cookies?</h3>
                <p>Cookies are small text files stored on your device that help us remember your preferences and analyze site usage.</p>
                <h3>How we use cookies</h3>
                <ul>
                    <li>Authentication: To keep you signed in.</li>
                    <li>Analytics: To understand how you use our site.</li>
                    <li>Preferences: To remember your settings.</li>
                </ul>
            </div>
        </div>
    );
}
