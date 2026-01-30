import { redirect } from 'next/navigation';

export default function ProviderSignupPage() {
    redirect('/auth/signup?type=PROVIDER');
}
