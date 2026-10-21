import { describe, it, expect } from 'vitest';
import { generateSeedDataset } from '../src/data/seedData.ts';
import { evaluateDuplicatePair } from '../src/shared/duplicate.ts';
import { RULESET } from '../src/shared/rules/ruleset.v1.ts';
import fs from 'fs';
import path from 'path';

/**
 * Calculates Spearman Rank Correlation between two ranked arrays.
 */
function calculateSpearmanCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n <= 1) return 1;

  const getRanks = (arr: number[]) => {
    const sorted = arr.map((val, idx) => ({ val, idx })).sort((a, b) => b.val - a.val);
    const ranks = new Array(n);
    sorted.forEach((item, rank) => {
      ranks[item.idx] = rank + 1;
    });
    return ranks;
  };

  const rankX = getRanks(x);
  const rankY = getRanks(y);

  let dSquareSum = 0;
  for (let i = 0; i < n; i++) {
    const d = rankX[i] - rankY[i];
    dSquareSum += d * d;
  }

  const spearman = 1 - (6 * dSquareSum) / (n * (n * n - 1));
  return parseFloat(spearman.toFixed(4));
}

describe('ResQWave Prototype Dataset Evaluation (Section 15.4)', () => {
  it('evaluates duplicate detection precision, recall, and Spearman rank correlation', () => {
    const dataset = generateSeedDataset();
    const { reports, labeledPairs, incidents } = dataset;

    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let trueNegatives = 0;

    const fpDetails: any[] = [];
    const fnDetails: any[] = [];

    labeledPairs.forEach((pair) => {
      const repA = reports[pair.reportAIndex];
      const repB = reports[pair.reportBIndex];
      const match = evaluateDuplicatePair(repA, repB);
      const predicted = match.similarityScore >= RULESET.duplicate.suggestThreshold;
      const actual = pair.isDuplicate;

      if (predicted && actual) {
        truePositives++;
      } else if (predicted && !actual) {
        falsePositives++;
        fpDetails.push({ pair, score: match.similarityScore, reasons: match.reasons });
      } else if (!predicted && actual) {
        falseNegatives++;
        fnDetails.push({ pair, score: match.similarityScore, reasons: match.reasons });
      } else {
        trueNegatives++;
      }
    });

    const precision =
      truePositives + falsePositives > 0
        ? truePositives / (truePositives + falsePositives)
        : 0;
    const recall =
      truePositives + falseNegatives > 0
        ? truePositives / (truePositives + falseNegatives)
        : 0;
    const f1Score =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;

    // Spearman Rank Correlation:
    // Compare ground truth danger level (immediate_danger weight + people_at_risk + freshness)
    // with computed effective scores
    const groundTruthValues = incidents.map((inc) => {
      const dangerWt = inc.score_breakdown.factors.immediate_danger.points > 0 ? 30 : 0;
      const peopleWt = Math.min(25, (inc.people_at_risk_estimate || 0) * 1.5);
      const timeWt = inc.score_breakdown.factors.time_sensitivity.points;
      return dangerWt + peopleWt + timeWt;
    });

    const effectiveScores = incidents.map((inc) => inc.effective_score);

    const spearmanCorrelation = calculateSpearmanCorrelation(
      groundTruthValues,
      effectiveScores
    );

    const evaluationResults = {
      timestamp: new Date().toISOString(),
      dataset_size: {
        total_reports: reports.length,
        total_incidents: incidents.length,
        total_labeled_pairs: labeledPairs.length,
      },
      duplicate_detection: {
        true_positives: truePositives,
        false_positives: falsePositives,
        false_negatives: falseNegatives,
        true_negatives: trueNegatives,
        precision: parseFloat(precision.toFixed(4)),
        recall: parseFloat(recall.toFixed(4)),
        f1_score: parseFloat(f1Score.toFixed(4)),
        fp_details: fpDetails,
        fn_details: fnDetails,
      },
      ranking_consistency: {
        spearman_rank_correlation: spearmanCorrelation,
        target_met: spearmanCorrelation >= 0.8,
      },
    };

    // Ensure docs directory exists and write results
    const docsDir = path.resolve('./docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(docsDir, 'evaluation_results.json'),
      JSON.stringify(evaluationResults, null, 2)
    );

    console.log('Evaluation Summary:', JSON.stringify(evaluationResults, null, 2));

    expect(reports.length).toBeGreaterThanOrEqual(60);
    expect(labeledPairs.filter((p) => p.isDuplicate).length).toBeGreaterThanOrEqual(15);
    expect(labeledPairs.filter((p) => !p.isDuplicate).length).toBeGreaterThanOrEqual(10);
    expect(f1Score).toBeGreaterThanOrEqual(0.85);
    expect(spearmanCorrelation).toBeGreaterThanOrEqual(0.8);
  });
});
