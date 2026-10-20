import { RULESET } from './rules/ruleset.v1.ts';
import type { Incident, Report } from './types.ts';

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'of', 'to',
  'for', 'with', 'by', 'as', 'was', 'were', 'be', 'been', 'being', 'have',
  'has', 'had', 'do', 'does', 'did', 'but', 'if', 'then', 'else', 'when',
  'up', 'down', 'into', 'out', 'over', 'under', 'again', 'further', 'once',
  'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'this', 'that',
  'are', 'from', 'near', 'about'
]);

/**
 * Tokenizes and normalizes text for Jaccard similarity.
 */
export function tokenizeText(text: string): Set<string> {
  if (!text) return new Set();
  // Lowercase, replace punctuation with space, split by whitespace
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .trim();

  const rawTokens = cleaned.split(/\s+/);
  const tokens = new Set<string>();

  for (const token of rawTokens) {
    if (token.length >= 3 && !STOP_WORDS.has(token)) {
      tokens.add(token);
    }
  }

  return tokens;
}

/**
 * Jaccard similarity between two sets of tokens.
 */
export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionSize++;
    }
  }
  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

/**
 * Calculates Haversine distance in meters between two lat/lng coordinates.
 */
export function calculateHaversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface DuplicateMatchResult {
  similarityScore: number;
  textSimilarity: number;
  locationSimilarity: number;
  timeSimilarity: number;
  reasons: string[];
}

/**
 * Computes duplicate match similarity between two reports.
 */
export function evaluateDuplicatePair(
  reportA: Pick<
    Report,
    | 'incident_type'
    | 'description'
    | 'reported_at'
    | 'latitude'
    | 'longitude'
    | 'location_text'
    | 'district'
  >,
  reportB: Pick<
    Report,
    | 'incident_type'
    | 'description'
    | 'reported_at'
    | 'latitude'
    | 'longitude'
    | 'location_text'
    | 'district'
  >
): DuplicateMatchResult {
  const reasons: string[] = [];

  // Incident type check
  if (reportA.incident_type === reportB.incident_type) {
    reasons.push(`Same incident type (${reportA.incident_type})`);
  }

  // 1. Text Similarity
  const tokensA = tokenizeText(reportA.description || '');
  const tokensB = tokenizeText(reportB.description || '');
  const textSim = jaccardSimilarity(tokensA, tokensB);

  if (textSim >= 0.4) {
    reasons.push(
      `Strong text description similarity (${Math.round(textSim * 100)}%)`
    );
  } else if (textSim >= 0.2) {
    reasons.push(
      `Moderate text description similarity (${Math.round(textSim * 100)}%)`
    );
  }

  // 2. Location Similarity
  let locSim = 0;
  const hasCoordsA =
    typeof reportA.latitude === 'number' &&
    typeof reportA.longitude === 'number';
  const hasCoordsB =
    typeof reportB.latitude === 'number' &&
    typeof reportB.longitude === 'number';

  if (hasCoordsA && hasCoordsB) {
    const distanceMeters = calculateHaversineMeters(
      reportA.latitude!,
      reportA.longitude!,
      reportB.latitude!,
      reportB.longitude!
    );

    if (distanceMeters <= RULESET.duplicate.locationFullScoreMeters) {
      locSim = 1.0;
      reasons.push(
        `Locations within ${Math.round(distanceMeters)} meters (full match)`
      );
    } else if (distanceMeters >= RULESET.duplicate.locationZeroScoreMeters) {
      locSim = 0.0;
      reasons.push(
        `Locations ${Math.round(distanceMeters / 1000)} km apart (outside spatial window)`
      );
    } else {
      // Linear interpolation between 500m and 2000m
      const span =
        RULESET.duplicate.locationZeroScoreMeters -
        RULESET.duplicate.locationFullScoreMeters;
      const progress = distanceMeters - RULESET.duplicate.locationFullScoreMeters;
      locSim = Math.max(0, Math.min(1, 1 - progress / span));
      reasons.push(
        `Locations approximately ${Math.round(distanceMeters)} meters apart`
      );
    }
  } else {
    // Compare location text / district
    const locTextA = [reportA.location_text, reportA.district]
      .filter(Boolean)
      .join(' ');
    const locTextB = [reportB.location_text, reportB.district]
      .filter(Boolean)
      .join(' ');

    const locTokensA = tokenizeText(locTextA);
    const locTokensB = tokenizeText(locTextB);

    if (locTokensA.size > 0 && locTokensB.size > 0) {
      locSim = jaccardSimilarity(locTokensA, locTokensB);
      if (locSim > 0.3) {
        reasons.push(
          `Matching location text/district (${Math.round(locSim * 100)}%)`
        );
      }
    } else {
      locSim = 0;
      reasons.push('Location coordinates or descriptions incomplete');
    }
  }

  // 3. Time Similarity
  const timeA = new Date(reportA.reported_at).getTime();
  const timeB = new Date(reportB.reported_at).getTime();
  const diffHours = Math.abs(timeA - timeB) / (1000 * 60 * 60);

  const timeSim = Math.max(
    0,
    1 - diffHours / RULESET.duplicate.windowHours
  );

  const diffMinutes = Math.round(diffHours * 60);
  if (diffMinutes < 60) {
    reasons.push(`Reports received ${diffMinutes} minutes apart`);
  } else {
    reasons.push(`Reports received ${diffHours.toFixed(1)} hours apart`);
  }

  // Combined score: 0.5 * text + 0.3 * location + 0.2 * time
  const rawCombined =
    RULESET.duplicate.weights.text * textSim +
    RULESET.duplicate.weights.location * locSim +
    RULESET.duplicate.weights.time * timeSim;

  const similarityScore = parseFloat(rawCombined.toFixed(3));

  return {
    similarityScore,
    textSimilarity: parseFloat(textSim.toFixed(3)),
    locationSimilarity: parseFloat(locSim.toFixed(3)),
    timeSimilarity: parseFloat(timeSim.toFixed(3)),
    reasons,
  };
}

