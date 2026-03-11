# Planner Nastri Lavorativi — replit.md

## Overview

This is a **work schedule planner** (Planner Nastri Lavorativi) — an Italian-language scheduling/Gantt chart tool for managing work "nastri" (work strips/shifts). Users upload activity data from Excel files, which gets stored in a PostgreSQL database and displayed as an interactive Gantt-style timeline.

Core features:
- Excel file upload and parsing to import activity data
- Interactive Gantt chart timeline (04:00–23:59) with drag-and-drop
- Activities ("attività") grouped into work strips ("nastri") displayed as rows
- Drag activities between nastri, or merge nastri together
- Filtering controls: hide "Sosta" or "Tempo Accessorio" types
- Sort nastri by name or start time
- Color-coded activities (golden ratio hue distribution based on locality name)
- **Smart merge suggester**: lightbulb button per row finds compatible nastri respecting duration and pause constraints
- **Bridge corsa support**: when transiti are loaded, merge suggestions include nastri reachable via a connecting corsa (bridge corsa displayed in Gantt as yellow background + red border)
- Mismatch indicators: red accent bar + background for rows where start/end locations differ; triangles between mismatched consecutive activities
- Tempo Accessorio pruning on merge: trailing TA removed from target nastro, leading TA removed from source nastro

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Structure
The project uses a **monorepo layout** with three main directories:
- `client/` — React frontend (Vite)
- `server/` — Express backend (Node.js)
- `shared/` — Shared TypeScript types, DB schema, and API route definitions

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side routing); single page with a Dashboard at `/`
- **State/Data fetching**: TanStack Query (React Query v5) for server state; local React state for UI controls
- **UI Components**: shadcn/ui component library (Radix UI primitives + Tailwind CSS)
- **Drag and Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`
- **Excel parsing**: `xlsx` library parses uploaded `.xlsx` files client-side before sending data to the server
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support via `dark` class)
- **Fonts**: Plus Jakarta Sans (body), JetBrains Mono (code/mono)

### Backend Architecture
- **Framework**: Express.js running on Node.js with TypeScript (via `tsx`)
- **API style**: REST endpoints defined in `shared/routes.ts` using Zod schemas for validation
- **Dev server**: Vite middleware is integrated into Express in development (`server/vite.ts`)
- **Production**: Static files served from `dist/public` after a Vite + esbuild build

### Data Layer
- **Database**: PostgreSQL via `pg` (node-postgres)
- **ORM**: Drizzle ORM (`drizzle-orm/node-postgres`) with schema defined in `shared/schema.ts`
- **Migrations**: Drizzle Kit (`drizzle-kit push`) manages schema migrations
- **Storage pattern**: `IStorage` interface + `DatabaseStorage` class in `server/storage.ts`

### Database Schema

**`attivita`** — work activities
| Column | Type | Notes |
|---|---|---|
| `id` | serial | Primary key |
| `nastro_id` | text | Work strip identifier |
| `id_punto_origine` | text | Origin stop/location |
| `id_punto_destinazione` | text | Destination stop/location |
| `orario_inizio_attivita` | text | Start time (ISO string) |
| `orario_fine_attivita` | text | End time (ISO string) |
| `tipo_attivita` | text | Activity type |
| `id_corsa` | text | Optional run/trip ID |
| `is_bridge_corsa` | boolean | Whether this is a bridge corsa inserted on merge |

**`transiti`** — stop times for each service corsa
| Column | Type | Notes |
|---|---|---|
| `id` | serial | Primary key |
| `id_corsa` | text | Trip/run identifier |
| `id_punto` | text | Stop/location name |
| `sequenza` | integer | Stop sequence in this corsa |
| `orario_arrivo` | text | Arrival time (ISO string) |
| `orario_partenza` | text | Departure time (ISO string) |
| `salita_discesa_passeggeri` | text | Passenger boarding/alighting flag |

### Shared API Contract

Key API endpoints:
- `GET /api/attivita` — list all activities
- `POST /api/attivita/bulk` — bulk create (after Excel import)
- `PUT /api/attivita/:id` — update a single activity
- `DELETE /api/attivita/:id` — delete a single activity
- `PUT /api/nastri/:oldNastroId/move/:newNastroId` — reassign all activities from one nastro to another
- `POST /api/nastri/merge` — smart merge: strips TA, moves activities, optionally inserts bridge corsa
- `DELETE /api/attivita` — clear all activities
- `GET /api/transiti` — list all transiti
- `POST /api/transiti/bulk` — bulk create transiti
- `DELETE /api/transiti` — clear all transiti

### Bridge Corsa Algorithm
When `transitiByCorsa` is available in `NastroRow`, the suggestion engine for each candidate nastro:
1. Checks if `candidateFirst.idOrigine !== current.last.idDestinazione`
2. If different: calls `findBridgeCorsa(transitiByCorsa, endLoc, startLoc, minDeparture, maxArrival)` where:
   - `minDeparture = nastroEndTime + pausaMinimaMs`
   - `maxArrival = candidateFirstCorsaStart - pausaMinimaMs`
3. Iterates all corse, finds a corsa that stops at `endLoc` then later at `startLoc` within the time window
4. Displays the bridge corsa info in the popover suggestion with yellow styling
5. On merge: backend inserts a `tipoAttivita = "corsa ponte"` / `isBridgeCorsa = true` activity

### Build System
- Development: `tsx server/index.ts` runs the Express server with Vite middleware
- Production build: `script/build.ts` runs Vite (client) then esbuild (server bundle as `.cjs`)

## External Dependencies

### Database
- **PostgreSQL** — required, connection via `DATABASE_URL` environment variable

### Key npm Packages
| Package | Purpose |
|---|---|
| `drizzle-orm` + `pg` | Database ORM and PostgreSQL driver |
| `drizzle-kit` | Schema migrations (`db:push`) |
| `express` | HTTP server framework |
| `vite` + `@vitejs/plugin-react` | Frontend build and dev server |
| `@tanstack/react-query` | Server state management on client |
| `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers` | Drag-and-drop |
| `xlsx` | Excel file parsing (client-side) |
| `zod` + `drizzle-zod` | Runtime validation and schema inference |
| `wouter` | Lightweight client-side routing |
| `tailwindcss` + `@radix-ui/*` | UI styling and accessible component primitives |
| `lucide-react` | Icon library |
