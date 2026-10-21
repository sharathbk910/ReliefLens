import { describe, it, expect } from 'vitest';
import { reportIngestionSchema, type ReportIngestionInput } from '../src/shared/schemas.ts';
import { dataService } from '../src/lib/dataService.ts';

describe('Automatic Geolocation & Location Safeguards', () => {
  const baseValidInput: ReportIngestionInput = {
    channel: 'phone_call',
    incident_type: 'flood',
    description: 'Flash flooding reported in low-lying area. Water level rising steadily.',
    reported_at: new Date().toISOString(),
    location_text: 'Bridge Road near canal',
    district: 'River Valley',
    latitude: 13.3408,
    longitude: 74.7421,
    location_precision: 'exact',
    location_source: 'gps',
    location_accuracy: 12,
    location_captured_at: new Date().toISOString(),
    user_confirmed_incident_location: true,
    people_at_risk_estimate: 8,
    immediate_danger: true,
    vulnerability_flags: ['children_present'],
  };

  it('validates valid GPS coordinates within range [-90, 90] and [-180, 180]', () => {
    const parsed = reportIngestionSchema.parse(baseValidInput);
    expect(parsed.latitude).toBe(13.3408);
    expect(parsed.longitude).toBe(74.7421);
    expect(parsed.location_source).toBe('gps');
    expect(parsed.location_accuracy).toBe(12);
    expect(parsed.user_confirmed_incident_location).toBe(true);
  });

  it('rejects unpaired coordinates (e.g. latitude provided without longitude)', () => {
    const invalidInput = {
      ...baseValidInput,
      latitude: 13.3408,
      longitude: null,
    };
    expect(() => reportIngestionSchema.parse(invalidInput)).toThrow(
      /Latitude and longitude must either both be supplied or both be omitted/
    );
  });

  it('rejects out-of-bounds latitude (> 90 or < -90)', () => {
    const invalidLat = {
      ...baseValidInput,
      latitude: 91.5,
      longitude: 74.7421,
    };
    expect(() => reportIngestionSchema.parse(invalidLat)).toThrow();
  });

  it('rejects out-of-bounds longitude (> 180 or < -180)', () => {
    const invalidLng = {
      ...baseValidInput,
      latitude: 13.3408,
      longitude: 185.0,
    };
    expect(() => reportIngestionSchema.parse(invalidLng)).toThrow();
  });

  it('enforces exact precision requiring valid coordinates', () => {
    const missingCoordsForExact = {
      ...baseValidInput,
      latitude: null,
      longitude: null,
      location_precision: 'exact' as const,
    };
    expect(() => reportIngestionSchema.parse(missingCoordsForExact)).toThrow(
      /Exact location precision requires valid coordinates/
    );
  });

  it('allows approximate or unknown precision without coordinates', () => {
    const validApproximate = {
      ...baseValidInput,
      latitude: null,
      longitude: null,
      location_precision: 'approximate' as const,
      location_source: 'manual' as const,
      location_accuracy: null,
    };
    const parsed = reportIngestionSchema.parse(validApproximate);
    expect(parsed.latitude).toBeNull();
    expect(parsed.longitude).toBeNull();
    expect(parsed.location_precision).toBe('approximate');
  });

  it('persists geolocation metadata into report and incident on ingestion', async () => {
    // Set user as coordinator
    dataService.setCurrentUserRole('coordinator');

    const input: ReportIngestionInput = {
      channel: 'field_volunteer',
      incident_type: 'landslide',
      description: 'Mudslide blocking primary arterial roadway. Two vehicles stranded.',
      reported_at: new Date().toISOString(),
      location_text: 'Hill Pass Mile 14',
      district: 'Western Range',
      latitude: 12.8797,
      longitude: 74.8427,
      location_precision: 'exact',
      location_source: 'gps',
      location_accuracy: 15,
      location_captured_at: new Date().toISOString(),
      user_confirmed_incident_location: true,
      people_at_risk_estimate: 4,
      immediate_danger: true,
      vulnerability_flags: ['isolated_remote'],
      original_transcript: 'Landslide on Hill Pass road near Mile 14.',
      detected_language: 'English',
      normalized_description: 'Landslide on Hill Pass road near Mile 14 blocking traffic.',
    };

    const res = await dataService.ingestReport(input);
    expect(res.incident_id).toBeDefined();
    expect(res.report_id).toBeDefined();

    // Verify incident has persisted geolocation and voice metadata
    const { incident, reports } = await dataService.getIncidentById(res.incident_id);
    expect(incident).toBeDefined();
    expect(incident?.latitude).toBe(12.8797);
    expect(incident?.longitude).toBe(74.8427);
    expect(incident?.location_source).toBe('gps');
    expect(incident?.location_accuracy).toBe(15);
    expect(incident?.user_confirmed_incident_location).toBe(true);

    // Verify report has persisted voice fields
    expect(reports.length).toBeGreaterThan(0);
    const createdReport = reports.find((r) => r.id === res.report_id);
    expect(createdReport?.original_transcript).toBe('Landslide on Hill Pass road near Mile 14.');
    expect(createdReport?.detected_language).toBe('English');
    expect(createdReport?.normalized_description).toBe('Landslide on Hill Pass road near Mile 14 blocking traffic.');
  });

  it('allows citizen reporter to submit reports but prevents unauthorized administrative actions', async () => {
    // Switch to reporter role
    dataService.setCurrentUserRole('reporter');

    const reporterInput: ReportIngestionInput = {
      channel: 'phone_call',
      incident_type: 'flood',
      description: 'Water entering ground floor apartments. Power has gone out.',
      reported_at: new Date().toISOString(),
      location_text: 'Lakeview Colony',
      district: 'East Basin',
      latitude: null,
      longitude: null,
      location_precision: 'approximate',
      people_at_risk_estimate: 6,
      immediate_danger: true,
      vulnerability_flags: ['elderly_present'],
      user_confirmed_incident_location: true,
    };

    // Citizen reporter CAN submit reports
    const res = await dataService.ingestReport(reporterInput);
    expect(res.incident_id).toBeDefined();

    // Citizen reporter CANNOT view admin audit logs
    await expect(dataService.getAuditLogs()).rejects.toThrow(
      /Forbidden: Only administrators can view audit logs/
    );

    // Citizen reporter CANNOT review duplicates
    await expect(
      dataService.reviewDuplicate({
        candidate_id: 'dummy-id',
        decision: 'confirmed',
      })
    ).rejects.toThrow();

    // Citizen reporter CANNOT override priority
    await expect(
      dataService.overridePriority({
        incident_id: res.incident_id,
        override_score: 95,
        reason: 'Unauthorized boost',
      })
    ).rejects.toThrow();
  }, 15000);

  it('provides structured reverse geocoded place name and district from coordinates', async () => {
    const { reverseGeocodeCoordinates } = await import('../src/lib/reverseGeocode.ts');
    const result = await reverseGeocodeCoordinates(12.97629, 74.818172);
    expect(result).toBeDefined();
    expect(result.district).toBeDefined();
    expect(result.locationText).toBeDefined();
    expect(result.displayName).toBeDefined();
  });
});
