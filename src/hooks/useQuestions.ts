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

      try {
        const preview = question_text.trim();
        const snippet = preview.length > 80 ? `${preview.slice(0, 80)}...` : preview;
        await supabase.functions.invoke('send-notification', {
          body: {
            action: 'notify-new-question',
            notification: {
              title: 'سؤال جديد',
              body: `فئة: ${category}\n${snippet}`,
            }
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send new question notification:', notifyError);
      }
    },
  });
}
