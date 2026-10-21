/**
 * ReliefLens Centralized Environment & App Configuration
 * Validates, types, and separates environment configuration from application logic.
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

interface MapConfig {
  tileUrl: string;
  defaultCenter: [number, number];
  defaultZoom: number;
}

interface AIConfig {
  model: string;
  apiKey: string;
  hasClientKey: boolean;
}

interface AppConfig {
  name: string;
  version: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

export interface Config {
  app: AppConfig;
  supabase: SupabaseConfig;
  map: MapConfig;
  ai: AIConfig;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://YOUR_PROJECT.supabase.co' &&
    !supabaseUrl.includes('YOUR_PROJECT')
);

const clientGeminiKey =
  typeof window !== 'undefined'
    ? localStorage.getItem('relieflens_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || ''
    : import.meta.env.VITE_GEMINI_API_KEY || '';

export const config: Config = {
  app: {
    name: 'ReliefLens',
    version: '1.0.0',
    isProduction: Boolean(import.meta.env.PROD),
    isDevelopment: Boolean(import.meta.env.DEV),
  },
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    isConfigured: isSupabaseConfigured,
  },
  map: {
    tileUrl:
      import.meta.env.VITE_MAP_TILE_URL ||
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    defaultCenter: [12.9716, 77.5946],
    defaultZoom: 12,
  },
  ai: {
    model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash',
    apiKey: clientGeminiKey,
    hasClientKey: Boolean(clientGeminiKey && clientGeminiKey.trim()),
  },
};

export default config;
