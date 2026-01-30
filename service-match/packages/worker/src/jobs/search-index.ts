import { prisma } from '@service-match/db';

export async function updateSearchIndex() {
    console.log('🔍 Updating search index...');

    // Calculate and update provider stats
    const providers = await prisma.providerProfile.findMany({
        where: {
            status: 'ACTIVE',
        },
        include: {
            reviews: {
                select: { overallRating: true },
            },
            bookings: {
                where: {
                    status: { in: ['COMPLETED', 'CONFIRMED'] },
                },
                select: { id: true },
            },
            quotes: {
                where: {
                    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                },
                select: {
                    createdAt: true,
                    quoteRequest: {
                        select: { createdAt: true },
                    },
                },
            },
        },
    });

    let updatedCount = 0;

    for (const provider of providers) {
        // Calculate average rating
        const avgRating = provider.reviews.length > 0
            ? provider.reviews.reduce((sum: number, r: any) => sum + r.overallRating, 0) / provider.reviews.length
            : null;

        // Calculate response rate (quotes sent / leads received)
        const quotesLast30Days = provider.quotes.length;

        // Calculate average response time
        let avgResponseTime = null;
        if (provider.quotes.length > 0) {
            const responseTimes = provider.quotes
                .filter((q: any) => q.quoteRequest)
                .map((q: any) => {
                    const quoteTime = new Date(q.createdAt).getTime();
                    const requestTime = new Date(q.quoteRequest!.createdAt).getTime();
                    return (quoteTime - requestTime) / (1000 * 60); // Minutes
                });

            if (responseTimes.length > 0) {
                avgResponseTime = Math.round(
                    responseTimes.reduce((sum: number, t: number) => sum + t, 0) / responseTimes.length
                );
            }
        }

        // Update provider stats
        await prisma.providerProfile.update({
            where: { id: provider.id },
            data: {
                avgRating,
                totalReviews: provider.reviews.length,
                totalBookings: provider.bookings.length,
                avgResponseTime,
            },
        });

        updatedCount++;
    }

    // Update page indexing status based on content thresholds
    await updatePageIndexStatus();

    console.log(`🔍 Updated ${updatedCount} provider profiles`);
}

async function updatePageIndexStatus() {
    // Update category pages
    const categories = await prisma.category.findMany({
        include: {
            _count: {
                select: {
                    services: true,
                },
            },
            contentBlocks: {
                select: { id: true },
            },
        },
    });

    for (const category of categories) {
        const hasEnoughProviders = category._count.services >= 3;
        const hasContent = category.contentBlocks.length >= 1;

        await prisma.pageIndexControl.upsert({
            where: {
                pageType_categoryId: {
                    pageType: 'CATEGORY',
                    categoryId: category.id,
                },
            },
            update: {
                shouldIndex: hasEnoughProviders && hasContent,
                lastCheckedAt: new Date(),
            },
            create: {
                pageType: 'CATEGORY',
                categoryId: category.id,
                shouldIndex: hasEnoughProviders && hasContent,
                lastCheckedAt: new Date(),
            },
        });
    }

    console.log(`📄 Updated page index status for ${categories.length} categories`);
}
