import { describe, it, expect } from 'vitest';
import { calculateIncidentScore, findDangerKeywords, getPriorityTier } from '../src/shared/scoring.ts';
import type { Report } from '../src/shared/types.ts';

describe('Deterministic Scoring Engine (Ruleset v1.0.0)', () => {
  const baseTime = new Date('2026-10-20T12:00:00Z');

  it('matches danger keywords properly', () => {
    const text = 'Water is rising water and 2 people are trapped inside collapsed building.';
    const keywords = findDangerKeywords(text);
    expect(keywords).toContain('trapped');
    expect(keywords).toContain('collapsed');
    expect(keywords).toContain('rising water');
  });

  it('awards 30 points for explicit immediate danger flag', () => {
    const report: Partial<Report> = {
      description: 'Minor water seepage',
      reported_at: '2026-10-20T11:45:00Z', // 15 mins ago
      immediate_danger: true,
      people_at_risk_estimate: 2,
      vulnerability_flags: [],
      channel: 'phone_call',
    };

    const res = calculateIncidentScore({
      reports: [report as Report],
      verificationLevel: 'unverified',
      asOf: baseTime,
    });

    expect(res.factors.immediate_danger.points).toBe(30);
    expect(res.factors.immediate_danger.source).toBe('flag');
  });

  it('awards 15 points if immediate_danger flag is false but danger keyword matched', () => {
    const report: Partial<Report> = {
      description: 'People are trapped on roof',
      reported_at: '2026-10-20T11:45:00Z',
      immediate_danger: false,
      people_at_risk_estimate: 2,
      vulnerability_flags: [],
      channel: 'sms',
    };

    const res = calculateIncidentScore({
      reports: [report as Report],
      verificationLevel: 'unverified',
      asOf: baseTime,
    });

    expect(res.factors.immediate_danger.points).toBe(15);
    expect(res.factors.immediate_danger.source).toBe('keyword');
    expect(res.factors.immediate_danger.matched_keywords).toContain('trapped');
  });

  it('evaluates people at risk buckets properly using max known estimate', () => {
    const reports: Partial<Report>[] = [
      { description: 'Report A', reported_at: '2026-10-20T11:00:00Z', people_at_risk_estimate: 4, channel: 'sms' },
      { description: 'Report B', reported_at: '2026-10-20T11:30:00Z', people_at_risk_estimate: 25, channel: 'phone_call' },
    ];

    const res = calculateIncidentScore({
      reports: reports as Report[],
      verificationLevel: 'unverified',
      asOf: baseTime,
    });

    expect(res.factors.people_at_risk.input_value).toBe(25);
    expect(res.factors.people_at_risk.points).toBe(20); // bucket >= 20 is 20 points
  });

  it('assigns 5 neutral points when people at risk is unknown', () => {
    const report: Partial<Report> = {
      description: 'Unknown impact',
      reported_at: '2026-10-20T11:00:00Z',
      people_at_risk_estimate: null,
      channel: 'sensor',
    };

    const res = calculateIncidentScore({
      reports: [report as Report],
      verificationLevel: 'unverified',
      asOf: baseTime,
    });

    expect(res.factors.people_at_risk.input_value).toBeNull();
    expect(res.factors.people_at_risk.points).toBe(5);
    expect(res.uncertainty_flags).toContain('people_at_risk_unknown');
  });

  it('applies the safety floor of 45 for unverified high danger incidents', () => {
    // Report with immediate danger (30 pts) + 0 people (0 pts) + >12h time (3 pts) = 33 pts
    const report: Partial<Report> = {
      description: 'Danger situation',
      reported_at: '2026-10-19T12:00:00Z', // 24h ago -> 3 pts
      immediate_danger: true,
      people_at_risk_estimate: 0,
      vulnerability_flags: [],
      channel: 'phone_call',
    };

    const res = calculateIncidentScore({
      reports: [report as Report],
      verificationLevel: 'unverified',
      asOf: baseTime,
    });

    expect(res.computed_score).toBe(33); // 30 + 0 + 3 + 0 + 0 = 33
    expect(res.uncertainty_flags).toContain('unverified_high_danger');
    expect(res.floor_applied).toBe(true);
    expect(res.floor_score).toBe(45);
    expect(res.effective_score).toBe(45);
    expect(res.priority_tier).toBe('high');
  });

  it('detects conflicting people estimates when ratio is >= 4', () => {
    const reports: Partial<Report>[] = [
      { description: 'Report 1', reported_at: '2026-10-20T11:00:00Z', people_at_risk_estimate: 5, channel: 'sms' },
      { description: 'Report 2', reported_at: '2026-10-20T11:15:00Z', people_at_risk_estimate: 25, channel: 'phone_call' },
    ];

    const res = calculateIncidentScore({
      reports: reports as Report[],
      verificationLevel: 'unverified',
      asOf: baseTime,
    });

    expect(res.uncertainty_flags).toContain('conflicting_people_estimates');
  });
});
