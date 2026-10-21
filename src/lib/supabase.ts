import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.ts';

export const isSupabaseConfigured = config.supabase.isConfigured;

// Fallback dummy client if credentials are absent so application code doesn't throw on initialization
export const supabase = isSupabaseConfigured
  ? createClient(config.supabase.url, config.supabase.anonKey)
  : createClient('https://mock.supabase.co', 'mock-key', {
      auth: { persistSession: false },
    });
