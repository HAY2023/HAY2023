-- 1. Add rate limiting to verify_security_password (similar to verify_admin_password)
-- First, add columns to admin_credentials for security password tracking
ALTER TABLE public.admin_credentials 
ADD COLUMN IF NOT EXISTS security_failed_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS security_locked_until TIMESTAMPTZ;

-- 2. Replace hardcoded password with bcrypt hash for security password
-- Create or update security_credentials table
CREATE TABLE IF NOT EXISTS public.security_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_credentials ENABLE ROW LEVEL SECURITY;

-- No public access to security credentials
CREATE POLICY "No public access to security_credentials" 
ON public.security_credentials FOR ALL 
USING (false);

-- Insert initial hashed password (20122025)
INSERT INTO public.security_credentials (password_hash)
SELECT extensions.crypt('20122025', extensions.gen_salt('bf'))
WHERE NOT EXISTS (SELECT 1 FROM public.security_credentials);

-- 3. Update verify_security_password to use bcrypt and rate limiting
CREATE OR REPLACE FUNCTION public.verify_security_password(input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  stored_hash TEXT;
  current_fails INTEGER;
  lock_until TIMESTAMPTZ;
  cred_id UUID;
BEGIN
  SELECT id, password_hash, failed_attempts, locked_until 
  INTO cred_id, stored_hash, current_fails, lock_until 
  FROM public.security_credentials LIMIT 1;
  
  -- Check if account is locked
  IF lock_until IS NOT NULL AND lock_until > now() THEN
    RETURN false;
  END IF;
  
  -- Clear lock if expired
  IF lock_until IS NOT NULL AND lock_until <= now() THEN
    UPDATE public.security_credentials 
    SET locked_until = NULL, failed_attempts = 0
    WHERE id = cred_id;
    current_fails := 0;
  END IF;
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify password
  IF extensions.crypt(input_password, stored_hash) = stored_hash THEN
    UPDATE public.security_credentials 
    SET failed_attempts = 0, locked_until = NULL
    WHERE id = cred_id;
    RETURN true;
  ELSE
    current_fails := COALESCE(current_fails, 0) + 1;
    
    IF current_fails >= 5 THEN
      -- Lock account for 15 minutes after 5 failed attempts
      UPDATE public.security_credentials 
      SET failed_attempts = current_fails,
          locked_until = now() + interval '15 minutes'
      WHERE id = cred_id;
    ELSE
      UPDATE public.security_credentials 
      SET failed_attempts = current_fails
      WHERE id = cred_id;
    END IF;
    
    RETURN false;
  END IF;
END;
$$;

-- 4. Create delete_user_report_authenticated function
CREATE OR REPLACE FUNCTION public.delete_user_report_authenticated(p_password text, p_report_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN false;
  END IF;
  
  DELETE FROM public.user_reports WHERE id = p_report_id;
  RETURN true;
END;
$$;