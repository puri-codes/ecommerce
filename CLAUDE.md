# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js)
npm run build    # Production build
npm run start    # Run production server
npm run lint     # ESLint
npm run clean    # Remove .next/ directory
```

No test suite is configured.

## Architecture

**Stack:** Next.js 15 (App Router) + TypeScript + PostgreSQL (Neon serverless) + Tailwind CSS v4 + Zustand

### Data sources — two separate layers

There are two distinct product data sources that do NOT share data:

1. **`lib/data.ts`** — hardcoded array of 16 demo products. Used by the home page and static product detail pages (`/product/[slug]`). `generateStaticParams()` in `app/product/[slug]/page.tsx` derives slugs from this file.
2. **PostgreSQL (`lib/db.ts`)** — live database accessed via `/api/products`. Used exclusively by the admin dashboard. Products created/edited in admin do NOT appear in the storefront.

### API routes (`app/api/`)

| Route | Purpose |
|---|---|
| `POST /api/admin/login` | Validates credentials, creates 7-day session token in DB, sets httpOnly cookie |
| `POST /api/admin/logout` | Deletes session from DB |
| `GET /api/products` | Fetch all products from PostgreSQL |
| `POST /api/products` | Create product + triggers `pg_notify('product_update', ...)` |
| `PUT /api/products/[id]` | Update product + triggers notify |
| `DELETE /api/products/[id]` | Delete product + triggers notify |
| `GET /api/realtime-products` | SSE stream — listens to PostgreSQL `NOTIFY` and pushes events to connected clients |

### Real-time updates

The admin dashboard uses **Server-Sent Events** + **PostgreSQL NOTIFY/LISTEN**. When a product is mutated via the API, `pg_notify` fires, the SSE route picks it up and pushes the updated product list to all connected admin clients. The SSE connection lives in `app/api/products/realtime-products/route.ts`.

### Auth

Admin-only. Session tokens stored in the `admin_sessions` table. Passwords hashed with PBKDF2-SHA512 (per-user salt). The session cookie (`admin_session`) is httpOnly. API routes validate the cookie directly against the DB; there is no middleware file — each protected route calls `lib/db.ts` helpers inline.

### State management

- **Cart:** Zustand store (`lib/store.ts`) with localStorage persistence under the key `minna-cart`.
- **Orders:** Saved to localStorage as `order_confirmation` on checkout completion; no server-side order storage.
- **Admin session:** Server-side only (DB + cookie).

### Component layout

`SiteShell` (`components/site-shell.tsx`) wraps every page and renders `Navbar`, `Footer`, and `CartDrawer`. It is mounted in `app/layout.tsx` and receives children as props.

## Environment variables

```
DATABASE_URL=       # Neon PostgreSQL connection string (pooled)
ADMIN_EMAIL=        # Initial admin email
ADMIN_PASSWORD=     # Initial admin password (plaintext; hashed on first DB write)
```

See `.env.example` for the template. The `.env.example` also lists `GEMINI_API_KEY` and `APP_URL` from the AI Studio scaffold, but these are not currently used in the codebase.

## Database schema

Three tables managed in `lib/db.ts` (created via `initDatabase()` which is called at API route startup):

- `admin_users` — id, email, password_hash, salt
- `admin_sessions` — id, user_id, token, expires_at
- `products` — id, name, price, description, category, sizes (JSONB), images (JSONB), created_at

Raw SQL via the `pg` package — no ORM.

## Next.js config notes

- Image domains allowed: `picsum.photos`, `images.unsplash.com`
- Output mode: `standalone` (for containerized deployment)
- `motion` package is transpiled via `transpilePackages`
- ESLint errors are ignored during `next build`; TypeScript errors are not
