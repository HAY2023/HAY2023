-- Fix verify_admin_password function - add WHERE clause to all UPDATE statements
CREATE OR REPLACE FUNCTION public.verify_admin_password(input_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  stored_hash TEXT;
  current_fails INTEGER;
  lock_until TIMESTAMPTZ;
  cred_id UUID;
BEGIN
  SELECT id, password_hash, failed_attempts, locked_until 
  INTO cred_id, stored_hash, current_fails, lock_until 
  FROM public.admin_credentials LIMIT 1;
  
  -- فحص إذا كان الحساب مقفل
  IF lock_until IS NOT NULL AND lock_until > now() THEN
    RETURN false;
  END IF;
  
  -- مسح القفل إذا انتهى
  IF lock_until IS NOT NULL AND lock_until <= now() THEN
    UPDATE public.admin_credentials 
    SET locked_until = NULL, failed_attempts = 0
    WHERE id = cred_id;
    current_fails := 0;
  END IF;
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- التحقق من كلمة المرور
  IF extensions.crypt(input_password, stored_hash) = stored_hash THEN
    UPDATE public.admin_credentials 
    SET failed_attempts = 0, locked_until = NULL
    WHERE id = cred_id;
    RETURN true;
  ELSE
    current_fails := COALESCE(current_fails, 0) + 1;
    
    IF current_fails >= 5 THEN
      -- قفل الحساب 15 دقيقة بعد 5 محاولات فاشلة
      UPDATE public.admin_credentials 
      SET failed_attempts = current_fails,
          locked_until = now() + interval '15 minutes'
      WHERE id = cred_id;
    ELSE
      UPDATE public.admin_credentials 
      SET failed_attempts = current_fails
      WHERE id = cred_id;
    END IF;
    
    RETURN false;
  END IF;
END;
$function$;

-- Create user_reports table for problem reporting
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  message TEXT NOT NULL,
  email TEXT,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert reports
CREATE POLICY "Anyone can report problems"
ON public.user_reports FOR INSERT
WITH CHECK (true);

-- Block public read access
CREATE POLICY "No public read access to reports"
ON public.user_reports FOR SELECT
USING (false);

-- Create authenticated function to get reports
CREATE OR REPLACE FUNCTION public.get_user_reports_authenticated(p_password text)
RETURNS TABLE(
  id uuid,
  report_type text,
  message text,
  email text,
  device_info jsonb,
  created_at timestamptz,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    r.id, r.report_type, r.message, r.email, r.device_info, r.created_at, r.status
  FROM public.user_reports r
  ORDER BY r.created_at DESC
  LIMIT 100;
END;
$$;

-- Create function to update report status
CREATE OR REPLACE FUNCTION public.update_report_status_authenticated(
  p_password text,
  p_report_id uuid,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  UPDATE public.user_reports 
  SET status = p_status
  WHERE id = p_report_id;
  
  RETURN true;
END;
$$;