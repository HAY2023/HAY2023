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
      const { error } = await supabase
        .from('questions')
        .insert({ category, question_text });

      if (error) throw error;
    },
  });
}
