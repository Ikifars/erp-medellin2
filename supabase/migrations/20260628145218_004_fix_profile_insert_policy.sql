-- Drop existing profile policies
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;

-- Create new policy that allows insert during signup (auth.uid() = id) or by trigger
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Also allow anon users to insert their own profile during signup
CREATE POLICY "insert_profile_on_signup" ON profiles FOR INSERT
  TO anon WITH CHECK (true);