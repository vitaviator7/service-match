import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { startOfMonth, subMonths, format } from 'date-fns';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const provider = await prisma.providerProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!provider) {
            return new NextResponse('Provider profile not found', { status: 404 });
        }

        // Get payouts
        const payouts = await prisma.payout.findMany({
            where: { providerId: provider.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        // Get monthly revenue stats (last 6 months)
        const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

        const monthlyStats = await prisma.booking.groupBy({
            by: ['completedAt'],
            where: {
                providerId: provider.id,
                status: 'COMPLETED',
                completedAt: { gte: sixMonthsAgo },
            },
            _sum: {
                providerEarnings: true,
            },
        });

        // Process formatted stats
        // Note: Prisma groupBy on DateTime is tricky with specific databases vs specific formats.
        // A simpler approach for aggregations might be raw query or just fetching and mapping in JS if volume is low.
        // For now, let's fetch recent bookings and aggregate manually to ensure accuracy.

        const recentBookings = await prisma.booking.findMany({
            where: {
                providerId: provider.id,
                status: 'COMPLETED',
                completedAt: { gte: sixMonthsAgo },
            },
            select: {
                completedAt: true,
                providerEarnings: true,
            }
        });

        const revenueMap = new Map<string, number>();
        // Init last 6 months
        for (let i = 0; i < 6; i++) {
            const d = subMonths(new Date(), i);
            revenueMap.set(format(d, 'MMM yyyy'), 0);
        }

        recentBookings.forEach(b => {
            if (b.completedAt) {
                const key = format(b.completedAt, 'MMM yyyy');
                const current = revenueMap.get(key) || 0;
                // Decimal to number
                revenueMap.set(key, current + Number(b.providerEarnings));
            }
        });

        const chartData = Array.from(revenueMap.entries())
            .map(([month, amount]) => ({ month, amount }))
            .reverse();

        return NextResponse.json({
            balances: {
                available: provider.availableBalance,
                pending: provider.pendingBalance,
                totalRevenue: provider.totalRevenue,
            },
            payouts,
            chartData,
        });
    } catch (error) {
        console.error('Error fetching earnings:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
