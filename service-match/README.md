# Serious Control UK Marketplace

A production-ready, full-stack UK local services marketplace covering any trade/service vertical (plumbing, electrical, cleaning, tutoring, beauty, handyman, etc.).

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes + Server Actions, Prisma ORM, PostgreSQL
- **Caching/Queues**: Redis (Upstash), BullMQ
- **Payments**: Stripe (Checkout, Connect, Subscriptions)
- **Messaging**: Pusher
- **Email**: SendGrid
- **SMS**: Twilio
- **Maps**: Google Maps
- **Storage**: AWS S3
- **Monitoring**: Sentry, PostHog, Vercel Analytics

## Project Structure

```
service-match/
├── apps/
│   └── web/                 # Next.js 14 application
├── packages/
│   ├── db/                  # Prisma schema + client
│   ├── worker/              # BullMQ job processors
│   └── shared/              # Shared types, constants, utils
├── turbo.json               # Turborepo configuration
└── package.json             # Workspace root
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Stripe account (with Connect enabled)
- Pusher account
- SendGrid account
- Twilio account
- Google Maps API key
- AWS S3 bucket

### Installation

```bash
# Clone and install dependencies
cd service-match
npm install

# Set up environment variables
cp .env.example .env.local

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

See `.env.example` for all required environment variables.

## Deployment

### Web Application (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel
```

### Worker Service (Railway/Fly/Render)

```bash
# Build and push Docker image
cd packages/worker
docker build -t service-match-worker .
docker push your-registry/service-match-worker

# Deploy to Railway/Fly/Render with environment variables
```

### Database

Use a managed PostgreSQL service:
- Neon
- Supabase
- Railway PostgreSQL
- AWS RDS

### Redis

Use Upstash Redis for serverless compatibility.

## Documentation

- [Deployment Guide](./docs/deployment.md)
- [API Documentation](./docs/api.md)
- [SEO Guide](./docs/seo.md)
- [Runbooks](./docs/runbooks/)

## License

Proprietary - All rights reserved
