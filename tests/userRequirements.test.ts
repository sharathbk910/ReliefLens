import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { dataService } from '../src/lib/dataService.ts';

describe('User Requested Improvements Verification', () => {
  it('Issue 3: Voice reporting UI components do not expose Gemini model names to users', () => {
    const voiceRecorderContent = fs.readFileSync(
      path.resolve(__dirname, '../src/components/VoiceRecorder.tsx'),
      'utf-8'
    );
    const extractionPreviewContent = fs.readFileSync(
      path.resolve(__dirname, '../src/components/EditableExtractionPreview.tsx'),
      'utf-8'
    );
    const emergencyFabContent = fs.readFileSync(
      path.resolve(__dirname, '../src/components/emergency/EmergencyVoiceFAB.tsx'),
      'utf-8'
    );

    // Ensure user-facing strings do not contain "Gemini 2.5" or "Google Gemini"
    expect(voiceRecorderContent).not.toContain('Gemini 2.5 Flash');
    expect(voiceRecorderContent).not.toContain('Analyzing Speech with Google Gemini');
    expect(voiceRecorderContent).not.toContain('Analyze with Gemini');
    expect(voiceRecorderContent).not.toContain('Gemini detects speech automatically');
    expect(voiceRecorderContent).not.toContain('Failed to analyze voice recording with Google Gemini');

    // Confirm replaced professional wording exists
    expect(voiceRecorderContent).toContain('Analyse Report');
    expect(voiceRecorderContent).toContain('Analysing your report...');
    expect(voiceRecorderContent).toContain('Your report will be analysed automatically.');

    // Confirm EditableExtractionPreview header updated
    expect(extractionPreviewContent).not.toContain('Gemini AI Structured Draft');
    expect(extractionPreviewContent).toContain('Analysed Incident Summary');

    // Confirm EmergencyVoiceFAB updated
    expect(emergencyFabContent).not.toContain('Gemini AI auto-detects details');
    expect(emergencyFabContent).toContain('Audio is analysed automatically');
  });

  it('Issue 1: IncidentTable uses table-fixed layout and stable column alignment without jitter transforms', () => {
    const incidentTableContent = fs.readFileSync(
      path.resolve(__dirname, '../src/components/dashboard/IncidentTable.tsx'),
      'utf-8'
    );

    // Check table-fixed layout and colgroup
    expect(incidentTableContent).toContain('table-fixed');
    expect(incidentTableContent).toContain('<colgroup>');
    expect(incidentTableContent).not.toContain('group-hover:translate-x-0.5');

    // Check index.css has overscroll-behavior-x contain
    const indexCssContent = fs.readFileSync(
      path.resolve(__dirname, '../src/index.css'),
      'utf-8'
    );
    expect(indexCssContent).toContain('overscroll-behavior-x: contain');
  });

  it('Issue 2: dataService provides subscribeToIncidents for real-time automatic map updates', () => {
    expect(typeof dataService.subscribeToIncidents).toBe('function');

    const listener = vi.fn();
    const unsubscribe = dataService.subscribeToIncidents(listener);

    // Subscribing returns an unsubscription function
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});
