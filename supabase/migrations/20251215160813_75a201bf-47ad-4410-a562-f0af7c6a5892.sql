-- Enable RLS on admin_credentials and block all direct access
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- No SELECT policy = no one can read directly (access via SECURITY DEFINER functions only)
-- This protects password hashes from being exposed

-- For questions table: No SELECT policy needed
-- Questions are intentionally not readable by anyone (privacy by design)
-- Admin only sees COUNT via authenticated function, not actual question content
-- This is a deliberate design decision per project requirements