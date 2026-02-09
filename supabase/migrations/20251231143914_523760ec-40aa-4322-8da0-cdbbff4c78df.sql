-- إنشاء دالة للتحقق من الإشعارات وإرسالها
CREATE OR REPLACE FUNCTION public.check_and_notify_questions()
RETURNS TRIGGER AS $$
DECLARE
  settings_record RECORD;
  question_count INTEGER;
BEGIN
  -- جلب إعدادات الإشعارات
  SELECT * INTO settings_record FROM public.notification_settings LIMIT 1;
  
  IF settings_record IS NULL OR NOT settings_record.notify_on_question THEN
    RETURN NEW;
  END IF;
  
  -- زيادة عداد الأسئلة منذ آخر إشعار
  UPDATE public.notification_settings 
  SET questions_since_last_notification = COALESCE(questions_since_last_notification, 0) + 1
  WHERE id = settings_record.id;
  
  -- التحقق مما إذا وصلنا إلى العدد المطلوب
  IF (COALESCE(settings_record.questions_since_last_notification, 0) + 1) >= COALESCE(settings_record.notify_every_n_questions, 10) THEN
    -- إعادة تعيين العداد
    UPDATE public.notification_settings 
    SET questions_since_last_notification = 0
    WHERE id = settings_record.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp';

-- إنشاء trigger على جدول الأسئلة
DROP TRIGGER IF EXISTS on_question_insert ON public.questions;
CREATE TRIGGER on_question_insert
  AFTER INSERT ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_notify_questions();