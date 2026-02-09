import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Question {
  id: string;
  category: string;
  question_text: string;
  created_at: string;
  review_status: string | null;
  reviewed_text: string | null;
  reviewer_notes: string | null;
}

export interface AccessLog {
  id: string;
  accessed_at: string;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  screen_size: string | null;
  is_authorized: boolean | null;
  password_attempted: boolean | null;
  user_agent: string | null;
  timezone: string | null;
  language: string | null;
  hardware_concurrency: number | null;
  device_memory: number | null;
  network_type: string | null;
  isp: string | null;
  referrer: string | null;
  fingerprint_id: string | null;
  latitude: number | null;
  longitude: number | null;
  asn: string | null;
  org: string | null;
  region: string | null;
  postal: string | null;
  connection_type: string | null;
  touch_support: boolean | null;
  color_depth: number | null;
  pixel_ratio: number | null;
}

export function useGetQuestionsAuthenticated() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await supabase.rpc('get_questions_authenticated', {
        p_password: password
      });
      
      if (error) throw error;
      return data as Question[];
    },
  });
}

export function useGetAccessLogsAuthenticated() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await supabase.rpc('get_admin_access_logs_authenticated', {
        p_password: password
      });
      
      if (error) throw error;
      return data as AccessLog[];
    },
  });
}
