-- Allow anyone to read active links by short_code (for redirect - no auth required)
CREATE POLICY "Public can read active links for redirect"
  ON public.links FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
