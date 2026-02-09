-- إضافة إعداد فلتر المحتوى
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS 
  content_filter_enabled BOOLEAN DEFAULT true;

-- إنشاء جدول سجل الإشعارات
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  sent_by TEXT DEFAULT 'admin',
  recipients_count INTEGER DEFAULT 0
);

-- تفعيل RLS
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- سياسات RLS - منع الوصول العام
CREATE POLICY "Block public access to notification history"
ON public.notification_history
FOR ALL
USING (false);

-- إضافة دالة لإضافة إشعار مع التحقق من كلمة المرور
CREATE OR REPLACE FUNCTION public.add_notification_authenticated(
  p_password TEXT,
  p_title TEXT,
  p_body TEXT,
  p_recipients_count INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  is_valid BOOLEAN;
  new_id UUID;
BEGIN
  SELECT public.verify_admin_password(p_password) INTO is_valid;
  
  IF NOT is_valid THEN
    RAISE EXCEPTION 'Invalid admin password';
  END IF;
  
  INSERT INTO public.notification_history (title, body, recipients_count)
  VALUES (p_title, p_body, p_recipients_count)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- دالة للحصول على سجل الإشعارات
CREATE OR REPLACE FUNCTION public.get_notification_history_authenticated(p_password TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  body TEXT,
  sent_at TIMESTAMPTZ,
  recipients_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  is_valid BOOLEAN;
BEGIN
  SELECT public.verify_admin_password(p_password) INTO is_valid;
  
  IF NOT is_valid THEN
    RAISE EXCEPTION 'Invalid admin password';
  END IF;
  
  RETURN QUERY
  SELECT nh.id, nh.title, nh.body, nh.sent_at, nh.recipients_count
  FROM public.notification_history nh
  ORDER BY nh.sent_at DESC
  LIMIT 50;
END;
$$;