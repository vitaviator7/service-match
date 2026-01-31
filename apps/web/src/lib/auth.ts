// =============================================================================
// NextAuth Configuration
// =============================================================================

import { NextAuthOptions, getServerSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { compare } from 'bcryptjs';
import { prisma } from '@service-match/db';
import type { Adapter } from 'next-auth/adapters';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            image?: string | null;
            role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
            firstName?: string | null;
            lastName?: string | null;
            phoneVerified: boolean;
            twoFactorEnabled: boolean;
        };
    }

    interface User {
        role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
        firstName?: string | null;
        lastName?: string | null;
        phoneVerified: boolean;
        twoFactorEnabled: boolean;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
        firstName?: string | null;
        lastName?: string | null;
        phoneVerified: boolean;
        twoFactorEnabled: boolean;
    }
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as Adapter,
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/error',
        verifyRequest: '/auth/verify',
    },
    providers: [
        // Email/Password credentials
        CredentialsProvider({
            id: 'credentials',
            name: 'Email',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
                totp: { label: '2FA Code', type: 'text', optional: true },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email.toLowerCase() },
                });

                if (!user || !user.passwordHash) {
                    throw new Error('Invalid email or password');
                }

                if (user.status === 'SUSPENDED') {
                    throw new Error('Your account has been suspended');
                }

                if (user.status === 'BANNED') {
                    throw new Error('Your account has been banned');
                }

                const isPasswordValid = await compare(credentials.password, user.passwordHash);
                if (!isPasswordValid) {
                    throw new Error('Invalid email or password');
                }

                // Check 2FA for admins
                if (user.twoFactorEnabled && user.role === 'ADMIN') {
                    if (!credentials.totp) {
                        throw new Error('2FA_REQUIRED');
                    }
                    // TODO: Validate TOTP token
                    // const isValidTotp = await validateTotp(user.twoFactorSecret, credentials.totp);
                    // if (!isValidTotp) {
                    //     throw new Error('Invalid 2FA code');
                    // }
                }

                // Update last login
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLoginAt: new Date() },
                });

                return {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                    image: user.avatarUrl,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phoneVerified: user.phoneVerified,
                    twoFactorEnabled: user.twoFactorEnabled,
                };
            },
        }),

        // Magic link (passwordless)
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST || 'smtp.sendgrid.net',
                port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
                auth: {
                    user: process.env.EMAIL_SERVER_USER || 'apikey',
                    pass: process.env.SENDGRID_API_KEY || '',
                },
            },
            from: process.env.SENDGRID_FROM_EMAIL || 'noreply@servicematch.co.uk',
            maxAge: 60 * 60, // 1 hour
        }),

        // Google OAuth
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                GoogleProvider({
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    allowDangerousEmailAccountLinking: true,
                }),
            ]
            : []),

        // Apple OAuth (optional)
        // ...(process.env.APPLE_ID && process.env.APPLE_SECRET
        //     ? [
        //         AppleProvider({
        //             clientId: process.env.APPLE_ID,
        //             clientSecret: process.env.APPLE_SECRET,
        //         }),
        //     ]
        //     : []),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // Check if user is banned/suspended for OAuth logins
            if (account?.provider !== 'credentials') {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email! },
                });

                if (existingUser) {
                    if (existingUser.status === 'SUSPENDED') {
                        return '/auth/error?error=AccountSuspended';
                    }
                    if (existingUser.status === 'BANNED') {
                        return '/auth/error?error=AccountBanned';
                    }
                }
            }

            return true;
        },

        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
                token.phoneVerified = user.phoneVerified;
                token.twoFactorEnabled = user.twoFactorEnabled;
            }

            // Handle session updates
            if (trigger === 'update' && session) {
                token.firstName = session.firstName ?? token.firstName;
                token.lastName = session.lastName ?? token.lastName;
                token.role = session.role ?? token.role;
                token.phoneVerified = session.phoneVerified ?? token.phoneVerified;
            }

            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.firstName = token.firstName;
                session.user.lastName = token.lastName;
                session.user.phoneVerified = token.phoneVerified;
                session.user.twoFactorEnabled = token.twoFactorEnabled;
            }

            return session;
        },
    },
    events: {
        async createUser({ user }) {
            // Create customer profile by default for new users
            await prisma.customerProfile.create({
                data: {
                    userId: user.id,
                },
            });

            // Create notification preferences
            await prisma.notificationPreference.create({
                data: {
                    userId: user.id,
                },
            });
        },
    },
};

// =============================================================================
// Server Session Helper
// =============================================================================

export async function getSession() {
    return getServerSession(authOptions);
}

export async function requireAuth() {
    const session = await getSession();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }
    return session;
}

export async function requireRole(roles: ('CUSTOMER' | 'PROVIDER' | 'ADMIN')[]) {
    const session = await requireAuth();
    if (!roles.includes(session.user.role)) {
        throw new Error('Forbidden');
    }
    return session;
}

export async function requireProvider() {
    return requireRole(['PROVIDER', 'ADMIN']);
}

export async function requireAdmin() {
    return requireRole(['ADMIN']);
}

// =============================================================================
// RBAC Permissions
// =============================================================================

type Permission =
    | 'view:admin'
    | 'manage:users'
    | 'manage:providers'
    | 'manage:bookings'
    | 'manage:disputes'
    | 'manage:reviews'
    | 'manage:payments'
    | 'manage:payouts'
    | 'manage:content'
    | 'manage:config'
    | 'view:analytics';

const rolePermissions: Record<string, Permission[]> = {
    SUPER_ADMIN: [
        'view:admin',
        'manage:users',
        'manage:providers',
        'manage:bookings',
        'manage:disputes',
        'manage:reviews',
        'manage:payments',
        'manage:payouts',
        'manage:content',
        'manage:config',
        'view:analytics',
    ],
    ADMIN: [
        'view:admin',
        'manage:users',
        'manage:providers',
        'manage:bookings',
        'manage:disputes',
        'manage:reviews',
        'manage:payments',
        'manage:payouts',
        'manage:content',
        'view:analytics',
    ],
    SUPPORT: [
        'view:admin',
        'manage:bookings',
        'manage:disputes',
        'manage:reviews',
        'view:analytics',
    ],
    FINANCE: [
        'view:admin',
        'manage:payments',
        'manage:payouts',
        'view:analytics',
    ],
    MARKETING: [
        'view:admin',
        'manage:content',
        'view:analytics',
    ],
};

export function hasPermission(role: string, permission: Permission): boolean {
    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission);
}

export function getAllPermissions(role: string): Permission[] {
    return rolePermissions[role] || [];
}
