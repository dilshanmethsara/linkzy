import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('your-project') ||
  supabaseAnonKey.includes('your-anon');

export const hasSupabaseConfig = !isPlaceholder;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  is_blocked: boolean;
  points: number;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Link = {
  id: string;
  user_id: string;
  short_code: string;
  original_url: string;
  title: string | null;
  qr_code_url: string | null;
  clicks: number;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Click = {
  id: string;
  link_id: string;
  clicked_at: string;
  country: string | null;
  device: string | null;
  browser: string | null;
  referrer: string | null;
  ip_hash: string | null;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string;
  points_earned: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  processed_at: string | null;
};
