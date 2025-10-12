# Repository Guidelines

## Project Structure & Module Organization
Marshal LMS is a Next.js App Router project. Route segments for auth, dashboard, public marketing, and API handlers live under `app/`. Shared layouts, metadata, and global styles sit alongside those routes. Feature-specific UI elements live in `components/`, with base primitives under `components/ui`. Client-only helpers belong in `hooks/`, while cross-cutting logic such as Prisma, auth, AI integrations, S3, and Stripe utilities stay in `lib/`. Domain models are declared in `prisma/schema.prisma`, with migrations stored adjacent. Static assets and icons go in `public/`.

## Build, Test, and Development Commands
Run `npm install` to sync dependencies (the repo tracks `package-lock.json`). Use `npm run dev` to launch Turbopack on http://localhost:3000 and watch Prisma logs. Ship-ready builds require `npm run build`, followed by `npm run start` for a production smoke test. Run `npm run lint` before opening a PR. Update the Prisma client with `npx prisma generate`, and apply schema changes locally using `npx prisma migrate dev --name <change>`.

## Coding Style & Naming Conventions
Author TypeScript functional components with named exports and colocate helpers next to their features. Follow 2-space indentation, trailing commas, and single quotes in TS/TSX (string literals in JSX props may stay double quoted). Prefer the `cn` utility for Tailwind class composition, ordering utilities roughly layout → spacing → color. Extend existing `components/ui` primitives before adding new variants.

## Testing Guidelines
Automated tests are not yet enabled, so include manual verification steps when relevant. Future tests should use React Testing Library, named `<feature>.test.ts[x]` inside a nearby `__tests__/` directory. Verify Prisma migrations locally and ensure the generated client files are committed.

## Commit & Pull Request Guidelines
Write imperative commit subjects under 72 characters, add contextual bodies, and reference issues with `Closes #<id>` where applicable. Include screenshots or recordings for UI work and call out any database or environment impacts. Before requesting review, confirm `npm run build` and `npm run lint` succeed and share manual test notes.

## Security & Configuration Tips
Copy `.env.example` to `.env` and supply the required `DATABASE_URL`, Stripe, OpenAI, GitHub OAuth, and S3 keys. Never commit `.env*` files or credentials; rotate third-party tokens after testing and clear temporary uploads from shared buckets.
