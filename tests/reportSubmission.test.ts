import { describe, it, expect } from 'vitest';
import { reportIngestionSchema } from '../src/shared/schemas.ts';
import { dataService } from '../src/lib/dataService.ts';

describe('Report Submission and Validation Flow', () => {
  it('validates a complete report with empty number input (handling NaN preprocess)', () => {
    const rawFormState = {
      channel: 'phone_call' as const,
      incident_type: 'flood' as const,
      description: 'Severe flash flood near riverside street. Water levels rapidly rising.',
      reported_at: new Date().toISOString(),
      location_text: 'Riverside Ave and 4th St',
      district: 'Downtown',
      latitude: null,
      longitude: null,
      location_precision: 'approximate' as const,
      people_at_risk_estimate: NaN, // react-hook-form produces NaN when empty input with valueAsNumber: true
      immediate_danger: true,
      vulnerability_flags: ['children_present', 'trapped_individuals'],
    };

    const parsed = reportIngestionSchema.parse(rawFormState);
    expect(parsed.people_at_risk_estimate).toBeNull();
    expect(parsed.immediate_danger).toBe(true);
    expect(parsed.vulnerability_flags).toContain('trapped_individuals');
  });

  it('validates all new incident types from the UI dropdown', () => {
    const types = [
      'flood',
      'structure_collapse',
      'fire',
      'medical_emergency',
      'shelter_request',
      'water_shortage',
      'food_shortage',
      'power_outage',
      'road_blocked',
      'hazardous_material',
      'other',
    ] as const;

    types.forEach((type) => {
      const input = {
        channel: 'phone_call' as const,
        incident_type: type,
        description: `Incident description for ${type}`,
        reported_at: new Date().toISOString(),
        location_precision: 'approximate' as const,
      };
      const parsed = reportIngestionSchema.parse(input);
      expect(parsed.incident_type).toBe(type);
    });
  });

  it('successfully ingests a report via dataService and returns scored result', async () => {
    const reportData = {
      channel: 'phone_call' as const,
      incident_type: 'medical_emergency' as const,
      description: 'Senior citizen in medical distress following power failure.',
      reported_at: new Date().toISOString(),
      location_text: 'Apartment 4B, Elm St',
      district: 'Central',
      latitude: 37.7749,
      longitude: -122.4194,
      location_precision: 'exact' as const,
      people_at_risk_estimate: 1,
      immediate_danger: true,
      vulnerability_flags: ['elderly_present' as const, 'medical_dependency' as const],
      external_reference: null,
      contact_name: null,
      contact_phone: null,
      original_transcript: 'Senior citizen in medical distress following power failure.',
      detected_language: 'English',
      normalized_description: null,
      location_source: 'gps' as const,
      location_accuracy: 10,
      location_captured_at: new Date().toISOString(),
      user_confirmed_incident_location: true,
    };

    const result = await dataService.ingestReport(reportData);
    expect(result).toBeDefined();
    expect(result.incident_id).toBeDefined();
    expect(result.effective_score).toBeGreaterThan(0);
    expect(['critical', 'high', 'medium', 'low']).toContain(result.priority_tier);
  });
});
