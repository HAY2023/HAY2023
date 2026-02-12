import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';

export function QuestionCounter() {
  const { t } = useTranslation();
  
  const { data: count } = useQuery({
    queryKey: ['public-questions-count'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_questions_count');
      if (error) throw error;
      return data as number;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (count === undefined || count === null) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-4">
      <MessageSquare className="w-4 h-4" />
      <span>
        {count} {t('form.questionsReceived')}
      </span>
    </div>
  );
}
