# ResQWave

> **Connecting Emergencies to Action**
> *Transparent Disaster Response Coordination & Rapid Incident Prioritization*

ResQWave is a modern, transparent disaster incident coordination platform designed for emergency responders and coordinators. It organizes fragmented incoming calls, voice reports, and field observations into structured, explainable, and human-reviewed incident records.

---

## Key Principles & Capabilities

1. **Deterministic & Explainable Priority Scoring (Ruleset v1.0.0)**:
   - Eliminates black-box AI hallucinations in life-critical workflows.
   - Every incident score (0–100) and priority tier is derived from five transparent factors: Immediate Danger (30 pts), People at Risk (25 pts), Report Freshness (20 pts), Vulnerability Flags (15 pts), and Information Confidence (10 pts).
   - Enforces an **Unverified High-Danger Safety Floor (45 pts, High Tier)** so life-threatening situations are never silently deprioritized due to missing verification.

2. **Uncertainty Awareness**:
   - Detects and surfaces uncertainty badges: missing coordinates, unknown precision, single-channel sources, conflicting casualty estimates, and stale reports (>12h).

3. **Deterministic Duplicate Matching & Human-in-the-Loop Review**:
   - Compares incoming reports against active incidents using Jaccard text similarity, Haversine geographic distance, and temporal decay.
   - Generates duplicate suggestions with human-readable reasons for coordinator review.
   - Transactional merge workflow consolidates reports into a canonical incident while preserving all original raw evidence and audit history.

4. **Documented Priority Overrides & Status Transitions**:
   - Coordinators can override priority scores with mandatory written justifications (10–500 chars).
   - The original computed score remains permanently visible alongside the override.
   - Status updates and coordinator verification workflows are tracked with full actor attribution.

5. **Geographic Map Visualization**:
   - Leaflet-powered map displaying priority-tiered incident markers.
   - Includes a persistent drawer for unlocated incidents (missing coordinates).
   - Resilient design: the dashboard and coordination features remain 100% operational even if the external map tile server is unavailable.

6. **Immutable Audit History**:
   - Administrator-only compliance trail recording every mutation, decision, override, and batch rescore with timestamps and JSONB before-and-after payloads.

---

## Benchmark Evaluation Results

Tested against the simulated prototype scenario (65 reports, 25 labeled pairs):

| Metric | Target | Actual |
|---|:---:|:---:|
| Total Simulated Reports | ≥ 60 | **65** |
| Labeled Duplicate Pairs | ≥ 15 | **15** |
| Labeled Near-Miss Pairs | ≥ 10 | **10** |
| Duplicate Detection Precision | ≥ 0.85 | **1.0000** (0 false positives) |
| Duplicate Detection Recall | ≥ 0.80 | **0.8667** |
| Duplicate Detection F1 Score | ≥ 0.85 | **0.9286** |
| Spearman Rank Correlation | ≥ 0.80 | **0.9567** |

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, React Hook Form, Zod, Lucide React, Leaflet, React-Leaflet.
- **Backend & Database**: Supabase PostgreSQL, Row Level Security (RLS), Supabase Edge Functions (Deno / TypeScript).
- **Testing**: Vitest unit & evaluation test suites.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*(Leave values blank to run in local High-Fidelity Prototype Sandbox mode).*

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173`.

### 4. Run Test Suite & Evaluation
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
```

---

## Pre-Configured Demo Personas

On `/login`, click any persona to test role-based access:
- **Coordinator Marco Chen**: Standard coordinator with creation, override, merge, and verification privileges.
- **Chief Sarah Reynolds (Admin)**: Full administrative access including audit logs and batch rescore.
- **Field Analyst Elena Rostova (Viewer)**: Read-only access with disabled mutation buttons.

---

## Prototype Safety Disclaimer

*Prototype — ResQWave supports emergency coordination decisions but is not an official emergency-service system. Do not use it as the sole source for emergency decisions.*
