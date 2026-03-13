# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build → /dist
npm run preview    # Preview production build locally
```

Docker (optional):
```bash
docker-compose up --build   # Build and serve via Nginx on port 80
bash deploy.sh user@host     # Deploy to remote VPS over SSH
```

No test runner or linter is configured in this project.

## Environment

Fill in `.env.local`:
- `GEMINI_API_KEY` — Required for the AI HR Agent (`components/HRAgent.tsx`). Get from Google AI Studio.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — Optional. Without these, the app runs entirely in-memory (state resets on page reload).

## Architecture

**Flat file layout** — all source files live at the repo root and in `components/` and `lib/`. There is no separate `src/` directory.

**Entry points:**
- `index.html` → `index.tsx` → `App.tsx`
- TailwindCSS is loaded via CDN in `index.html` (not via npm).

**State management:** All app state lives in `App.tsx` via `useState`. Components receive data and callbacks as props (no global store, no Context API). `useMemo` is used for expensive derived state (payroll stats, task counts).

**Data layer (`lib/db.ts`):** Wraps Supabase CRUD operations. Every function checks `isSupabaseConfigured` first; if false, it no-ops and the caller falls back to local state. Tables: `empleados`, `prestamos`, `penalizaciones`, `nominas_semanales`, `tareas`.

**Supabase client (`lib/supabase.ts`):** Exports a single `supabase` client and the `isSupabaseConfigured` boolean.

**Key files:**

| File | Role |
|------|------|
| `App.tsx` | Root component; owns all state and tab routing |
| `types.ts` | All TypeScript interfaces (`Employee`, `Loan`, `Penalization`, `PayrollWeek`, `Task`, etc.) |
| `constants.tsx` | Mock/seed data and static constants |
| `utils.ts` | Pure utilities: `calculateLiquidation()` (Venezuelan LOTTT), `calculateSeniority()`, `formatCurrency()`, `isVenezuelanHoliday()` |
| `components/HRAgent.tsx` | Gemini API chat assistant; reads current app state as context |
| `components/LiquidationModule.tsx` | Severance calculator using `calculateLiquidation()` from `utils.ts` |

**Navigation tabs** (defined in `App.tsx`): TABLERO · PERSONAL · PAGOS · PRÉSTAMOS · PENALIZACIÓN · LIQUIDACIÓN · TASKS

## Domain Notes

- All UI text and business logic is in Spanish.
- Severance (`liquidación`) follows Venezuelan labor law: Article 92 LOTTT (double pay on dismissal), 30 days/year for `prestaciones sociales`, proportional vacation, bonuses.
- Venezuelan public holidays are hardcoded in `utils.ts → isVenezuelanHoliday()`.
- Currency formatting targets USD (`formatCurrency` in `utils.ts`).
- Attendance statuses per day: `worked` | `absent` | `holiday`.
- Employee statuses: `Activo` | `Despedido` | `Renunció` | `Suspendido`.
