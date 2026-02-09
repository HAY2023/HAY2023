-- Add a policy that blocks all access to admin_credentials
-- This table is only accessed via SECURITY DEFINER functions
CREATE POLICY "No direct access to admin credentials"
ON public.admin_credentials
FOR ALL
USING (false);