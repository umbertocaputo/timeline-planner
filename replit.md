# Planner Nastri Lavorativi — replit.md

## Overview

This is a **work schedule planner** (Planner Nastri Lavorativi) — an Italian-language scheduling/Gantt chart tool for managing work "nastri" (work strips/shifts). Users upload activity data from Excel files, which gets stored in a PostgreSQL database and displayed as an interactive Gantt-style timeline.

Core features:
- Excel file upload and parsing to import activity data
- Interactive Gantt chart timeline (04:00–23:59) with drag-and-drop
- Activities ("attività") grouped into work strips ("nastri") displayed as rows
- Drag activities between nastri, or merge nastri together
- Filtering controls: hide "Sosta" or "Tempo Accessorio" types, filter by max duration or minimum pause
- Sort nastri by name or start time
- Color-coded activities based on origin/destination localities

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Structure
The project uses a **monorepo layout** with three main directories:
- `client/` — React frontend (Vite)
- `server/` — Express backend (Node.js)
- `shared/` — Shared TypeScript types, DB schema, and API route definitions

This co-location pattern means the frontend and backend share type definitions directly, avoiding duplication and keeping API contracts in sync.

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side routing); single page with a Dashboard at `/`
- **State/Data fetching**: TanStack Query (React Query v5) for server state; local React state for UI controls
- **UI Components**: shadcn/ui component library (Radix UI primitives + Tailwind CSS)
- **Drag and Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers` for Gantt chart interactions
- **Excel parsing**: `xlsx` library parses uploaded `.xlsx` files client-side before sending data to the server
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support via `dark` class)
- **Fonts**: Plus Jakarta Sans (body), JetBrains Mono (code/mono)

### Backend Architecture
- **Framework**: Express.js running on Node.js with TypeScript (via `tsx`)
- **API style**: REST endpoints defined in `shared/routes.ts` using Zod schemas for validation
- **Dev server**: Vite middleware is integrated into Express in development (`server/vite.ts`), serving the React app with HMR
- **Production**: Static files served from `dist/public` after a Vite + esbuild build

### Data Layer
- **Database**: PostgreSQL via `pg` (node-postgres)
- **ORM**: Drizzle ORM (`drizzle-orm/node-postgres`) with schema defined in `shared/schema.ts`
- **Migrations**: Drizzle Kit (`drizzle-kit push`) manages schema migrations
- **Storage pattern**: `IStorage` interface + `DatabaseStorage` class in `server/storage.ts` decouples DB logic from route handlers

### Database Schema
Single table: `attivita`
| Column | Type | Notes |
|---|---|---|
| `id` | serial | Primary key |
| `nastro_id` | text | Work strip identifier |
| `id_punto_origine` | text | Origin stop/location |
| `id_punto_destinazione` | text | Destination stop/location |
| `orario_inizio_attivita` | text | Start time (ISO string) |
| `orario_fine_attivita` | text | End time (ISO string) |
| `tipo_attivita` | text | Activity type (e.g., "Sosta", "Tempo Accessorio") |
| `id_corsa` | text | Optional run/trip ID |

### Shared API Contract
`shared/routes.ts` exports an `api` object describing all endpoints with Zod-validated inputs and outputs. Both client hooks and server route handlers import from this file, keeping types synchronized without code generation.

Key API endpoints:
- `GET /api/attivita` — list all activities
- `POST /api/attivita/bulk` — bulk create activities (used after Excel import)
- `PUT /api/attivita/:id` — update a single activity
- `DELETE /api/attivita/:id` — delete a single activity
- `POST /api/attivita/move-nastro` — reassign all activities from one nastro to another
- `DELETE /api/attivita` — clear all activities

### Build System
- Development: `tsx server/index.ts` runs the Express server with Vite middleware
- Production build: `script/build.ts` runs Vite (client) then esbuild (server bundle as `.cjs`); key server dependencies are bundled into the output to reduce cold-start syscalls

## External Dependencies

### Database
- **PostgreSQL** — required, connection via `DATABASE_URL` environment variable
- Provisioned separately; the app will throw on startup if `DATABASE_URL` is not set

### Key npm Packages
| Package | Purpose |
|---|---|
| `drizzle-orm` + `pg` | Database ORM and PostgreSQL driver |
| `drizzle-kit` | Schema migrations (`db:push`) |
| `express` | HTTP server framework |
| `vite` + `@vitejs/plugin-react` | Frontend build and dev server |
| `@tanstack/react-query` | Server state management on client |
| `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers` | Drag-and-drop for Gantt chart |
| `xlsx` | Excel file parsing (client-side) |
| `zod` + `drizzle-zod` | Runtime validation and schema inference |
| `wouter` | Lightweight client-side routing |
| `date-fns` | Date/time manipulation |
| `tailwindcss` + `@radix-ui/*` | UI styling and accessible component primitives |
| `class-variance-authority` + `clsx` + `tailwind-merge` | Conditional class utilities |
| `lucide-react` | Icon library |

### Replit-Specific Plugins
In development on Replit, these Vite plugins are conditionally loaded:
- `@replit/vite-plugin-runtime-error-modal` — overlay for runtime errors
- `@replit/vite-plugin-cartographer` — Replit code navigation
- `@replit/vite-plugin-dev-banner` — Replit dev banner

These are only active when `process.env.REPL_ID` is defined and `NODE_ENV !== 'production'`.