import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FlashMessage {
  id: string;
  message: string;
  text_direction: 'rtl' | 'ltr';
  color: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  font_size?: 'sm' | 'md' | 'lg' | 'xl' | null;
}

export function useFlashMessages() {
  return useQuery({
    queryKey: ['flash_messages'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('flash_messages')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filter messages based on date range
      const filtered = (data as FlashMessage[]).filter(msg => {
        const now = new Date();
        if (msg.start_date && new Date(msg.start_date) > now) return false;
        if (msg.end_date && new Date(msg.end_date) < now) return false;
        return true;
      });
      
      return filtered;
    },
  });
}

export function useAllFlashMessages() {
  return useQuery({
    queryKey: ['flash_messages_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FlashMessage[];
    },
  });
}

export function useAddFlashMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { 
      password: string; 
      message: string; 
      text_direction?: string;
      color?: string;
      start_date?: string | null;
      end_date?: string | null;
      font_size?: 'sm' | 'md' | 'lg' | 'xl';
    }) => {
      const { data, error } = await supabase.rpc('add_flash_message_authenticated', {
        p_password: params.password,
        p_message: params.message,
        p_text_direction: params.text_direction || 'rtl',
        p_color: params.color || '#3b82f6',
        p_start_date: params.start_date || null,
        p_end_date: params.end_date || null,
        p_font_size: params.font_size || 'md',
      });
      
      if (error) throw error;
      return data as string | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash_messages'] });
      queryClient.invalidateQueries({ queryKey: ['flash_messages_all'] });
    },
  });
}

export function useDeleteFlashMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { password: string; flashMessageId: string }) => {
      const { data, error } = await supabase.rpc('delete_flash_message_authenticated', {
        p_password: params.password,
        p_flash_message_id: params.flashMessageId,
      });
      
      if (error) throw error;
      return data as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash_messages'] });
      queryClient.invalidateQueries({ queryKey: ['flash_messages_all'] });
    },
  });
}
