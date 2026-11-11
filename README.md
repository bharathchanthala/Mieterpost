# Mieterpost

An AI inbox assistant for landlords. Tenant messages come in, an AI agent
classifies them and drafts a reply, and the landlord approves it.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- PostgreSQL, Drizzle ORM
- shadcn/ui components
- Planned: LLM agent with tool calling, Inngest durable workflows

## Getting started

1. Install dependencies: `npm install`
2. Create a database: `createdb -U postgres mieterpost` (or use pgAdmin).
3. Copy `.env.example` to `.env.local` and set your PostgreSQL password.
4. Create the tables: `npm run db:push`
5. Add demo data: `npm run db:seed`
6. Start the app: `npm run dev` and open http://localhost:3000

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
- [ ] 3. AI agent (classify, look up tenant data, draft reply)
- [ ] 4. Durable workflow (approval, send, follow-up)
- [ ] 5. Auth, polish, deploy