export interface CandidateSuggestion {
  candidateReport: Report & { incident?: Incident };
  matchResult: DuplicateMatchResult;
}

/**
 * Finds duplicate candidates for an incoming report against a list of existing reports.
 */
export function findDuplicateSuggestions(
  incomingReport: Report,
  existingReports: Array<Report & { incident?: Incident }>
): CandidateSuggestion[] {
  const suggestions: CandidateSuggestion[] = [];

  for (const existing of existingReports) {
    // 1. Same incident type
    if (existing.incident_type !== incomingReport.incident_type) {
      continue;
    }

    // 2. Belong to a different incident
    if (existing.incident_id === incomingReport.incident_id) {
      continue;
    }

    // 3. Candidate incident not merged, dismissed, or resolved
    if (
      existing.incident?.status === 'merged' ||
      existing.incident?.status === 'dismissed' ||
      existing.incident?.status === 'resolved'
    ) {
      continue;
    }

    // 4. Within 12 hours
    const timeDiffHours =
      Math.abs(
        new Date(incomingReport.reported_at).getTime() -
          new Date(existing.reported_at).getTime()
      ) /
      (1000 * 60 * 60);

    if (timeDiffHours > RULESET.duplicate.windowHours) {
      continue;
    }

    // Evaluate pair
    const match = evaluateDuplicatePair(incomingReport, existing);
    if (match.similarityScore >= RULESET.duplicate.suggestThreshold) {
      suggestions.push({
        candidateReport: existing,
        matchResult: match,
      });
    }
  }

  // Sort descending by similarity score, take up to maxSuggestionsPerReport
  suggestions.sort(
    (a, b) => b.matchResult.similarityScore - a.matchResult.similarityScore
  );
  return suggestions.slice(0, RULESET.duplicate.maxSuggestionsPerReport);
}
