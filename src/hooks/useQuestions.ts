import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Question {
  id: string;
  category: string;
  question_text: string;
  created_at: string;
}

export function useSubmitQuestion() {
  return useMutation({
    mutationFn: async ({ category, question_text }: { category: string; question_text: string }) => {
      const { data, error } = await supabase
        .from('questions')
        .insert({ category, question_text })
        .select('id')
        .single();

      if (error) throw error;

      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            action: 'notify-new-question',
            question_id: data?.id,
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send new question notification:', notifyError);
      }
    },
  });
}