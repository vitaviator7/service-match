import { prisma } from '@service-match/db';
import { emailQueue } from '../index';

// Placeholder for Stripe server functionality
const createPayoutToProvider = async (params: any) => {
    // This would be the actual Stripe payout function
    return { id: 'po_placeholder' };
};

export async function processPayouts() {
    console.log('💰 Processing weekly payouts...');

    // Get all providers with available balance
    const providers = await prisma.providerProfile.findMany({
        where: {
            availableBalance: { gt: 0 },
            stripeAccountId: { not: null },
            stripePayoutsEnabled: true,
        },
        include: {
            user: true,
        },
    });

    let successCount = 0;
    let failCount = 0;

    for (const provider of providers as any[]) {
        try {
            // Create payout record
            const payout = await prisma.payout.create({
                data: {
                    providerId: provider.id,
                    amount: provider.availableBalance,
                    status: 'PENDING',
                    scheduledFor: new Date(),
                    grossAmount: provider.availableBalance,
                },
            });

            // Initiate Stripe payout
            const stripePayout = await createPayoutToProvider({
                accountId: provider.stripeAccountId!,
                amount: provider.availableBalance,
                description: `ServiceMatch weekly payout - ${new Date().toISOString().split('T')[0]}`,
                metadata: {
                    payoutId: payout.id,
                    providerId: provider.id,
                },
            });

            // Update payout record
            await prisma.payout.update({
                where: { id: payout.id },
                data: {
                    stripePayoutId: stripePayout.id,
                    status: 'PROCESSING',
                },
            });

            // Reset available balance
            await prisma.providerProfile.update({
                where: { id: provider.id },
                data: {
                    availableBalance: 0,
                },
            });

            // Create ledger entry
            await prisma.ledgerEntry.create({
                data: {
                    providerId: provider.id,
                    payoutId: payout.id,
                    type: 'PAYOUT',
                    amount: -provider.availableBalance,
                    runningBalance: 0,
                    description: `Weekly payout: £${provider.availableBalance.toFixed(2)}`,
                },
            });

            // Send notification email
            await emailQueue.add('payout-notification', {
                to: provider.user.email,
                template: 'payoutSent',
                data: {
                    name: provider.businessName,
                    amount: provider.availableBalance.toFixed(2),
                    payoutDate: new Date().toLocaleDateString('en-GB'),
                },
            });

            successCount++;
            console.log(`✅ Payout initiated for ${provider.businessName}: £${provider.availableBalance}`);
        } catch (error) {
            failCount++;
            console.error(`❌ Payout failed for ${provider.businessName}:`, error);

            // Record failed payout
            await prisma.payout.updateMany({
                where: {
                    providerId: provider.id,
                    status: 'PENDING',
                },
                data: {
                    status: 'FAILED',
                    failedReason: error instanceof Error ? error.message : 'Unknown error',
                },
            });
        }
    }

    console.log(`💰 Payouts complete: ${successCount} success, ${failCount} failed`);
}
