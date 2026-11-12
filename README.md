# Mieterpost

An AI inbox assistant for landlords. Tenant messages come in, an AI agent
classifies them and drafts a reply, and the landlord approves it.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- PostgreSQL, Drizzle ORM
- shadcn/ui components
- Vercel AI SDK with Gemini (structured output and tool calling)
- Inngest durable workflows (send reply, wait, flag follow-up)
- Password login with a signed, HTTP-only session cookie (jose)

## Getting started

1. Install dependencies: `npm install`
2. Create a database: `createdb -U postgres mieterpost` (or use pgAdmin).
3. Copy `.env.example` to `.env.local` and set your PostgreSQL password, Gemini API key,
   a login password (`APP_PASSWORD`) and a session secret (`SESSION_SECRET`).
4. Create the tables: `npm run db:push`
5. Add demo data: `npm run db:seed`
6. Start the app: `npm run dev` and open http://localhost:3000
7. In a second terminal, start the workflow engine: `npx inngest-cli@latest dev`
   (dashboard at http://localhost:8288)

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run typecheck` | Check types without building |
| `npm run db:push` | Sync `src/db/schema.ts` to the database |
| `npm run db:seed` | Reset the database to fictional demo data |
| `npm run db:studio` | Browse the database in Drizzle Studio |

## Data model

`properties` 1→n `units` 1→n `tenants` 1→n `messages`

## Roadmap

- [x] 1. Setup and data model
- [x] 2. Dashboard UI (inbox, message detail, tenants and units)
- [x] 3. AI agent (classify, look up tenant data, draft reply)
- [x] 4. Durable workflow (approval, send, follow-up)
- [ ] 5. Auth, polish, deploy
