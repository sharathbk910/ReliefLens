import { z } from 'zod';

export const reportChannelEnum = z.enum([
  'phone_call',
  'sms',
  'social_media',
  'sensor',
  'field_volunteer',
  'other',
]);

export const incidentTypeEnum = z.enum([
  'flood',
  'earthquake',
  'landslide',
  'fire',
  'medical',
  'shelter_request',
  'other',
]);

export const locationPrecisionEnum = z.enum([
  'exact',
  'approximate',
  'unknown',
]);

export const vulnerabilityFlagEnum = z.enum([
  'children_present',
  'elderly_present',
  'medical_dependency',
  'isolated_remote',
]);

export const incidentStatusEnum = z.enum([
  'new',
  'under_review',
  'confirmed',
  'resolved',
  'dismissed',
  'merged',
]);

export const verificationLevelEnum = z.enum([
  'unverified',
  'partially_corroborated',
  'corroborated',
  'coordinator_verified',
]);

export const userRoleEnum = z.enum(['admin', 'coordinator', 'viewer', 'reporter']);

export const locationSourceEnum = z.enum(['gps', 'voice', 'manual']);

/**
 * Report Ingestion Schema with cross-field validation.
 */
export const reportIngestionSchema = z
  .object({
    channel: reportChannelEnum,
    incident_type: incidentTypeEnum,
    description: z
      .string()
      .trim()
      .min(10, { message: 'Description must be at least 10 characters long.' })
      .max(5000, { message: 'Description must not exceed 5,000 characters.' }),
    reported_at: z
      .string()
      .refine(
        (val) => {
          const date = new Date(val);
          if (isNaN(date.getTime())) return false;
          const now = Date.now();
          const futureThreshold = now + 5 * 60 * 1000; // 5 mins in future
          const pastThreshold = now - 14 * 24 * 60 * 60 * 1000; // 14 days ago
          return date.getTime() <= futureThreshold && date.getTime() >= pastThreshold;
        },
        {
          message:
            'Reported time must be within the last 14 days and no more than 5 minutes in the future.',
        }
      ),
    location_text: z
      .string()
      .trim()
      .max(200, { message: 'Location text must be under 200 characters.' })
      .nullable()
      .optional(),
    district: z
      .string()
      .trim()
      .max(100, { message: 'District must be under 100 characters.' })
      .nullable()
      .optional(),
    latitude: z
      .number()
      .min(-90)
      .max(90)
      .nullable()
      .optional(),
    longitude: z
      .number()
      .min(-180)
      .max(180)
      .nullable()
      .optional(),
    location_precision: locationPrecisionEnum,
    people_at_risk_estimate: z
      .number()
      .int()
      .min(0, { message: 'Estimate must be 0 or greater.' })
      .max(100000, { message: 'Estimate must be under 100,000.' })
      .nullable()
      .optional(),
    immediate_danger: z.boolean().default(false),
    vulnerability_flags: z.array(vulnerabilityFlagEnum).default([]),
    external_reference: z
      .string()
      .trim()
      .max(100, { message: 'External reference must be under 100 characters.' })
      .nullable()
      .optional(),
    contact_name: z
      .string()
      .trim()
      .max(100, { message: 'Contact name must be under 100 characters.' })
      .nullable()
      .optional(),
    contact_phone: z
      .string()
      .trim()
      .max(20, { message: 'Contact phone must be under 20 characters.' })
      .nullable()
      .optional(),
    original_transcript: z.string().nullable().optional(),
    detected_language: z.string().nullable().optional(),
    normalized_description: z.string().nullable().optional(),
    location_source: locationSourceEnum.nullable().optional(),
    location_accuracy: z.number().nullable().optional(),
    location_captured_at: z.string().nullable().optional(),
    user_confirmed_incident_location: z.boolean().default(true),
  })
  .refine(
    (data) => {
      const hasLat = typeof data.latitude === 'number' && !isNaN(data.latitude);
      const hasLng = typeof data.longitude === 'number' && !isNaN(data.longitude);
      return (hasLat && hasLng) || (!hasLat && !hasLng);
    },
    {
      message: 'Latitude and longitude must either both be supplied or both be omitted.',
      path: ['latitude'],
    }
  )
  .refine(
    (data) => {
      if (data.location_precision === 'exact') {
        const hasLat = typeof data.latitude === 'number';
        const hasLng = typeof data.longitude === 'number';
        return hasLat && hasLng;
      }
      return true;
    },
    {
      message: 'Exact location precision requires valid coordinates.',
      path: ['location_precision'],
    }
  )
  .refine(
    (data) => {
      const hasCoords =
        typeof data.latitude === 'number' && typeof data.longitude === 'number';
      const hasText = Boolean(data.location_text && data.location_text.trim());
      if (!hasCoords && !hasText) {
        return data.location_precision === 'unknown';
      }
      return true;
    },
    {
      message:
        'If neither coordinates nor location description are available, precision must be "unknown".',
      path: ['location_precision'],
    }
  );

