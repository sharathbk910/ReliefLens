import { describe, it, expect } from 'vitest';
import {
  evaluateDuplicatePair,
  tokenizeText,
  jaccardSimilarity,
  calculateHaversineMeters,
} from '../src/shared/duplicate.ts';
import type { Report } from '../src/shared/types.ts';

describe('Deterministic Duplicate Matching Engine', () => {
  it('tokenizes text and removes stop words and short tokens', () => {
    const tokens = tokenizeText('The rapid rising water is flooding the street now!');
    expect(tokens.has('rapid')).toBe(true);
    expect(tokens.has('rising')).toBe(true);
    expect(tokens.has('water')).toBe(true);
    expect(tokens.has('flooding')).toBe(true);
    expect(tokens.has('street')).toBe(true);
    expect(tokens.has('the')).toBe(false);
    expect(tokens.has('is')).toBe(false);
  });

  it('calculates spatial distance with Haversine formula correctly', () => {
    // 37.7749, -122.4194 and 37.7752, -122.4190 are roughly ~48 meters apart
    const distance = calculateHaversineMeters(37.7749, -122.4194, 37.7752, -122.4190);
    expect(distance).toBeGreaterThan(30);
    expect(distance).toBeLessThan(80);
  });

  it('awards high similarity score for near-identical reports close in time and space', () => {
    const repA: Partial<Report> = {
      incident_type: 'flood',
      description: 'Rapid rising water at Riverside Drive. People trapped on rooftops.',
      reported_at: '2026-10-20T10:00:00Z',
      latitude: 37.7749,
      longitude: -122.4194,
      location_text: 'Riverside Drive',
      district: 'East River Basin',
    };

    const repB: Partial<Report> = {
      incident_type: 'flood',
      description: 'Water rising fast at Riverside Dr. Residents trapped on the roof waving flags.',
      reported_at: '2026-10-20T10:20:00Z', // 20 mins apart
      latitude: 37.7752,
      longitude: -122.4190, // ~50m apart
      location_text: 'Riverside Dr near riverfront',
      district: 'East River Basin',
    };

    const match = evaluateDuplicatePair(repA as Report, repB as Report);
    expect(match.similarityScore).toBeGreaterThanOrEqual(0.55);
    expect(match.reasons.length).toBeGreaterThan(0);
  });

  it('rejects duplicate suggestion when reports are in different areas and far apart in time', () => {
    const repA: Partial<Report> = {
      incident_type: 'flood',
      description: 'Rapid rising water at Riverside Drive.',
      reported_at: '2026-10-20T01:00:00Z',
      latitude: 37.7749,
      longitude: -122.4194,
      location_text: 'Riverside Drive',
      district: 'East River Basin',
    };

    const repB: Partial<Report> = {
      incident_type: 'flood',
      description: 'Minor ditch puddle at West Municipal Park trails.',
      reported_at: '2026-10-20T11:50:00Z', // 10.8 hours apart
      latitude: 37.8500,
      longitude: -122.3500, // 10+ km away
      location_text: 'West Municipal Park',
      district: 'West District',
    };

    const match = evaluateDuplicatePair(repA as Report, repB as Report);
    expect(match.similarityScore).toBeLessThan(0.4);
  });
});
