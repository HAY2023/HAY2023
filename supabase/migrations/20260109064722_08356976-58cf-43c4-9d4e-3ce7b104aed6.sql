-- Drop the is_user_blocked function first
DROP FUNCTION IF EXISTS public.is_user_blocked(text,text);

-- Recreate function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(
  p_ip_address TEXT DEFAULT NULL,
  p_fingerprint_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (p_ip_address IS NOT NULL AND ip_address = p_ip_address)
       OR (p_fingerprint_id IS NOT NULL AND fingerprint_id = p_fingerprint_id)
  );
END;
$$;