# ReliefLens Architecture & Codebase Structure Documentation

## 1. System Overview

ReliefLens is a continuous disaster incident coordination, triage, and multi-channel field reporting platform. The application is engineered for high-stress operational resilience, supporting citizen voice reporting, deterministic multi-factor incident scoring, automated spatial clustering, duplicate detection, and offline report queue synchronization.

```
┌─────────────────────────────────────────────────────────────┐
│                       Presentation UI                       │
│  Pages (Dashboard, Map, ReportForm, Audit, Duplicates)      │
│  Components (Layout, Dashboard, Voice, Location, UI Common) │
└──────────────┬───────────────────────────────▲──────────────┘
               │                               │
               ▼                               │
┌──────────────────────────────┐ ┌─────────────┴──────────────┐
│       Custom Hooks           │ │    Error Boundary & Toast   │
│  useIncidents, useGeolocation│ │  ErrorBoundary.tsx         │
│  useOnlineStatus, useToast   │ │  ToastProvider             │
└──────────────┬───────────────┘ └────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Domain Services & API Layer                 │
│  dataService (Facade)                                       │
│  ├── apiClient & Supabase Edge Functions                    │
│  ├── offlineSyncService                                     │
│  └── reverseGeocodeCoordinates                              │
└──────────────┬───────────────────────────────▲──────────────┘
               │                               │
               ▼                               │
┌──────────────────────────────┐ ┌─────────────┴──────────────┐
│  Domain Rules & Scoring      │ │    Centralized Config      │
│  Scoring Engine (scoring.ts) │ │  env.ts (Vite env wrapper) │
│  Duplicate Match (duplicate) │ │  Typed app, map, AI config │
│  Zod Schemas (schemas.ts)    │ └────────────────────────────┘
└──────────────────────────────┘
```

---

## 2. Directory & Folder Structure

```
ReliefLens/
├── docs/                       # Architectural specs, rulesets, evaluation data
│   ├── ARCHITECTURE.md         # Master architecture documentation
│   ├── ruleset.md              # Deterministic triage & scoring rules
│   └── evaluation.md           # Prototype precision/recall benchmark
├── src/
│   ├── config/                 # Centralized environment configuration
│   │   ├── env.ts              # Typed environment variables & fallback defaults
│   │   └── index.ts            # Config barrel export
│   ├── hooks/                  # Custom hooks separating logic from UI
│   │   ├── useIncidents.ts     # Reactive incidents, pagination, live subscription
│   │   ├── useGeolocation.ts   # Device GPS, reverse geocoding & live tracking
│   │   ├── useOnlineStatus.ts  # Connectivity & offline queue status
│   │   ├── useToast.ts         # User notifications hook
│   │   └── index.ts            # Hooks barrel export
│   ├── services/               # Scalable API and domain services
│   │   ├── apiClient.ts        # Supabase / mock client initialization
│   │   └── index.ts            # Services barrel export
│   ├── components/             # Reusable UI component modules
│   │   ├── common/             # Cross-cutting components (ErrorBoundary)
│   │   ├── dashboard/          # IncidentTable, MapPreview, Filters, Metrics
│   │   ├── location/           # CurrentLocationControl, LiveLocationControl
│   │   ├── voice/              # VoiceRecorder, ExtractionPreview, Waveform
│   │   ├── emergency/          # EmergencyVoiceFAB quick action
│   │   ├── layout/             # AppShell, Sidebar navigation, Header
│   │   ├── offline/            # OfflineBanner notification
│   │   ├── ui/                 # Primitives (Button, Badge, Dialog, Toast)
│   │   └── index.ts            # Component barrel exports
│   ├── lib/                    # Core libraries, dataService, offline sync
│   │   ├── dataService.ts      # Primary data facade (LocalDB + Supabase)
│   │   ├── offlineSyncService.ts# Offline queue with background sync
│   │   ├── reverseGeocode.ts   # OpenStreetMap Nominatim reverse geocoder
│   │   └── supabase.ts         # Supabase client wrapper
│   ├── pages/                  # Page routes (Dashboard, Map, ReportForm, etc.)
│   ├── shared/                 # Shared types, Zod schemas, errors, scoring
│   │   ├── errors.ts           # Standardized AppError hierarchy
│   │   ├── scoring.ts          # Deterministic multi-factor scoring algorithm
│   │   ├── duplicate.ts        # Spatial-temporal duplicate detection
│   │   ├── schemas.ts          # Zod validation schemas
│   │   └── types.ts            # Domain TypeScript interfaces
│   ├── data/                   # Initial seed datasets for sandbox mode
│   ├── App.tsx                 # Root routes & ErrorBoundary wrapper
│   └── index.css               # Design tokens, spatial animations, surface layers
└── tests/                      # Automated Vitest test suites
    ├── userRequirements.test.ts
    ├── reportSubmission.test.ts
    ├── geolocation.test.ts
    ├── evaluation.test.ts
    ├── scoring.test.ts
    └── duplicate.test.ts
```

