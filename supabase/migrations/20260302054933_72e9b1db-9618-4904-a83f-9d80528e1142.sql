
CREATE OR REPLACE FUNCTION public.check_admin_lock_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  current_fails INTEGER;
  lock_until TIMESTAMPTZ;
  remaining_seconds INTEGER;
BEGIN
  SELECT failed_attempts, locked_until 
  INTO current_fails, lock_until 
  FROM public.admin_credentials LIMIT 1;
  
  IF lock_until IS NOT NULL AND lock_until > now() THEN
    remaining_seconds := EXTRACT(EPOCH FROM (lock_until - now()))::INTEGER;
    RETURN jsonb_build_object(
      'is_locked', true,
      'remaining_seconds', remaining_seconds,
      'failed_attempts', current_fails
    );
  END IF;
  
  RETURN jsonb_build_object(
    'is_locked', false,
    'remaining_seconds', 0,
    'failed_attempts', COALESCE(current_fails, 0)
  );
END;
$function$;
