-- حذف الدالة القديمة أولاً
DROP FUNCTION IF EXISTS public.get_admin_access_logs_authenticated(text);

-- إعادة إنشاء الدالة مع الأعمدة الجديدة
CREATE OR REPLACE FUNCTION public.get_admin_access_logs_authenticated(p_password text)
RETURNS TABLE(
  id uuid, 
  accessed_at timestamp with time zone, 
  ip_address text, 
  country text, 
  city text, 
  device_type text, 
  browser text, 
  os text, 
  screen_size text, 
  is_authorized boolean, 
  password_attempted boolean,
  user_agent text,
  timezone text,
  language text,
  hardware_concurrency integer,
  device_memory real,
  network_type text,
  isp text,
  referrer text,
  fingerprint_id text,
  latitude real,
  longitude real,
  asn text,
  org text,
  region text,
  postal text,
  connection_type text,
  touch_support boolean,
  color_depth integer,
  pixel_ratio real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    a.id, a.accessed_at, a.ip_address, a.country, a.city, 
    a.device_type, a.browser, a.os, a.screen_size, a.is_authorized, a.password_attempted,
    a.user_agent, a.timezone, a.language, a.hardware_concurrency, a.device_memory,
    a.network_type, a.isp, a.referrer, a.fingerprint_id, a.latitude, a.longitude,
    a.asn, a.org, a.region, a.postal, a.connection_type, a.touch_support,
    a.color_depth, a.pixel_ratio
  FROM public.admin_access_logs a
  ORDER BY a.accessed_at DESC
  LIMIT 100;
END;
$function$;