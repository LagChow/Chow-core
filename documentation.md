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
- [11. Real-Time Sockets & Autonomous Dispatch Engine (`lagchow-sockets`)](#11-real-time-sockets--autonomous-dispatch-engine)
- [12. Embedded Valhalla Lagos Routing & Map Pipeline](#12-embedded-valhalla-lagos-routing--map-pipeline)

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


### Phase 5: Autonomous Dispatch, Lagos OSM Cropping & Embedded Valhalla Microservice
- **Specialized Microservice:** Established `lagchow-sockets` as a dedicated background and WebSocket gateway for dispatch operations.
- **Lagos-Only Geofabrik Crop:** Cropped Nigeria's 680 MB OSM extract using `osmium-tool` down to a 66.3 MB Lagos bounding box (`2.70, 6.35, 4.25, 6.75`), generating 28 routing tiles in 47.7 MB (`valhalla_tiles.tar`).
- **All-in-One Docker Image:** Built a single container running both the Valhalla C++ routing daemon (`localhost:8002`) and the Node.js Socket.io server (`port 3010`) with zero external tile dependencies.
- **Multi-Factor Dispatch Optimizer:** Programmed an autonomous candidate scorer balancing pickup delays, route detours, runner workloads, and SLA risk with sub-second computation and automatic Haversine fallback.

---

## 11. Real-Time Sockets & Autonomous Dispatch Engine (`lagchow-sockets`)

To maintain ultra-low latency without bloating the Next.js frontend applications, real-time telemetry, WebSocket rooms, and dispatch automation are extracted into a dedicated service: `lagchow-sockets`.

### Core Responsibilities
1. **Bidirectional Socket Gateway:** Manages isolated rooms for order updates (`order:${id}`), vendor order feeds (`vendor:${id}`), courier telemetry (`trekker:${id}`), and global admin alerts.
2. **Autonomous Dispatch Polling Loop:** Periodically evaluates unassigned pending orders, calculates optimal courier assignments using street-network routing, and fires candidate assignment events.
3. **Cross-Service Event Bridge (`POST /emit`):** Allows Next.js Server Actions to securely broadcast real-time events to connected clients via an internal secret (`INTERNAL_WS_SECRET`).

### Multi-Factor Dispatch Cost Formula
Candidates are evaluated against a multi-factor objective function:
$$\text{Cost} = w_1(\text{ArrivalToVendor}) + w_2(\text{PickupDelay}) + w_3(\text{IncrementalTime}) + w_4(\text{RouteDetour}) + w_5(\text{Workload}) + w_6(\text{SlaRisk})$$

- **Stage 1 (Pre-Filter):** Shortlists online couriers within maximum allowable pickup SLA window.
- **Stage 2 (Scoring):** Computes total route duration and detour overhead using live street distances.
- **Stage 3 (Assignment):** Streams `TREKKER_ASSIGNED` event with accept/reject timeout counters.

---

## 12. Embedded Valhalla Lagos Routing & Map Pipeline

LagChow eliminates third-party routing API costs and latency limits (e.g. Google Maps / Mapbox) by running a self-hosted **Valhalla C++ routing engine** inside the same container.

### Lagos-Only Map Extent Optimization
Compiling the entire Nigeria OpenStreetMap extract (~680 MB) exceeds standard cloud memory limits. The dataset is cropped strictly to the Lagos metropolitan boundary:

```powershell
# Bounding box: Min Lon: 2.70, Min Lat: 6.35, Max Lon: 4.25, Max Lat: 6.75
osmium extract --bbox=2.70,6.35,4.25,6.75 nigeria-latest.osm.pbf -o lagos.osm.pbf
```

| Metric | Whole Nigeria OSM | Lagos-Only Crop (`lagchow-sockets`) | Reduction |
|---|---|---|---|
| **Raw PBF Size** | 680.1 MB | 66.3 MB | **~90.2%** |
| **Compiled Tiles** | ~500 MB+ | 47.7 MB (28 tiles in `valhalla_tiles.tar`) | **~90.5%** |
| **Memory Footprint** | 2.5 GB+ RAM | ~400 - 600 MB RAM | **Production-Ready on Free/Cheap Tiers** |

### Single-Container Deployment Architecture
The `Dockerfile` builds upon `ghcr.io/gis-ops/docker-valhalla/valhalla:latest`, installs Node.js 20, bundles `custom_files/valhalla_tiles.tar`, and launches both services via `entrypoint.sh`:
- **Port 8002:** Valhalla C++ daemon serving JSON route queries locally.
- **Port 3010:** Node.js Express & Socket.io server handling external clients and dispatching routes.
