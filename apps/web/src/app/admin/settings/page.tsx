'use client';

import ComingSoon from '@/components/ui/coming-soon';
import { Settings } from 'lucide-react';

export default function AdminPage() {
    return (
        <ComingSoon
            title="Admin Feature"
            description="This administration feature is currently under development."
            icon={Settings}
            backPath="/admin"
            backLabel="Back to Admin Dashboard"
        />
    );
}
