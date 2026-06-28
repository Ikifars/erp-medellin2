-- Disable the auto profile trigger that was breaking auth signup
-- because it could fail when the profiles table RLS policies were not satisfied.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
