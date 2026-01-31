import { LucideIcon, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ComingSoonProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    backPath?: string;
    backLabel?: string;
}

export default function ComingSoon({
    title,
    description,
    icon: Icon = Construction,
    backPath = "/dashboard",
    backLabel = "Back to Dashboard"
}: ComingSoonProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Icon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-3">{title}</h1>
            <p className="text-muted-foreground max-w-md mb-8">
                {description}
            </p>
            <Link href={backPath}>
                <Button variant="outline">
                    {backLabel}
                </Button>
            </Link>
        </div>
    );
}
