import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { dataService } from '../src/lib/dataService.ts';

describe('User Requested Improvements Verification', () => {
  it('Requirement 4: Voice reporting UI components use simple, professional wording without AI model names', () => {
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

    // Ensure user-facing strings do not contain "Gemini 2.5", "Google Gemini", or provider names
    expect(voiceRecorderContent).not.toContain('Gemini 2.5');
    expect(voiceRecorderContent).not.toContain('Gemini 2.5 Flash');
    expect(voiceRecorderContent).not.toContain('Google Gemini');
    expect(voiceRecorderContent).not.toContain('Analyzing Speech with Google Gemini');
    expect(voiceRecorderContent).not.toContain('Analyze with Gemini');
    expect(voiceRecorderContent).not.toContain('Gemini detects speech automatically');
    expect(voiceRecorderContent).not.toContain('Failed to analyze voice recording with Google Gemini');

    // Confirm the exact required wording from prompt
    // Button: "Analyse Report"
    expect(voiceRecorderContent).toContain('Analyse Report');
    // Processing message: "Analysing your report..."
    expect(voiceRecorderContent).toContain('Analysing your report...');
    // Success message: "Your report has been analysed."
    expect(voiceRecorderContent).toContain('Your report has been analysed.');
    // Error message: "Unable to analyse your report. Please try again."
    expect(voiceRecorderContent).toContain('Unable to analyse your report. Please try again.');

    // Confirm EditableExtractionPreview header updated
    expect(extractionPreviewContent).not.toContain('Gemini AI Structured Draft');
    expect(extractionPreviewContent).toContain('Analysed Incident Summary');

    // Confirm EmergencyVoiceFAB updated
    expect(emergencyFabContent).not.toContain('Gemini AI auto-detects details');
    expect(emergencyFabContent).toContain('Audio is analysed automatically');
  });

  it('Requirement 1: IncidentTable uses table-fixed layout, sticky header, and stable column alignment', () => {
    const incidentTableContent = fs.readFileSync(
      path.resolve(__dirname, '../src/components/dashboard/IncidentTable.tsx'),
      'utf-8'
    );
    const tacticalControlContent = fs.readFileSync(
      path.resolve(__dirname, '../src/components/dashboard/TacticalDispatchControl.tsx'),
      'utf-8'
    );

    // Check table-fixed layout and colgroup
    expect(incidentTableContent).toContain('table-fixed');
    expect(incidentTableContent).toContain('<colgroup>');
    expect(incidentTableContent).toContain('sticky top-0');
    expect(incidentTableContent).not.toContain('group-hover:translate-x-0.5');

    // Check index.css has overscroll-behavior-x contain
    const indexCssContent = fs.readFileSync(
      path.resolve(__dirname, '../src/index.css'),
      'utf-8'
    );
    expect(indexCssContent).toContain('overscroll-behavior-x: contain');

    // TacticalDispatchControl renders standby state when null to prevent table layout shift
    expect(tacticalControlContent).toContain('Standby Mode');
  });

  it('Requirement 2: Automatic map initialization, tile stylesheet bundling, and real-time subscription', () => {
    expect(typeof dataService.subscribeToIncidents).toBe('function');

    const listener = vi.fn();
    const unsubscribe = dataService.subscribeToIncidents(listener);

    // Subscribing returns an unsubscription function
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();

    // Check leaflet css is imported directly in main.tsx
    const mainContent = fs.readFileSync(
      path.resolve(__dirname, '../src/main.tsx'),
      'utf-8'
    );
    expect(mainContent).toContain("import 'leaflet/dist/leaflet.css';");

    // Check DashboardMapPreview has MapAutoInitializer and fits bounds
    const mapPreviewContent = fs.readFileSync(
      path.resolve(__dirname, '../src/components/dashboard/DashboardMapPreview.tsx'),
      'utf-8'
    );
    expect(mapPreviewContent).toContain('MapAutoInitializer');
    expect(mapPreviewContent).toContain('fitBounds');
    expect(mapPreviewContent).toContain('invalidateSize');
  });
});
