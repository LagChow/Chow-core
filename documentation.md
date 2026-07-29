# 🍔 LagChow — Campus Food Delivery Ecosystem

> **A real-time, multi-platform campus food delivery network connecting students, local vendors, and student riders through a unified monorepo ecosystem.**

**Status**: 🟢 Live (MVP)  
**Last Updated**: 2026-07-29  
**Monorepo**: Turborepo + pnpm  

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Architecture](#2-architecture)
- [3. Tech Stack](#3-tech-stack)
- [4. Monorepo Structure](#4-monorepo-structure)
- [5. Core Feature — Real-Time Order Lifecycle](#5-core-feature--real-time-order-lifecycle)
- [6. Master Kill Switches & Interceptors](#6-master-kill-switches--interceptors)
- [7. Database Schema](#7-database-schema)
- [8. Design System](#8-design-system)
- [9. Development Setup](#9-development-setup)
- [10. Build Log / Workflow Journey](#10-build-log--workflow-journey)

---

## 1. Project Overview

### What Is This?

LagChow is an end-to-end food delivery platform tailored specifically for university campuses (starting with UNILAG). It orchestrates four distinct user experiences from a single, centralized backend:

1. **Customer Storefront:** Where students discover vendors, build carts, and track deliveries to specific hostel rooms.
2. **Vendor Dashboard:** Where kitchen staff manage menus, accept incoming orders, and track revenue.
3. **Rider App:** Where campus runners receive delivery gigs and navigate to drop-off points.
4. **Admin Panel:** The overarching command center for platform health, onboarding, and emergency controls.

### The Magic Moment

> A student in Moremi Hall places an order. Instantly, the Vendor Dashboard chimes with a notification. The kitchen clicks "Accept", and the student's app live-updates to "Preparing." Once ready, a campus runner gets pinged, picks it up, and the student watches the runner's GPS dot move toward their hostel.

### Why This Stands Out (Portfolio Value)

| Interviewer Question | What Your Answer Demonstrates |
|---|---|
| "How do you manage 4 apps at once?" | Turborepo monorepo sharing a single Drizzle schema and Socket.io instance. |
| "What happens if the campus floods?" | The Admin panel has a global `maintenance_mode` kill switch that instantly intercepts and blocks all traffic across all apps. |
| "How is real-time handled?" | A shared `@lagchow/realtime` package wrapping Socket.io, providing a unified event bus for the whole ecosystem. |
| "How do you ensure UI consistency?" | A shared design system heavily utilizing Tailwind CSS, Lucide icons, and Glassmorphism paradigms. |

---

## 2. Architecture

### High-Level System Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Next.js)                       │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────┐  │
│  │ Customer App  │ │  Vendor App   │ │   Rider App   │ │ Admin   │  │
│  │ • Storefront  │ │ • Kitchen Mgmt│ │ • Delivery UI │ │ Panel   │  │
│  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └────┬────┘  │
└──────────┼─────────────────┼─────────────────┼──────────────┼───────┘
           │                 │                 │              │
┌──────────┼─────────────────┼─────────────────┼──────────────┼───────┐
│                        API & REAL-TIME LAYER                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      Next.js Server Actions                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              @lagchow/realtime (Socket.io Bus)                │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────┐
│                           DATA LAYER                                │
│  ┌──────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   Neon Postgres      │  │        Upstash / Redis              │  │
│  │   (Drizzle ORM)      │  │        (Socket.io Adapter)          │  │
│  │ • Orders & Users     │  │                                     │  │
│  │ • Platform Settings  │  │                                     │  │
│  └──────────────────────┘  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow — The Order Lifecycle

```text
Student checks out
       │
       ▼
┌─────────────────┐
│  Server Action  │ ← Validates cart, inserts into `orders` (Status: pending)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Socket Event   │ ← Emits `new_order` to Vendor's room
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Vendor App    │ ← Vendor sees order, clicks "Accept"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Server Action  │ ← Updates order to `preparing`
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Socket Event   │ ← Broadcasts update to Student & pings Riders
└─────────────────┘
```

---

## 3. Tech Stack

### Core Libraries

| Library | Purpose | Why This? |
|---|---|---|
| **Next.js 14+** | App Framework | Server Actions drastically reduce boilerplate API routes. |
| **Drizzle ORM** | Database ORM | Pure TypeScript, lightweight, excellent Edge compatibility. |
| **Socket.io** | Real-time Engine | Battle-tested bidirectional event streaming. |
| **Tailwind CSS** | Styling | Rapid UI prototyping with consistent design tokens. |

### Infrastructure

| Service | Purpose | Details |
|---|---|---|
| **Neon Postgres** | Relational Database | Serverless Postgres, scales to zero, perfect for edge environments. |
| **Vercel** | Hosting | Native support for Next.js App Router and Server Actions. |

---

## 4. Monorepo Structure

```text
lagChow/
├── apps/
│   ├── web/
│   │   ├── customer/        # Storefront for students
│   │   ├── vendor/          # Dashboard for restaurants
│   │   ├── rider/           # Interface for delivery runners
│   │   └── admin/           # Platform control center
│   │
│   └── mobile/              # (Planned) React Native ports
│
├── packages/
│   ├── database/            # Drizzle ORM schema and client
│   │   └── src/
│   │       ├── schema.ts    # Centralized source of truth
│   │       └── index.ts     # DB connection export
│   │
│   ├── realtime/            # Socket.io wrapper & hooks
│   ├── types/               # Shared TS interfaces
│   ├── ui/                  # (Planned) Shared component library
│   └── typescript-config/   # Shared tsconfig bases
│
├── documentation.md         # ← You are here
├── turbo.json               # Turborepo build orchestration
└── package.json
```

---

## 5. Core Feature — Real-Time Order Lifecycle

The system relies on a unified state machine mapped to the `orders.status` column. 

**Order States:**
`pending` → `accepted` → `preparing` → `out_for_delivery` → `delivered`

As the order moves through these states via Next.js Server Actions, the `@lagchow/realtime` package broadcasts events. Because the database schema (`packages/database`) is shared, the Customer App knows exactly what to display when the Vendor App mutates a row.

---

## 6. Master Kill Switches & Interceptors

LagChow features a centralized emergency control system managed via the Admin Panel.

### The Maintenance Mode Interceptor

Instead of manually taking down each site, the Admin can toggle a switch that saves `{ maintenance_mode: true }` to the `platform_settings` table. 

Both the Customer and Vendor apps implement a database check in their root `layout.tsx`:

```tsx
// apps/web/customer/app/layout.tsx
export default async function RootLayout({ children }) {
  const settings = await db.select().from(platformSettings).where(eq(platformSettings.key, 'maintenance_mode')).limit(1);
  const isMaintenanceMode = settings[0]?.value === true;

  return (
    <html>
      <body>
        {isMaintenanceMode ? (
          <MaintenanceScreen /> // Instantly blocks all routes!
        ) : (
          {children}
        )}
      </body>
    </html>
  );
}
```

---

## 7. Database Schema

### Entity Relationship Diagram

```text
┌──────────────────────┐     ┌──────────────────────┐
│       users           │     │       vendors        │
├──────────────────────┤     ├──────────────────────┤
│ id          (PK)     │     │ id           (PK)     │
│ email                │     │ name                  │
│ hallOfResidence      │     │ slug         (unique) │
│ isStudent            │     │ rating                │
└──────────┬───────────┘     │ status                │
           │                 └──────────┬───────────┘
           │                            │
           │      ┌─────────────────────┴┐
           └─────>│       orders         │<──────┐
                  ├──────────────────────┤       │
                  │ id          (PK)     │       │
                  │ userId      (FK)     │       │
                  │ vendorId    (FK)     │       │
                  │ riderId     (FK)     │       │
                  │ status               │       │
                  │ totalAmount          │       │
                  │ deliveryAddress(JSON)│       │
                  └──────────────────────┘       │
                                                 │
┌──────────────────────┐     ┌───────────────────┴──┐
│  platform_settings    │     │       riders         │
├──────────────────────┤     ├──────────────────────┤
│ id          (PK)     │     │ id           (PK)     │
│ key         (unique) │     │ userId       (FK)     │
│ value       (JSONB)  │     │ status                │
└──────────────────────┘     │ currentLat            │
                             │ currentLng            │
                             └──────────────────────┘
```

---

## 8. Design System

LagChow prioritizes a **premium, dynamic, and highly responsive** user experience tailored for a Gen-Z campus audience.

- **Typography:** **Geist Sans** for a clean, modern, and highly legible interface.
- **Color Palette:** Deep, immersive dark modes layered with vibrant, high-contrast accents (e.g., LagChow Yellow, Neon Greens for active status, Rich Reds for alerts).
- **UI Paradigms:** 
  - **Glassmorphism:** Extensive use of translucent backgrounds (`bg-white/5` or `bg-black/40`) with backdrop blurs to create depth.
  - **Micro-animations:** Smooth transitions on hover (`hover:scale-[1.02]`), animated slide-overs for modals (like the Cart Drawer and Address Selector).
  - **Rounded Geometry:** Consistent use of rounded corners (`rounded-xl`, `rounded-2xl`) for a friendly, approachable feel.
- **Iconography:** **Lucide React** for sharp, consistent, and lightweight vector icons.

---

## 9. Development Setup

```bash
# 1. Install dependencies at the root
pnpm install

# 2. Setup environment variables
# Copy .env.example to .env in packages/database and apps

# 3. Push schema to database
cd packages/database && pnpm exec drizzle-kit push

# 4. Run the entire monorepo simultaneously
pnpm dev
```

---

## 10. Build Log / Workflow Journey

### Phase 1: Customer Experience
- **Smart Campus Locations:** Built a sliding `DeliveryAddressModal` in the Customer app featuring 25+ predefined UNILAG locations. 
- **Instant Filtering:** Implemented a real-time search filter to narrow down locations as the user types.

### Phase 2: Vendor Onboarding & Management
- **Vendor Directory:** Created leaderboards in the Admin Panel to track restaurant performance (AOV, Total Orders).
- **Onboarding Flow:** Built a secure onboarding form capturing Basic Info, Shop Details, and Bank Account records (stored as JSONB).

### Phase 3: Platform Settings & Master Kill Switches
- **Database Infrastructure:** Introduced `platform_settings` and `broadcasts` tables to centralize global configurations.
- **The "Full Kill Switch":** Implemented a `maintenance_mode` toggle in the Admin Panel that acts as a global kill switch. 
- **App Interceptors:** Added database interceptors to the root `layout.tsx` of the Customer and Vendor apps to instantly block traffic when maintenance mode is active.

### Phase 4: Security & Health Checks
- **Dependency Audit:** Conducted a full `pnpm audit` across the workspace to identify vulnerabilities, catching and documenting outdated versions of `next`, `esbuild`, and `cookie`.
