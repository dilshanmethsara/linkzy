-- 1) Allow auth trigger to insert into profiles (RLS was blocking it)
DROP POLICY IF EXISTS "Allow auth trigger to create profile" ON public.profiles;
CREATE POLICY "Allow auth trigger to create profile"
  ON public.profiles FOR INSERT
  TO supabase_auth_admin
  WITH CHECK (true);

-- 2) Trigger: create profile on signup. search_path so RLS sees correct role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, referral_code)
  VALUES (NEW.id, NEW.email, public.generate_referral_code());
  RETURN NEW;
END;
$$;
