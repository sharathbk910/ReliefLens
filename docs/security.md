# ReliefLens — Security Architecture & Data Isolation

## 1. Role-Based Access Control (RBAC)

ReliefLens enforces three discrete operational roles across frontend routes, Edge Functions, and database policies:

| Capability | Admin | Coordinator | Viewer | Anonymous |
|---|:---:|:---:|:---:|:---:|
| Read Incident Information | ✅ | ✅ | ✅ | ❌ |
| Create Incoming Reports | ✅ | ✅ | ❌ | ❌ |
| Override Incident Priority | ✅ | ✅ | ❌ | ❌ |
| Confirm / Reject Duplicates | ✅ | ✅ | ❌ | ❌ |
| Update Status & Verification | ✅ | ✅ | ❌ | ❌ |
| Access Restricted Reporter Contacts | ✅ | ✅ | ❌ | ❌ |
| Inspect Audit Logs | ✅ | ❌ | ❌ | ❌ |
| Batch Rescore Incidents | ✅ | ❌ | ❌ | ❌ |
| Reopen Terminal Incidents | ✅ | ❌ | ❌ | ❌ |

- **Default Assignment**: New user registrations strictly default to `viewer`.
- **Role Escalation**: Regular users cannot promote themselves; only an authorized administrator can update roles in `public.profiles`.

---

## 2. Row Level Security (RLS) Policies

All tables exposed in Supabase PostgreSQL enable RLS:

1. **`incidents`**:
   - `SELECT`: All authenticated roles.
   - `INSERT / UPDATE`: Coordinators and Admins only.
2. **`reports`**:
   - `SELECT`: All authenticated roles.
   - `INSERT`: Coordinators and Admins only.
3. **`report_contacts`**:
   - `SELECT`: Restricted strictly to Coordinators and Admins. Protected from Viewers and public leaks.
4. **`duplicate_candidates`**:
   - `SELECT`: All authenticated roles.
   - `UPDATE`: Coordinators and Admins only.
5. **`priority_overrides`**:
   - Historical records are append-only. Deletions are forbidden.
6. **`audit_log`**:
   - `SELECT`: Restricted exclusively to Admins.
   - Insertions handled via security-definer procedures or authenticated operational workflows. No client-side tampering permitted.

---

## 3. Data Integrity & Transactional Merges

- **Merge Invariants**:
  - `confirm_duplicate_candidate` executes in an atomic transaction.
  - Reassigns all associated reports from the source incident to the canonical incident.
  - Marks source incident as `merged` (`merged_into_id = canonical_id`).
  - Recalculates canonical incident scores and uncertainty flags.
  - Prevents circular merges, self-merges, or re-merging already merged records.
- **Computed Score Protection**:
  - The frontend never dictates authoritative computed scores.
  - The deterministic rule engine recalculates scores server-side from underlying report evidence.
- **Priority Override Integrity**:
  - Manual overrides require documented reasons (10–500 chars).
  - The original system-computed score is permanently preserved.

---

## 4. Privacy & Safe Error Handling

- Contact telephone numbers and names are isolated in `report_contacts`.
- Error messages returned to clients never expose stack traces, database credentials, or internal query text.
