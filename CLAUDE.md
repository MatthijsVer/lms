# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Learning Management System (LMS) built with Next.js 15, TypeScript, Prisma, and Better Auth. The project features course creation, enrollment, AI-powered lesson generation, and Stripe payment integration.

## Key Technologies

- **Frontend**: Next.js 15.3.3 (with Turbopack), React 19, TypeScript
- **Database**: PostgreSQL with Prisma ORM (client generated at `lib/generated/prisma`)
- **Authentication**: Better Auth with email OTP and GitHub OAuth
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Payment**: Stripe integration
- **Storage**: AWS S3-compatible storage (Tigris)
- **AI**: OpenAI integration for lesson content generation
- **Security**: Arcjet for bot protection

## Common Development Commands

```bash
# Install dependencies
npm install

# Run development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint

# Generate Prisma client (runs automatically after install)
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

## Project Architecture

### Directory Structure

- **`/app`**: Next.js 15 app directory with route groups
  - `(auth)`: Authentication routes (login, verify)
  - `(public)`: Public-facing routes (course catalog, homepage)
  - `admin`: Admin dashboard for course management
  - `dashboard`: Student dashboard for enrolled courses
  - `api`: API routes for auth, AI, S3, and webhooks

- **`/components`**: Reusable UI components
  - `ui/`: shadcn/ui components (auto-generated)
  - `content-blocks/`: Modular lesson content components
  - `rich-text-editor/`: Tiptap-based editor
  - `ai/`: AI chat interface for lessons

- **`/lib`**: Core utilities and services
  - `auth.ts`: Better Auth configuration
  - `db.ts`: Prisma client instance
  - `stripe.ts`: Stripe client setup
  - `content-blocks.ts`: Content block type definitions
  - `services/lesson-ai.service.ts`: OpenAI integration for lesson generation

### Authentication Flow

1. Better Auth handles authentication with email OTP and GitHub OAuth
2. Middleware (`middleware.ts`) protects admin routes
3. Session validation uses Better Auth's cookie system
4. Admin role check via `require-admin.ts`

### Content Block System

The app uses a modular content block system for lessons:
- VIDEO, TEXT, IMAGE, QUIZ, EXERCISE, CODE, PDF, AUDIO, DOWNLOAD, FILL_IN_BLANK, FLASHCARD
- Each block type has dedicated editor and renderer components
- Content stored as JSON in the database

### AI Integration

AI lesson generation is powered by OpenAI GPT-4:
- Interactive conversation flow to gather requirements
- Generates structured lesson content with multiple block types
- Validates generated content against Zod schemas

## Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Auth secret key
- `BETTER_AUTH_URL`: Base URL (e.g., http://localhost:3000)
- `AUTH_GITHUB_ID/SECRET`: GitHub OAuth credentials
- `ARCJET_KEY`: Bot protection key
- `RESEND_API_SECRET_KEY`: Email service
- `AWS_*`: S3-compatible storage credentials
- `STRIPE_SECRET_KEY`: Stripe API key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `OPENAI_API_KEY`: OpenAI API key (if using AI features)

## Database Schema

Key models in Prisma schema:
- **User**: Auth users with role support
- **Course**: Course metadata with status (Draft/Published/Archived)
- **Chapter**: Course sections
- **Lesson**: Individual lessons with content blocks
- **ContentBlock**: Flexible content storage
- **Enrollment**: User course enrollments
- **LessonProgress**: Progress tracking
- **QuizAttempt**: Quiz scoring and attempts

## Development Notes

- The app uses the new Next.js 15 app directory structure
- Turbopack is enabled for faster development builds
- Prisma client is generated to `lib/generated/prisma` to avoid Next.js issues
- File uploads use presigned S3 URLs
- Payment processing uses Stripe's price IDs stored in the database
- The project includes comprehensive TypeScript types and Zod validation

## Key Features

1. **Course Management**: Create, edit, and organize courses with chapters and lessons
2. **Content Authoring**: Rich content blocks including quizzes, videos, and interactive elements
3. **AI Assistant**: Generate lesson content through conversational AI
4. **Progress Tracking**: Track student progress and quiz scores
5. **Payment Integration**: Stripe-powered course purchases
6. **Responsive Design**: Mobile-friendly with sidebar navigation