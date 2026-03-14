# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                    # Install dependencies (use --legacy-peer-deps if peer conflicts)
npm run dev                    # Start dev server at http://localhost:3000
npm run build                  # Production build (outputs to dist/)
npm run preview                # Preview production build
```

No test runner is configured in this project.

## Production Deployment

- **Live URL**: `https://nomini-1.vercel.app`
- **Platform**: Vercel (auto-deploys on push to `main` branch of `https://github.com/AKILMAXX/NOMINI1`)
- **Database**: Supabase cloud — `https://rpnqbyfoajzgsuibxkpy.supabase.co`
- Env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY` are set in Vercel dashboard (not in repo)

**Critical**: Always stage `package.json` in commits. Vercel runs `npm ci` from scratch — if `package.json` is unstaged, dependencies added locally won't be available in production and the build will fail with module-not-found errors.

## Environment Variables

Create/edit `.env.local` with:

```
GEMINI_API_KEY=your_key_here         # Required for HRAgent (AI features)
VITE_SUPABASE_URL=your_url           # Optional: enables cloud persistence
VITE_SUPABASE_ANON_KEY=your_key      # Optional: enables cloud persistence
```

Without Supabase vars, the app runs fully in-memory using seed data from `constants.tsx`.

## Architecture

**PeopleCore** is a Venezuelan payroll & HR management SPA. Tech stack: React 19 + TypeScript + Vite + Tailwind CSS. No routing library — navigation is tab-based state in `App.tsx`.

### Data Flow

```
App.tsx (root state)
  ├── constants.tsx   — seed data (INITIAL_EMPLOYEES, MOCK_HISTORY, DEPARTMENTS)
  ├── types.ts        — all TypeScript interfaces (Employee, Loan, Penalization, Task, PayrollWeek, etc.)
  ├── utils.ts        — pure calculations (payroll math, liquidation, Venezuelan holidays)
  └── lib/
      ├── supabase.ts — Supabase client (null when not configured)
      └── db.ts       — async CRUD functions; no-ops when Supabase is absent
```

All state lives in `App.tsx`. Supabase syncs on mount (`fetchEmployees`, `fetchLoans`, etc.) and on mutations (`upsertEmployee`, `upsertLoan`, etc.). When `isSupabaseConfigured` is false, the app is purely local/in-memory.

### Navigation Tabs → Components

| Tab key | Component | Purpose |
|---|---|---|
| `TABLERO` | `DashboardModule` | KPI overview, charts, birthday alerts |
| `PERSONAL` | `EmployeeCard` (list) | Attendance tracking, status changes, weekly cycle close |
| `PAGOS` | inline in App | Payroll history; opens `WeekDetailModal` |
| `PRESTAMOS` | `LoansModule` | Employee loan management |
| `PENALIZACION` | `PenalizationsModule` | Disciplinary deductions |
| `LIQUIDACION` | `LiquidationModule` | Severance calculation (LOTTT law) |
| `TASKS` | `TasksModule` | Task assignment per employee |

### Payroll Calculation Logic (`utils.ts`)

- **Weekly cycle**: 6 working days (Mon–Sat). `dailyRate = baseWeeklySalary / 6`.
- **Holiday pay**: worked holidays count double (`dailyRate * 2`).
- **Extra hours**: 1.5× hourly rate (`dailyRate / 8 * 1.5`).
- **Liquidation** follows Venezuelan LOTTT law: severance (30 days/year) + proportional vacation + utilidades + indemnity (doubled for `Despedido` status).
- `finalizeWeek()` in App.tsx closes the payroll cycle: advances loan/penalization installments, creates a `PayrollWeek` record, resets extra hours.

### Supabase Table Names

DB tables use Spanish snake_case names: `empleados`, `prestamos`, `penalizaciones`, `nominas_semanales`, `tareas`. Mappers in `lib/db.ts` convert between snake_case DB columns and camelCase TypeScript types.

### Key Types (`types.ts`)

- `Employee` — includes `birthdayDate?: string` (`'YYYY-MM-DD'`) for birthday reminders
- `Task` — `{ id, employeeId, title, description?, frequency: 'única'|'semanal'|'mensual', reviewDay?, dueDate?, status: 'pending'|'in_progress'|'done', createdAt }`
- `EmployeeStatus` — `'Activo' | 'Despedido' | 'Renunció' | 'Suspendido'`

### Styling

Tailwind CSS via CDN (no `tailwind.config.js` — config is inline in `index.html`). Custom CSS variables in `index.css`: `--color-charcoal: #1A1A1E`, `--color-charcoal-darker: #09090b`. Color tokens `electric` (`#8b5cf6`), `emerald`, `crimson`, `gold` map to Tailwind `theme.extend.colors` in `index.html`. Dark/light theme toggled via `dark` class on `<html>`.

`.bento-card` utility class in `index.css` is the standard card container for all modules.

### Path Alias

`@` resolves to the project root (configured in `vite.config.ts`).

---

## Technology Constraints

**Usar exclusivamente estas tecnologías. No agregar dependencias externas sin justificación técnica explícita.**