export type ReportIngestionInput = z.infer<typeof reportIngestionSchema>;

/**
 * Duplicate Review Schema
 */
export const reviewDuplicateSchema = z.object({
  candidate_id: z.string().uuid(),
  decision: z.enum(['confirmed', 'rejected']),
});

export type ReviewDuplicateInput = z.infer<typeof reviewDuplicateSchema>;

/**
 * Priority Override Schema
 */
export const overridePrioritySchema = z.object({
  incident_id: z.string().uuid(),
  override_score: z
    .number()
    .int()
    .min(0, { message: 'Score must be between 0 and 100.' })
    .max(100, { message: 'Score must be between 0 and 100.' })
    .nullable(),
  reason: z
    .string()
    .trim()
    .min(10, { message: 'Reason must be at least 10 characters long.' })
    .max(500, { message: 'Reason must not exceed 500 characters.' }),
});

export type OverridePriorityInput = z.infer<typeof overridePrioritySchema>;

/**
 * Status and Verification Update Schema
 */
export const updateIncidentStatusSchema = z
  .object({
    incident_id: z.string().uuid(),
    status: z.enum(['new', 'under_review', 'confirmed', 'resolved', 'dismissed']),
    verification_level: verificationLevelEnum.optional(),
    verification_reason: z
      .string()
      .trim()
      .min(10, { message: 'Verification reason must be at least 10 characters.' })
      .max(500)
      .optional(),
  })
  .refine(
    (data) => {
      if (data.verification_level === 'coordinator_verified') {
        return Boolean(data.verification_reason && data.verification_reason.length >= 10);
      }
      return true;
    },
    {
      message: 'A meaningful reason (10+ characters) is required for coordinator verification.',
      path: ['verification_reason'],
    }
  );

export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>;

/**
 * Gemini Multilingual Voice Extraction Response Schema (Section 7)
 */
export const geminiVoiceExtractionSchema = z
  .object({
    transcript: z.string().min(1, 'Transcript must not be empty.'),
    detectedLanguage: z.string().min(1, 'Detected language identifier must be specified.'),
    normalizedDescription: z.string().min(1, 'Normalized description must not be empty.'),
    title: z.string().min(3).max(200),
    incidentType: incidentTypeEnum,
    locationText: z.string().max(200).nullable(),
    district: z.string().max(100).nullable(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    locationPrecision: locationPrecisionEnum.default('unknown'),
    peopleAtRiskEstimate: z.number().int().min(0).max(100000).nullable(),
    immediateDanger: z.boolean().nullable(),
    vulnerabilityFlags: z.array(vulnerabilityFlagEnum).default([]),
    reportedAt: z.string().nullable(),
    missingInformation: z.array(z.string()).default([]),
    uncertaintyNotes: z.array(z.string()).default([]),
    fieldEvidence: z.array(z.string()).default([]),
  })
  .strict()
  .refine(
    (data) => {
      const hasLat = typeof data.latitude === 'number' && !isNaN(data.latitude);
      const hasLng = typeof data.longitude === 'number' && !isNaN(data.longitude);
      return (hasLat && hasLng) || (!hasLat && !hasLng);
    },
    {
      message: 'Latitude and longitude must either both be valid numbers or both be null.',
      path: ['latitude'],
    }
  );

export type GeminiVoiceExtraction = z.infer<typeof geminiVoiceExtractionSchema>;

