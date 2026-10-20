# ReliefLens — Setup & Local Development Guide

## Overview

ReliefLens is a web-based disaster incident coordination application that organizes fragmented emergency reports into structured, explainable, human-reviewed incident information.

---

## Prerequisites

- **Node.js**: v18+ (tested on Node v24.19.0)
- **npm**: v9+ (tested on npm 11.17.0)
- **Supabase Account / CLI** (Optional for cloud sync; ReliefLens includes a high-fidelity local prototype database with persistence out-of-the-box).

---

## 1. Quick Start

1. Clone or open the workspace:
   ```bash
   cd c:\ReliefLens
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Configure Environment:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *Note: If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are left empty, ReliefLens runs in High-Fidelity Prototype Sandbox mode with full local persistence, 65+ simulated reports, and all real transactional operations.*

4. Launch the application:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 2. Testing & Evaluation

Run unit tests and verification suites:
```bash
npm test
```

This runs:
- `tests/scoring.test.ts`: Deterministic scoring engine & safety floor.
- `tests/duplicate.test.ts`: Jaccard text similarity, Haversine spatial calculations, and time decay.
- `tests/evaluation.test.ts`: Evaluation script reporting Precision, Recall, F1 score, and Spearman rank correlation (`docs/evaluation_results.json`).

---

## 3. Demo Roles & Authentication

When opening `/login`, you can immediately select one of three preconfigured personas:

1. **Coordinator Marco Chen**: Full operational permissions (create reports, review duplicates, override priorities, update statuses).
2. **Chief Sarah Reynolds (Admin)**: Full administrative permissions (all coordinator features + audit log inspection, batch rescore, terminal incident reopening).
3. **Field Analyst Elena Rostova (Viewer)**: Read-only access (dashboard browsing, score explanation inspection, map view; cannot submit reports or alter states).

You can switch roles at any time using the account menu at the bottom of the sidebar.
