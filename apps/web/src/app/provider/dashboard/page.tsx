import { redirect } from 'next/navigation';

// Redirect /provider/dashboard to /provider
export default function ProviderDashboardRedirect() {
    redirect('/provider');
}
