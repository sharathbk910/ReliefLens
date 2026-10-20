import { describe, it, expect } from 'vitest';
import { geminiVoiceExtractionSchema } from '../src/shared/schemas.ts';
import { dataService } from '../src/lib/dataService.ts';

describe('Gemini Multilingual Voice Extraction Schema Validation', () => {
  it('validates English emergency voice report extraction', () => {
    const rawEnglishData = {
      transcript: 'Flash flooding on Main Street near River Park. Water is rising fast and two cars are trapped.',
      detectedLanguage: 'English',
      normalizedDescription: 'Flash flooding on Main Street near River Park. Rising waters trapped two vehicles.',
      title: 'FLOOD on Main Street near River Park',
      incidentType: 'flood',
      locationText: 'Main Street near River Park',
      district: 'Central Metro',
      latitude: 37.7749,
      longitude: -122.4194,
      locationPrecision: 'approximate',
      peopleAtRiskEstimate: 4,
      immediateDanger: true,
      vulnerabilityFlags: ['isolated_remote'],
      reportedAt: '2026-10-20T10:00:00Z',
      missingInformation: ['Exact vehicle occupancy count'],
      uncertaintyNotes: ['Coordinates approximate based on road name'],
      fieldEvidence: ['Witness reported rising water entering vehicle doors'],
    };

    const parsed = geminiVoiceExtractionSchema.parse(rawEnglishData);
    expect(parsed.detectedLanguage).toBe('English');
    expect(parsed.incidentType).toBe('flood');
    expect(parsed.immediateDanger).toBe(true);
    expect(parsed.peopleAtRiskEstimate).toBe(4);
  });

  it('validates Kannada language speech preserving native script transcript and English normalization', () => {
    const rawKannadaData = {
      transcript: 'ಉಡುಪಿಯ ಕಲ್ಯಾಣಪುರ ಸೇತುವೆ ಬಳಿ ಪ್ರವಾಹದ ನೀರು ನುಗ್ಗಿದೆ. ಸುಮಾರು ಹದಿನೈದು ಜನ ಸಿಲುಕಿಕೊಂಡಿದ್ದಾರೆ, ವೃದ್ಧರಿದ್ದಾರೆ.',
      detectedLanguage: 'Kannada',
      normalizedDescription: 'Flood waters entered near Kalyanpur Bridge in Udupi. Around 15 people are stranded, including elderly residents.',
      title: 'FLOOD near Kalyanpur Bridge, Udupi',
      incidentType: 'flood',
      locationText: 'Kalyanpur Bridge',
      district: 'Udupi',
      latitude: null,
      longitude: null,
      locationPrecision: 'unknown',
      peopleAtRiskEstimate: 15,
      immediateDanger: true,
      vulnerabilityFlags: ['elderly_present'],
      reportedAt: null,
      missingInformation: ['Precise GPS coordinates', 'Water height level'],
      uncertaintyNotes: ['Spoken location Kalyanpur Bridge requires local field verification'],
      fieldEvidence: ['Caller reports 15 stranded individuals and elderly present'],
    };

    const parsed = geminiVoiceExtractionSchema.parse(rawKannadaData);
    // Transcript must preserve the native Kannada script verbatim
    expect(parsed.transcript).toContain('ಉಡುಪಿಯ ಕಲ್ಯಾಣಪುರ ಸೇತುವೆ ಬಳಿ');
    expect(parsed.detectedLanguage).toBe('Kannada');
    // Normalized description must be in English for cross-agency response
    expect(parsed.normalizedDescription).toContain('Kalyanpur Bridge in Udupi');
    expect(parsed.vulnerabilityFlags).toContain('elderly_present');
    expect(parsed.peopleAtRiskEstimate).toBe(15);
  });

  it('validates Hindi language speech preserving Devanagari script and English normalization', () => {
    const rawHindiData = {
      transcript: 'बाढ़ का पानी घरों में घुस रहा है, बिजली के खंभे गिर गए हैं। दो परिवारों को तुरंत नाव की जरूरत है।',
      detectedLanguage: 'Hindi',
      normalizedDescription: 'Flood water entering houses and electric poles have collapsed. Two families urgently require rescue boats.',
      title: 'FLOOD with electrical hazard and trapped families',
      incidentType: 'flood',
      locationText: 'Near power sub-station',
      district: 'Patna Sector 4',
      latitude: 25.5941,
      longitude: 85.1376,
      locationPrecision: 'approximate',
      peopleAtRiskEstimate: 10,
      immediateDanger: true,
      vulnerabilityFlags: ['children_present'],
      reportedAt: null,
      missingInformation: ['Specific street address'],
      uncertaintyNotes: ['Sub-station area identified; specific house numbers unstated'],
      fieldEvidence: ['Caller reported fallen electric poles in flood waters'],
    };

    const parsed = geminiVoiceExtractionSchema.parse(rawHindiData);
    expect(parsed.transcript).toContain('बाढ़ का पानी घरों में घुस रहा है');
    expect(parsed.detectedLanguage).toBe('Hindi');
    expect(parsed.normalizedDescription).toContain('Flood water entering houses');
    expect(parsed.peopleAtRiskEstimate).toBe(10);
  });

  it('validates mixed-language multilingual speech (e.g. Tulu/Kannada/English code-switching)', () => {
    const rawMixedData = {
      transcript: 'ಬೋಳೂರು ಹತ್ತಿರ landslide ಆಗಿದೆ, road block ಆಗಿದೆ, medical emergency ಉಂಟು.',
      detectedLanguage: 'Kannada / Tulu / English',
      normalizedDescription: 'Landslide occurred near Boloor causing complete road blockage with an active medical emergency.',
      title: 'LANDSLIDE and Medical Emergency near Boloor',
      incidentType: 'landslide',
      locationText: 'Near Boloor',
      district: 'Dakshina Kannada',
      latitude: 12.8797,
      longitude: 74.8427,
      locationPrecision: 'approximate',
      peopleAtRiskEstimate: 3,
      immediateDanger: true,
      vulnerabilityFlags: ['medical_dependency', 'isolated_remote'],
      reportedAt: null,
      missingInformation: [],
      uncertaintyNotes: [],
      fieldEvidence: ['Caller stated road is blocked and patient requires urgent hospital transport'],
    };

    const parsed = geminiVoiceExtractionSchema.parse(rawMixedData);
    expect(parsed.detectedLanguage).toBe('Kannada / Tulu / English');
    expect(parsed.incidentType).toBe('landslide');
    expect(parsed.vulnerabilityFlags).toEqual(
      expect.arrayContaining(['medical_dependency', 'isolated_remote'])
    );
  });

  it('preserves null for immediateDanger when speech is ambiguous and does not coerce to false', () => {
    const ambiguousData = {
      transcript: 'Water has risen up to the sidewalk near the community center. People are watching.',
      detectedLanguage: 'English',
      normalizedDescription: 'Water up to sidewalk near community center. Observers present.',
      title: 'Water accumulation near Community Center',
      incidentType: 'flood',
      locationText: 'Community Center sidewalk',
      district: null,
      latitude: null,
      longitude: null,
      locationPrecision: 'unknown',
      peopleAtRiskEstimate: null,
      immediateDanger: null, // Crucial: ambiguous danger should remain null for human verification
      vulnerabilityFlags: [],
      reportedAt: null,
      missingInformation: ['Life-safety status', 'Is water entering buildings?'],
      uncertaintyNotes: ['Caller did not clarify if water is continuing to rise'],
      fieldEvidence: [],
    };

    const parsed = geminiVoiceExtractionSchema.parse(ambiguousData);
    expect(parsed.immediateDanger).toBeNull();
  });

  it('rejects malformed schema output with invalid latitude or coordinates mismatch', () => {
    const invalidCoordsData = {
      transcript: 'Fire reported on hill.',
      detectedLanguage: 'English',
      normalizedDescription: 'Wildfire spotted on northern hill slope.',
      title: 'Fire on hill',
      incidentType: 'fire',
      locationText: 'Northern hill',
      district: null,
      latitude: 145.2, // INVALID: latitude must be between -90 and 90
      longitude: 78.4,
      locationPrecision: 'approximate',
      peopleAtRiskEstimate: null,
      immediateDanger: true,
      vulnerabilityFlags: [],
      reportedAt: null,
      missingInformation: [],
      uncertaintyNotes: [],
      fieldEvidence: [],
    };

    expect(() => geminiVoiceExtractionSchema.parse(invalidCoordsData)).toThrow();
  });

  it('rejects extraction with unrecognized extra properties (strict schema)', () => {
    const dataWithExtraProps = {
      transcript: 'Medical help needed.',
      detectedLanguage: 'English',
      normalizedDescription: 'Medical assistance requested.',
      title: 'Medical help',
      incidentType: 'medical',
      locationText: null,
      district: null,
      latitude: null,
      longitude: null,
      locationPrecision: 'unknown',
      peopleAtRiskEstimate: 1,
      immediateDanger: true,
      vulnerabilityFlags: [],
      reportedAt: null,
      missingInformation: [],
      uncertaintyNotes: [],
      fieldEvidence: [],
      unauthorizedDispatchDecision: true, // Should be rejected by strict schema
    };

    expect(() => geminiVoiceExtractionSchema.parse(dataWithExtraProps)).toThrow();
  });

  it('enforces safety limit on empty audio upload', async () => {
    const emptyBlob = new Blob([], { type: 'audio/webm' });
    await expect(dataService.analyzeVoiceReport(emptyBlob)).rejects.toThrow(
      'Cannot analyze empty audio recording.'
    );
  });

  it('enforces safety limit on oversized audio upload (> 8MB)', async () => {
    // Create an 8.5 MB simulated blob
    const largeBuffer = new Uint8Array(8.5 * 1024 * 1024);
    const oversizedBlob = new Blob([largeBuffer], { type: 'audio/webm' });
    await expect(dataService.analyzeVoiceReport(oversizedBlob)).rejects.toThrow(
      'Audio file exceeds the 8 MB maximum upload limit.'
    );
  });
});
