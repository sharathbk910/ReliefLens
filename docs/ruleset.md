# ReliefLens — Versioned Deterministic Rule Engine (Ruleset v1.0.0)

## Overview

ReliefLens eliminates opaque machine-learning prioritization in favor of transparent, explainable, and deterministic business rules.

The authoritative ruleset specification is codified in `supabase/functions/_shared/rules/ruleset.v1.ts` and `src/shared/rules/ruleset.v1.ts`.

---

## 1. Prioritization Factors (Total: Max 100 Points)

### 1.1 Immediate Danger (Max: 30 Points)
- **Flag Match (30 pts)**: Any associated report sets `immediate_danger = true`.
- **Keyword Match (15 pts)**: Description contains whole-word matches of configured danger keywords:
  `trapped`, `drowning`, `collapsed`, `submerged`, `bleeding`, `unconscious`, `not breathing`, `fire spreading`, `rising water`, `cut off`, `stranded`.
- **None (0 pts)**: No danger indicator or keyword detected.

### 1.2 People at Risk (Max: 25 Points)
Calculated from the maximum known estimate across associated reports:
- ≥ 100 people: **25 points**
- 20–99 people: **20 points**
- 5–19 people: **15 points**
- 1–4 people: **8 points**
- 0 people: **0 points**
- Unknown estimate: **5 neutral points** (and sets `people_at_risk_unknown` flag).

### 1.3 Report Freshness / Time Sensitivity (Max: 20 Points)
Measures elapsed hours since the most recent associated report timestamp:
- ≤ 2 hours: **20 points**
- 2–6 hours: **14 points**
- 6–12 hours: **8 points**
- > 12 hours: **3 points**

*Note: This factor reflects time urgency, not proof that an older incident has become safe.*

### 1.4 Vulnerability Flags (Max: 15 Points)
Counts distinct manual field vulnerability flags across reports:
- Flags: `children_present`, `elderly_present`, `medical_dependency`, `isolated_remote`.
- Formula: `min(distinct_flags_count * 5, 15)`.

### 1.5 Information Confidence (Max: 10 Points)
- `coordinator_verified`: **10 points**
- `corroborated` (≥ 2 reports from ≥ 2 distinct channels): **10 points**
- `partially_corroborated` (≥ 2 reports from same channel): **5 points**
- `unverified`: **0 points**

---

## 2. Unverified High Danger Safety Floor

When immediate danger is reported and the incident remains unverified, the `unverified_high_danger` uncertainty flag is raised.

To prevent critical emergencies from being silently deprioritized due to missing information:
```typescript
if (hasImmediateDanger && verificationLevel === 'unverified') {
  floor_score = Math.max(computed_score, 45); // Guaranteed High priority
}
```

---

## 3. Priority Tiers

Derived from the effective score:
- **Critical**: 70–100
- **High**: 45–69
- **Medium**: 20–44
- **Low**: 0–19

---

## 4. Uncertainty Flags Specification

| Flag | Trigger Condition |
|---|---|
| `no_coordinates` | No associated report contains valid coordinates. |
| `location_precision_unknown` | All associated reports have unknown location precision. |
| `single_source` | Only 1 distinct reporting channel represented. |
| `people_at_risk_unknown` | No associated report contains a numeric estimate. |
| `conflicting_people_estimates` | Maximum estimate / minimum positive estimate ≥ 4. |
| `stale_over_12h` | Latest incoming report is more than 12 hours old. |
| `unverified_high_danger` | Immediate danger reported while verification remains unverified. |

---

## 5. Duplicate-Matching Engine

- **Candidate Filter**: Same incident type, within 12 hours, different incident, not resolved/merged/dismissed.
- **Text Similarity**: Jaccard index on normalized alphanumeric tokens (stop words removed, length ≥ 3).
- **Location Similarity**:
  - Coordinates: Haversine distance (≤ 500m is 1.0, ≥ 2000m is 0.0, linear in between).
  - Text: Jaccard similarity on normalized location/district strings.
- **Time Similarity**: Linear decay: `max(0, 1 - hours_difference / 12)`.
- **Combined Score**:
  `0.5 * text + 0.3 * location + 0.2 * time`
- **Suggestion Threshold**: Combined score ≥ `0.55`.
