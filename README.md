# FreeMonitor App

FreeMonitor is a modern full-stack application built with a monorepo architecture using Turborepo. It consists of a Next.js frontend, NestJS backend, and shared packages for types and UI components.

## Project Structure

```
freemonitor-app/
├── apps/
│   ├── frontend/     # Next.js frontend application
│   └── backend/      # NestJS backend API
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared UI components
```

## Tech Stack

- **Monorepo Tooling**: [Turborepo](https://turbo.build/repo) with [pnpm](https://pnpm.io/)
- **Frontend**: [Next.js 14](https://nextjs.org/) with TypeScript and Tailwind CSS
- **Backend**: [NestJS](https://nestjs.com/) with TypeScript
- **Shared Packages**: TypeScript types and UI components
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- pnpm (version 8 or higher)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd freemonitor-app
```

2. Install dependencies:
```bash
pnpm install
```

### Development

To start the development servers for both frontend and backend:

```bash
pnpm dev
```

This will run the `dev` script in all workspaces. You can also run individual workspace scripts:

```bash
# Frontend only
cd apps/frontend
pnpm dev

# Backend only
cd apps/backend
pnpm dev
```

### Building

To build all workspaces:

```bash
pnpm build
```

### Linting

To lint all workspaces:

```bash
pnpm lint
```

## Workspaces

### Frontend (apps/frontend)

A Next.js 14 application that serves as the user interface.

- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Fonts: Geist

### Backend (apps/backend)

A NestJS API that serves as the backend for the application.

- Framework: NestJS
- Language: TypeScript

#### Redis-based Rate Limiting

The backend now implements Redis-based rate limiting using:
- `@nestjs/throttler` - NestJS rate limiting module
- `@tirke/node-cache-manager-ioredis` - Redis store for throttler
- `ioredis` - Redis client

Configuration is done through environment variables:
- `REDIS_HOST` - Redis server host (default: localhost)
- `REDIS_PORT` - Redis server port (default: 6379)
- `REDIS_PASSWORD` - Redis password (default: undefined)
- `REDIS_DB` - Redis database number (default: 0)

### Shared Packages

#### Types (packages/types)

Shared TypeScript types used across frontend and backend.

#### UI (packages/ui)

Shared UI components (currently empty).

## Available Scripts

- `pnpm dev` - Start development servers
- `pnpm build` - Build all workspaces
- `pnpm lint` - Lint all workspaces
- `pnpm clean` - Clean node_modules and build artifacts

## Deployment

Each application can be deployed independently:

- Frontend: Can be deployed to Vercel, Netlify, or any static hosting platform
- Backend: Can be deployed to any Node.js hosting platform (Vercel, Render, etc.)

## Learn More

To learn more about the technologies used in this project:

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [pnpm Documentation](https://pnpm.io/motivation)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)