---

## 3. Separation of Concerns & Business Logic

### Business Logic vs. Presentation Layer
- **Components & Pages** focus strictly on user presentation, layout, accessibility, and rendering.
- **Custom Hooks** (`src/hooks/`) own component lifecycle, reactive state, polling intervals, and browser API bindings (`Geolocation`, `MediaRecorder`, `Online/Offline`).
- **Services** (`src/services/` & `src/lib/`) execute pure asynchronous data persistence, validation, API communication, and event publication.
- **Domain Modules** (`src/shared/`) contain pure, side-effect-free algorithms (e.g. priority tier determination, duplicate confidence scoring).

---

## 4. Environment Configuration (`src/config/env.ts`)

Direct usage of `import.meta.env` is restricted to `src/config/env.ts`. Application code imports `config`:

```typescript
import { config } from '@/config/env';

// Type-safe access with validated fallbacks:
const tileUrl = config.map.tileUrl;
const isSupabaseLive = config.supabase.isConfigured;
```

---

## 5. Error Handling & Application Resiliency

1. **Structured Error Hierarchy (`src/shared/errors.ts`):**
   - `AppError`: Base application error with timestamp and error code.
   - `ValidationError`: Input validation failures with field-level breakdowns.
   - `NetworkError`: HTTP and connectivity interruptions.
   - `AuthError`: Authentication and authorization exceptions.
   - `PermissionError`: Role-based operation rejections.
2. **Global & Component Error Boundary (`src/components/common/ErrorBoundary.tsx`):**
   - Catches unhandled runtime exceptions in React components.
   - Renders a non-destructive recovery card with options to retry the component or reload.
3. **Offline Sync Queue (`src/lib/offlineSyncService.ts`):**
   - In offline situations, incident reports are queued in `localStorage`.
   - When network connectivity restores (`window.ononline`), pending reports are automatically replayed and ingested.

---

## 6. Real-Time Event & Subscription Model

Components subscribe to incident updates via `dataService.subscribeToIncidents`:
- **Local DB / Storage Events:** Window `storage` listener synchronizes changes across open browser tabs.
- **Supabase Real-Time:** When Supabase credentials are configured, Postgres change streams push mutations instantly.
- **Polling Fallback:** `useIncidents` and map canvas components run a conservative 25-second poll to ensure stale data is never shown.

---

## 7. Scaling the API Structure

When adding new tables or backend integrations:
1. Define the TypeScript types in `src/shared/types.ts`.
2. Define the Zod input validation schema in `src/shared/schemas.ts`.
3. Implement the domain service in `src/services/<domain>Service.ts`.
4. Expose relevant actions through `src/services/index.ts` and `dataService.ts`.
5. Create a domain hook in `src/hooks/` if reactive state management is required by multiple pages.
