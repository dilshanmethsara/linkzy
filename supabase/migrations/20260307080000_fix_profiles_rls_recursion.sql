-- Fix infinite recursion: policies on profiles (and other tables) were reading from profiles
-- for the admin check, which re-triggered profiles policies. Use a SECURITY DEFINER helper
-- that reads profiles without going through RLS.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true);
$$;

-- Drop and recreate profiles policies (no more SELECT from profiles inside them)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Links: replace admin check with is_admin() and ensure insert/update/delete for own links
DROP POLICY IF EXISTS "Users can view own links" ON public.links;
DROP POLICY IF EXISTS "Users can create own links" ON public.links;
DROP POLICY IF EXISTS "Users can update own links" ON public.links;
DROP POLICY IF EXISTS "Users can delete own links" ON public.links;
DROP POLICY IF EXISTS "Admins can manage all links" ON public.links;

CREATE POLICY "Users can view own links"
  ON public.links FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create own links"
  ON public.links FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own links"
  ON public.links FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own links"
  ON public.links FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all links"
  ON public.links FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Clicks
DROP POLICY IF EXISTS "Users can view clicks for their links" ON public.clicks;
DROP POLICY IF EXISTS "Admins can view all clicks" ON public.clicks;

CREATE POLICY "Users can view clicks for their links"
  ON public.clicks FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.links WHERE links.id = clicks.link_id AND links.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Admins can view all clicks"
  ON public.clicks FOR SELECT TO authenticated
  USING (public.is_admin());

-- Referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;

CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.is_admin());

-- Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage all transactions"
  ON public.transactions FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
