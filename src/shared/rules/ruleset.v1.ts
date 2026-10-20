export const RULESET = {
  version: "1.0.0",

  scoring: {
    immediateDanger: {
      flagPoints: 30,
      keywordPoints: 15
    },

    peopleAtRisk: {
      unknownPoints: 5,

      buckets: [
        { min: 100, points: 25 },
        { min: 20, points: 20 },
        { min: 5, points: 15 },
        { min: 1, points: 8 },
        { min: 0, points: 0 }
      ]
    },

    timeSensitivity: {
      unitHours: [
        { maxHours: 2, points: 20 },
        { maxHours: 6, points: 14 },
        { maxHours: 12, points: 8 },
        { maxHours: Infinity, points: 3 }
      ]
    },

    vulnerability: {
      perFlagPoints: 5,
      capPoints: 15
    },

    informationConfidence: {
      unverified: 0,
      partially_corroborated: 5,
      corroborated: 10,
      coordinator_verified: 10
    }
  },

  tiers: {
    critical: 70,
    high: 45,
    medium: 20
  },

  dangerKeywords: [
    "trapped",
    "drowning",
    "collapsed",
    "submerged",
    "bleeding",
    "unconscious",
    "not breathing",
    "fire spreading",
    "rising water",
    "cut off",
    "stranded"
  ],

  duplicate: {
    windowHours: 12,
    suggestThreshold: 0.55,
    maxSuggestionsPerReport: 5,

    weights: {
      text: 0.5,
      location: 0.3,
      time: 0.2
    },

    locationFullScoreMeters: 500,
    locationZeroScoreMeters: 2000
  },

  staleAfterHours: 12,
  conflictRatio: 4
} as const;
