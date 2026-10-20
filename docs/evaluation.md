# ReliefLens — Prototype Dataset Evaluation Report

## Execution Summary

The prototype evaluation test (`tests/evaluation.test.ts`) was executed against the simulated test scenario containing **65 reports** across multiple incident categories and channels.

---

## 1. Metrics & Benchmark Targets

| Evaluation Metric | Benchmark Target | Actual Result | Status |
|---|:---:|:---:|:---:|
| Total Simulated Reports | ≥ 60 | **65** | Passed |
| Labeled Duplicate Pairs | ≥ 15 | **15** | Passed |
| Labeled Near-Miss Pairs | ≥ 10 | **10** | Passed |
| Duplicate Precision | ≥ 0.85 | **1.0000** | Passed |
| Duplicate Recall | ≥ 0.80 | **0.8667** | Passed |
| Duplicate F1 Score | ≥ 0.85 | **0.9286** | Passed |
| Spearman Rank Correlation | ≥ 0.80 | **0.9567** | Passed |

---

## 2. Duplicate Detection Analysis

- **True Positives (TP)**: 13 pairs correctly flagged for human review.
- **False Positives (FP)**: 0 pairs falsely suggested (Precision = 100%).
- **False Negatives (FN)**: 2 pairs missed suggestion threshold (scored 0.538 and 0.530, just below 0.55 cutoff).
- **True Negatives (TN)**: 10 near-miss pairs correctly excluded from suggestions.

### False Negative Diagnostic
1. `REF-1025` / `REF-1026` (East Side Elementary Shelter Request):
   - Scored `0.538` (Threshold: `0.55`). Same type, 48m apart, received 20m apart, but brief description texts resulted in slightly reduced text token overlap.
2. `REF-1031` / `REF-1032` (South Bay Tidal Gate Flood):
   - Scored `0.530`. Sensor reading description vs field volunteer description differed in technical terminology.

---

## 3. Priority Ranking Consistency

The Spearman rank correlation of **0.9567** validates strong alignment between deterministic ground-truth emergency hazard levels and the final calculated effective score.

The priority floor ensures high-danger unverified reports are never buried at the bottom of the dispatch queue.

Full machine-readable results are persisted in `docs/evaluation_results.json`.
