-- إضافة أعمدة للحماية من Brute Force
ALTER TABLE public.admin_credentials 
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;

ALTER TABLE public.admin_credentials 
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- تحديث دالة التحقق من كلمة المرور مع حماية من Brute Force
CREATE OR REPLACE FUNCTION public.verify_admin_password(input_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  stored_hash TEXT;
  current_fails INTEGER;
  lock_until TIMESTAMPTZ;
BEGIN
  SELECT password_hash, failed_attempts, locked_until 
  INTO stored_hash, current_fails, lock_until 
  FROM public.admin_credentials LIMIT 1;
  
  -- فحص إذا كان الحساب مقفل
  IF lock_until IS NOT NULL AND lock_until > now() THEN
    RETURN false;
  END IF;
  
  -- مسح القفل إذا انتهى
  IF lock_until IS NOT NULL AND lock_until <= now() THEN
    UPDATE public.admin_credentials SET locked_until = NULL, failed_attempts = 0;
    current_fails := 0;
  END IF;
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- التحقق من كلمة المرور
  IF extensions.crypt(input_password, stored_hash) = stored_hash THEN
    UPDATE public.admin_credentials SET failed_attempts = 0, locked_until = NULL;
    RETURN true;
  ELSE
    current_fails := COALESCE(current_fails, 0) + 1;
    
    IF current_fails >= 5 THEN
      -- قفل الحساب 15 دقيقة بعد 5 محاولات فاشلة
      UPDATE public.admin_credentials SET 
        failed_attempts = current_fails,
        locked_until = now() + interval '15 minutes';
    ELSE
      UPDATE public.admin_credentials SET failed_attempts = current_fails;
    END IF;
    
    RETURN false;
  END IF;
END;
$$;

-- تأمين جدول notification_settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- حذف أي سياسات قديمة
DROP POLICY IF EXISTS "Anyone can read notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Block public read of notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Block direct notification settings inserts" ON public.notification_settings;
DROP POLICY IF EXISTS "Block direct notification settings updates" ON public.notification_settings;
DROP POLICY IF EXISTS "Block direct notification settings deletes" ON public.notification_settings;

-- إضافة سياسات منع الوصول المباشر
CREATE POLICY "Block public read of notification settings"
ON public.notification_settings
FOR SELECT
USING (false);

CREATE POLICY "Block direct notification settings inserts"
ON public.notification_settings 
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Block direct notification settings updates"
ON public.notification_settings 
FOR UPDATE
USING (false);

CREATE POLICY "Block direct notification settings deletes"
ON public.notification_settings 
FOR DELETE
USING (false);