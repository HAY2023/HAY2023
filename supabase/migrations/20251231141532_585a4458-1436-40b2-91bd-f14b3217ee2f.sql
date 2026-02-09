-- إضافة الأعمدة الجديدة
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS hardware_concurrency INTEGER;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS device_memory REAL;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS network_type TEXT;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS isp TEXT;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS fingerprint_id TEXT;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS latitude REAL;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS longitude REAL;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS asn TEXT;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS org TEXT;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS postal TEXT;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS connection_type TEXT;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS touch_support BOOLEAN;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS color_depth INTEGER;
ALTER TABLE public.admin_access_logs ADD COLUMN IF NOT EXISTS pixel_ratio REAL;

-- حذف الدالة القديمة وإعادة إنشائها
DROP FUNCTION IF EXISTS public.log_admin_access;

CREATE FUNCTION public.log_admin_access(
  p_ip_address TEXT,
  p_country TEXT,
  p_city TEXT,
  p_device_type TEXT,
  p_browser TEXT,
  p_os TEXT,
  p_screen_size TEXT,
  p_is_authorized BOOLEAN,
  p_password_attempted BOOLEAN DEFAULT false,
  p_user_agent TEXT DEFAULT NULL,
  p_timezone TEXT DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_hardware_concurrency INTEGER DEFAULT NULL,
  p_device_memory REAL DEFAULT NULL,
  p_network_type TEXT DEFAULT NULL,
  p_isp TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_fingerprint_id TEXT DEFAULT NULL,
  p_latitude REAL DEFAULT NULL,
  p_longitude REAL DEFAULT NULL,
  p_asn TEXT DEFAULT NULL,
  p_org TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_postal TEXT DEFAULT NULL,
  p_connection_type TEXT DEFAULT NULL,
  p_touch_support BOOLEAN DEFAULT NULL,
  p_color_depth INTEGER DEFAULT NULL,
  p_pixel_ratio REAL DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.admin_access_logs (
    ip_address, country, city, device_type, browser, os, screen_size, 
    is_authorized, password_attempted, user_agent, timezone, language,
    hardware_concurrency, device_memory, network_type, isp, referrer,
    fingerprint_id, latitude, longitude, asn, org, region, postal,
    connection_type, touch_support, color_depth, pixel_ratio
  ) VALUES (
    p_ip_address, p_country, p_city, p_device_type, p_browser, p_os, p_screen_size,
    p_is_authorized, p_password_attempted, p_user_agent, p_timezone, p_language,
    p_hardware_concurrency, p_device_memory, p_network_type, p_isp, p_referrer,
    p_fingerprint_id, p_latitude, p_longitude, p_asn, p_org, p_region, p_postal,
    p_connection_type, p_touch_support, p_color_depth, p_pixel_ratio
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$function$;