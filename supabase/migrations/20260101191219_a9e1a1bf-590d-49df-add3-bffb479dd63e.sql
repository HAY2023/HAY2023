-- إنشاء جدول المستخدمين المحظورين
CREATE TABLE public.blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT,
  fingerprint_id TEXT,
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT now(),
  blocked_by TEXT DEFAULT 'admin'
);

-- تفعيل RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- سياسة منع الوصول العام
CREATE POLICY "No public access to blocked users" ON public.blocked_users
FOR ALL USING (false);

-- دالة التحقق من الحظر
CREATE OR REPLACE FUNCTION public.is_user_blocked(p_ip TEXT, p_fingerprint TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users 
    WHERE ip_address = p_ip OR fingerprint_id = p_fingerprint
  );
$$;

-- دالة التحقق من كلمة مرور سجل الحماية
CREATE OR REPLACE FUNCTION public.verify_security_password(input_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  RETURN input_password = '20122025';
END;
$$;

-- دالة حظر مستخدم
CREATE OR REPLACE FUNCTION public.block_user_authenticated(
  p_password TEXT,
  p_ip_address TEXT,
  p_fingerprint_id TEXT,
  p_reason TEXT DEFAULT 'VPN/Proxy detected'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  new_id UUID;
BEGIN
  IF NOT public.verify_security_password(p_password) THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO public.blocked_users (ip_address, fingerprint_id, reason)
  VALUES (p_ip_address, p_fingerprint_id, p_reason)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- دالة إلغاء حظر مستخدم
CREATE OR REPLACE FUNCTION public.unblock_user_authenticated(p_password TEXT, p_blocked_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.verify_security_password(p_password) THEN
    RETURN false;
  END IF;
  
  DELETE FROM public.blocked_users WHERE id = p_blocked_id;
  RETURN true;
END;
$$;

-- دالة جلب المستخدمين المحظورين
CREATE OR REPLACE FUNCTION public.get_blocked_users_authenticated(p_password TEXT)
RETURNS TABLE(id UUID, ip_address TEXT, fingerprint_id TEXT, reason TEXT, blocked_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.verify_security_password(p_password) THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT b.id, b.ip_address, b.fingerprint_id, b.reason, b.blocked_at
  FROM public.blocked_users b
  ORDER BY b.blocked_at DESC;
END;
$$;

-- دالة حذف سجل دخول
CREATE OR REPLACE FUNCTION public.delete_access_log_authenticated(p_password TEXT, p_log_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.verify_security_password(p_password) THEN
    RETURN false;
  END IF;
  
  DELETE FROM public.admin_access_logs WHERE id = p_log_id;
  RETURN true;
END;
$$;

-- دالة جلب سجلات الدخول لصفحة الحماية
CREATE OR REPLACE FUNCTION public.get_security_logs_authenticated(p_password TEXT)
RETURNS TABLE(
  id UUID, accessed_at TIMESTAMPTZ, ip_address TEXT, country TEXT, city TEXT, 
  device_type TEXT, browser TEXT, os TEXT, is_authorized BOOLEAN, 
  password_attempted BOOLEAN, fingerprint_id TEXT, isp TEXT, org TEXT,
  timezone TEXT, language TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.verify_security_password(p_password) THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    a.id, a.accessed_at, a.ip_address, a.country, a.city, 
    a.device_type, a.browser, a.os, a.is_authorized, a.password_attempted,
    a.fingerprint_id, a.isp, a.org, a.timezone, a.language
  FROM public.admin_access_logs a
  ORDER BY a.accessed_at DESC
  LIMIT 200;
END;
$$;