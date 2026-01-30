import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Careers | ServiceMatch',
};

export default function CareersPage() {
    return (
        <div className="container mx-auto px-4 py-12 text-center min-h-[60vh] flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-6">Join Our Team</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-8">
                We're always looking for talented individuals to help us revolutionize the local services industry.
            </p>
            <div className="bg-slate-50 p-8 rounded-2xl border max-w-md">
                <p className="font-medium">No open positions at the moment.</p>
                <p className="text-sm text-muted-foreground mt-2">Check back later for updates!</p>
            </div>
        </div>
    );
}
