-- Create function to delete notification history
CREATE OR REPLACE FUNCTION public.delete_notification_authenticated(
  p_password TEXT,
  p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin password
  IF NOT public.verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Invalid admin password';
  END IF;
  
  -- Delete the notification
  DELETE FROM public.notification_history WHERE id = p_notification_id;
  
  RETURN TRUE;
END;
$$;