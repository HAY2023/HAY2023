-- Fix admin_credentials security: block ALL public access
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- No RLS policies = no access (table is only accessed via SECURITY DEFINER functions)

-- Fix questions table: ensure no public SELECT access
-- Questions are only accessed via get_questions_authenticated SECURITY DEFINER function
-- The INSERT policy already exists, we just need to ensure no SELECT is possible

-- Create a restrictive SELECT policy that blocks all reads
CREATE POLICY "No public read access to questions"
ON public.questions
FOR SELECT
USING (false);