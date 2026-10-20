import { RULESET } from './rules/ruleset.v1.ts';
import type {
  PriorityTier,
  Report,
  ScoreBreakdown,
  ScoreFactors,
  UncertaintyFlag,
  VerificationLevel,
  VulnerabilityFlag,
} from './types.ts';

export interface ScoringInput {
  reports: Array<
    Pick<
      Report,
      | 'description'
      | 'reported_at'
      | 'immediate_danger'
      | 'people_at_risk_estimate'
      | 'vulnerability_flags'
      | 'latitude'
      | 'longitude'
      | 'location_precision'
      | 'channel'
    >
  >;
  verificationLevel?: VerificationLevel;
  scoreOverride?: number | null;
  asOf?: Date;
}

/**
 * Normalizes text and matches danger keywords as whole words or phrases.
 */
export function findDangerKeywords(text: string): string[] {
  if (!text) return [];
  const normalized = text.toLowerCase();
  const matched = new Set<string>();

  for (const keyword of RULESET.dangerKeywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\b|\\s)${escaped}(\\b|\\s|$)`, 'i');
    if (regex.test(normalized)) {
      matched.add(keyword);
    }
  }

  return Array.from(matched);
}

/**
 * Computes corroboration level from report evidence unless manually verified.
 */
export function computeAutoVerificationLevel(
  reports: Array<{ channel: string }>,
  currentLevel?: VerificationLevel
): VerificationLevel {
  if (currentLevel === 'coordinator_verified') {
    return 'coordinator_verified';
  }

  if (reports.length < 2) {
    return 'unverified';
  }

  const distinctChannels = new Set(reports.map((r) => r.channel));
  if (distinctChannels.size >= 2) {
    return 'corroborated';
  }

  return 'partially_corroborated';
}

/**
 * Calculates priority tier from a score.
 */
export function getPriorityTier(score: number): PriorityTier {
  if (score >= RULESET.tiers.critical) return 'critical';
  if (score >= RULESET.tiers.high) return 'high';
  if (score >= RULESET.tiers.medium) return 'medium';
  return 'low';
}

/**
 * Deterministic scoring engine implementation based on RULESET v1.0.0.
 */
export function calculateIncidentScore(input: ScoringInput): ScoreBreakdown {
  const { reports, scoreOverride = null } = input;
  const asOf = input.asOf || new Date();

  // Determine verification level
  const verificationLevel: VerificationLevel =
    input.verificationLevel || computeAutoVerificationLevel(reports);

  // 1. Immediate Danger (0, 15, or 30 points)
  let dangerPoints = 0;
  let dangerSource: 'flag' | 'keyword' | 'none' = 'none';
  const allMatchedKeywords = new Set<string>();

  const hasExplicitDanger = reports.some((r) => Boolean(r.immediate_danger));

  for (const r of reports) {
    const matched = findDangerKeywords(r.description || '');
    matched.forEach((k) => allMatchedKeywords.add(k));
  }

  if (hasExplicitDanger) {
    dangerPoints = RULESET.scoring.immediateDanger.flagPoints; // 30
    dangerSource = 'flag';
  } else if (allMatchedKeywords.size > 0) {
    dangerPoints = RULESET.scoring.immediateDanger.keywordPoints; // 15
    dangerSource = 'keyword';
  }

  // 2. People at Risk (max 25 points)
  const knownEstimates: number[] = reports
    .map((r) => r.people_at_risk_estimate)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v) && v >= 0);

  let peoplePoints: number = RULESET.scoring.peopleAtRisk.unknownPoints; // 5
  let peopleInputValue: number | null = null;

  if (knownEstimates.length > 0) {
    peopleInputValue = Math.max(...knownEstimates);
    const bucket = RULESET.scoring.peopleAtRisk.buckets.find(
      (b) => peopleInputValue! >= b.min
    );
    peoplePoints = bucket ? bucket.points : 0;
  }

  // 3. Time Sensitivity / Freshness (max 20 points)
  let hoursSinceLastReport = 0;
  if (reports.length > 0) {
    const timestamps = reports.map((r) => new Date(r.reported_at).getTime());
    const latestTimestamp = Math.max(...timestamps);
    const diffMs = Math.max(0, asOf.getTime() - latestTimestamp);
    hoursSinceLastReport = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
  }

  let timePoints = 3;
  for (const unit of RULESET.scoring.timeSensitivity.unitHours) {
    if (hoursSinceLastReport <= unit.maxHours) {
      timePoints = unit.points;
      break;
    }
  }

  // 4. Vulnerability (max 15 points)
  const distinctVulnerabilityFlags = Array.from(
    new Set(reports.flatMap((r) => r.vulnerability_flags || []))
  ) as VulnerabilityFlag[];

  const vulnerabilityPoints = Math.min(
    distinctVulnerabilityFlags.length * RULESET.scoring.vulnerability.perFlagPoints,
    RULESET.scoring.vulnerability.capPoints
  );

  // 5. Information Confidence (0, 5, or 10 points)
  const confidencePoints =
    RULESET.scoring.informationConfidence[verificationLevel] ?? 0;

  // Base Computed Score (sum capped at 100)
  const factorSum =
    dangerPoints +
    peoplePoints +
    timePoints +
    vulnerabilityPoints +
    confidencePoints;
  const computedScore = Math.min(100, Math.max(0, factorSum));

  // Uncertainty Flags calculation
  const uncertaintyFlags: UncertaintyFlag[] = [];

  // no_coordinates
  const hasCoordinates = reports.some(
    (r) =>
      typeof r.latitude === 'number' &&
      typeof r.longitude === 'number' &&
      !isNaN(r.latitude) &&
      !isNaN(r.longitude)
  );
  if (!hasCoordinates) {
    uncertaintyFlags.push('no_coordinates');
  }

  // location_precision_unknown
  const allPrecisionUnknown =
    reports.length === 0 ||
    reports.every((r) => !r.location_precision || r.location_precision === 'unknown');
  if (allPrecisionUnknown) {
    uncertaintyFlags.push('location_precision_unknown');
  }

  // single_source
  const distinctChannels = new Set(reports.map((r) => r.channel));
  if (distinctChannels.size <= 1) {
    uncertaintyFlags.push('single_source');
  }

  // people_at_risk_unknown
  if (knownEstimates.length === 0) {
    uncertaintyFlags.push('people_at_risk_unknown');
  }

  // conflicting_people_estimates
  const positiveEstimates = knownEstimates.filter((x) => x > 0);
  if (positiveEstimates.length >= 2) {
    const maxEst = Math.max(...positiveEstimates);
    const minEst = Math.min(...positiveEstimates);
    if (minEst > 0 && maxEst / minEst >= RULESET.conflictRatio) {
      uncertaintyFlags.push('conflicting_people_estimates');
    }
  }

  // stale_over_12h
  if (hoursSinceLastReport > RULESET.staleAfterHours) {
    uncertaintyFlags.push('stale_over_12h');
  }

  // unverified_high_danger: immediate danger reported and verification remains unverified
  const hasImmediateDangerEvidence = dangerPoints > 0;
  const isUnverified = verificationLevel === 'unverified';
  if (hasImmediateDangerEvidence && isUnverified) {
    uncertaintyFlags.push('unverified_high_danger');
  }

  // Safety floor for unverified high danger
  let floorScore = computedScore;
  let floorApplied = false;
  if (uncertaintyFlags.includes('unverified_high_danger')) {
    floorScore = Math.max(computedScore, RULESET.tiers.high); // 45
    floorApplied = floorScore > computedScore;
  }

  // Effective Score
  const effectiveScore =
    scoreOverride !== null && scoreOverride !== undefined
      ? scoreOverride
      : floorScore;

  const priorityTier = getPriorityTier(effectiveScore);

  const factors: ScoreFactors = {
    immediate_danger: {
      points: dangerPoints,
      max: RULESET.scoring.immediateDanger.flagPoints,
      source: dangerSource,
      matched_keywords: Array.from(allMatchedKeywords),
    },
    people_at_risk: {
      points: peoplePoints,
      max: 25,
      input_value: peopleInputValue,
    },
    time_sensitivity: {
      points: timePoints,
      max: 20,
      hours_since_last_report: hoursSinceLastReport,
    },
    vulnerability: {
      points: vulnerabilityPoints,
      max: RULESET.scoring.vulnerability.capPoints,
      flags: distinctVulnerabilityFlags,
    },
    information_confidence: {
      points: confidencePoints,
      max: 10,
      verification_level: verificationLevel,
    },
  };

  return {
    ruleset_version: RULESET.version,
    computed_score: computedScore,
    floor_score: floorScore,
    effective_score: effectiveScore,
    priority_tier: priorityTier,
    floor_applied: floorApplied,
    score_override: scoreOverride,
    factors,
    uncertainty_flags: uncertaintyFlags,
    computed_at: asOf.toISOString(),
  };
}
