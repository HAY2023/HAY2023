-- حذف الدالة القديمة وإعادة إنشائها بالحقول الجديدة
DROP FUNCTION IF EXISTS public.get_questions_authenticated(text);

CREATE FUNCTION public.get_questions_authenticated(p_password text)
RETURNS TABLE(
  id uuid, 
  category text, 
  question_text text, 
  created_at timestamp with time zone,
  review_status text,
  reviewed_text text,
  reviewer_notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    q.id, q.category, q.question_text, q.created_at,
    q.review_status, q.reviewed_text, q.reviewer_notes
  FROM public.questions q 
  ORDER BY q.created_at DESC;
END;
$$;