### Frontend (fijo)
| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.0.0 | UI framework |
| TypeScript | ~5.8 | Tipado estático |
| Vite | ^6.2 | Build tool + dev server |
| Tailwind CSS | CDN (`cdn.tailwindcss.com`) | Estilos — **sin archivo tailwind.config.js**, configurado inline en `index.html` |
| IBM Plex Sans | Google Fonts | Fuente principal |
| Material Symbols Outlined | Google Fonts | Iconos legacy (algunos componentes) — preferir Lucide React para código nuevo |
| Framer Motion | 11.0.8 | Animaciones |
| Lucide React | ^0.577.0 | Iconos principales |
| Recharts | 2.12.7 | Gráficas y dashboards |
| html-to-image | 1.11.11 | Exportar reportes a PNG |
| jsPDF | 2.5.1 | Exportar a PDF |

### AI / Servicios externos
| Tecnología | Uso |
|---|---|
| `@google/genai` ^1.37.0 | HRAgent — Gemini API (servicio externo, no dockerizable) |

### Backend / Persistencia y Autenticación
| Tecnología | Uso |
|---|---|
| `@supabase/supabase-js` ^2.99.1 | Cliente Supabase — DB + Auth |
| PostgreSQL 15 | Base de datos |
| PostgREST v12 | REST API sobre PostgreSQL |
| GoTrue v2 (`supabase/gotrue`) | Autenticación — email/password, sesiones JWT |

### Infraestructura
| Tecnología | Uso |
|---|---|
| Node.js 20 Alpine | Build stage + dev server |
| Nginx Alpine | Servir SPA en producción + API gateway local |
| Docker + Docker Compose | Containerización |
| pgAdmin 4 | UI de PostgreSQL en dev local |

### Prohibido (sin discusión previa)
- Librerías de estado: Redux, Zustand, Jotai, etc. (el estado vive en `App.tsx`)
- Routers: React Router, TanStack Router (navegación por tabs con `useState`)
- Component libraries: shadcn/ui, MUI, Ant Design, Chakra, etc.
- Otras librerías de iconos (usar Lucide React)
- Otras librerías de gráficas (usar Recharts)
- CSS-in-JS, Sass, Less (usar Tailwind + CSS variables en `index.css`)
- Otros clientes de AI (usar `@google/genai`)

---

## Docker Compose — Stack local completo

Levanta PostgreSQL + PostgREST + Nginx gateway + pgAdmin + App en dev.
**Todo dato persistente se guarda en `./DATA/`** (en `.gitignore`).

```bash
# Primera vez — inicializar directorios de datos
mkdir -p DATA/postgres DATA/pgadmin

# Levantar stack completo (dev)
docker compose up -d

# Ver logs de la app
docker compose logs -f nomini-dev

# Reconstruir si cambia package.json
docker compose build nomini-dev && docker compose up -d nomini-dev

# Levantar modo producción (Nginx, imagen compilada)
docker compose --profile prod up -d

# Parar todo
docker compose down

# Limpiar datos (reset DB)
docker compose down -v && rm -rf DATA/postgres DATA/pgadmin
```

### Puertos locales
| Puerto | Servicio |
|---|---|
| `3000` | App en dev (hot-reload Vite) |
| `8000` | API gateway nginx → PostgREST (`VITE_SUPABASE_URL` local) |
| `5050` | pgAdmin — `admin@nomini.local` / `admin` |
| `5432` | PostgreSQL — user: `postgres` |

### Variables de entorno para Docker
El `docker-compose.yml` usa valores por defecto para desarrollo local. Sobreescribir en `.env.local` si es necesario:

```
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
ANON_KEY=<JWT firmado con JWT_SECRET, rol=anon>
POSTGRES_PASSWORD=nomini-local-db-password
GEMINI_API_KEY=tu_clave_gemini   # requerida, sin default
```

Las claves `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local` siguen siendo usadas para el deploy en **Vercel/cloud** (Supabase cloud). El docker-compose usa las variables locales independientemente.

### Archivos de infraestructura
| Archivo | Propósito |
|---|---|
| `Dockerfile` | Build multi-stage para producción (Node → Nginx) |
| `Dockerfile.dev` | Dev server con hot-reload |
| `docker-compose.yml` | Stack completo local |
| `gateway/nginx.conf` | Nginx como API gateway — ruteando `/rest/v1/*` y `/auth/v1/*` |
| `db/init/00-roles.sql` | Extensiones + roles de PostgreSQL |
| `db/init/01-schema.sql` | Tablas de la app + permisos |

---

## Autenticación

El flujo de auth usa **Supabase Auth (GoTrue)** exclusivamente vía `@supabase/supabase-js`.

### Flujo
1. `App.tsx` verifica la sesión al montar (`supabase.auth.getSession()`)
2. Si Supabase no está configurado → la app corre sin auth (modo in-memory)
3. Si hay sesión → muestra la app normal
4. Sin sesión → muestra `LoginScreen` (email/password)
5. Login exitoso → GoTrue emite JWT → `onAuthStateChange` actualiza la sesión → app carga
6. Logout → `supabase.auth.signOut()` limpia la sesión → vuelve a `LoginScreen`

### Reglas
- No implementar auth propio ni JWT manual — solo `supabase.auth.*`
- No usar cookies manuales ni `localStorage` para sesiones
- El JWT emitido por GoTrue es validado automáticamente por PostgREST (mismo `JWT_SECRET`)
