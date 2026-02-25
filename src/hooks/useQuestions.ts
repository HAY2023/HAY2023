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

      // إرسال إشعار للمسؤولين عند استلام سؤال جديد
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            action: 'notify-admin',
            question: {
              category,
              question_text: question_text.slice(0, 100), // أول 100 حرف فقط
            }
          }
        });
      } catch (notifError) {
        // لا نوقف العملية إذا فشل إرسال الإشعار
        console.warn('Failed to send admin notification:', notifError);
      }
    },
  });
}
