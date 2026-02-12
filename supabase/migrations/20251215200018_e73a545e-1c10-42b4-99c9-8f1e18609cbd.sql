-- Function to get questions authenticated (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_questions_authenticated(p_password text)
RETURNS TABLE (
  id uuid,
  category text,
  question_text text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT q.id, q.category, q.question_text, q.created_at 
  FROM public.questions q 
  ORDER BY q.created_at DESC;
END;
$$;

-- Enable realtime for questions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;