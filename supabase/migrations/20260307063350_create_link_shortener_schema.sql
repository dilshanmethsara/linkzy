/*
  # Link Shortener Application Schema

  ## Overview
  Complete database schema for a full-featured link shortener application with user management,
  analytics tracking, referral system, and admin capabilities.

  ## New Tables
  
  ### 1. profiles
  - `id` (uuid, FK to auth.users)
  - `email` (text)
  - `full_name` (text)
  - `is_admin` (boolean) - Admin role flag
  - `is_blocked` (boolean) - Block status
  - `points` (integer) - Referral/reward points
  - `referral_code` (text, unique) - User's referral code
  - `referred_by` (uuid, nullable) - FK to profiles
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. links
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `short_code` (text, unique) - The short alias
  - `original_url` (text) - Target URL
  - `title` (text, nullable) - Optional link title
  - `qr_code_url` (text, nullable) - QR code data URL
  - `clicks` (integer) - Total click count
  - `is_premium` (boolean) - Premium link flag
  - `is_active` (boolean) - Active/inactive status
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. clicks
  - `id` (uuid, PK)
  - `link_id` (uuid, FK to links)
  - `clicked_at` (timestamptz)
  - `country` (text, nullable) - Visitor country
  - `device` (text, nullable) - Device type (mobile/desktop/tablet)
  - `browser` (text, nullable) - Browser name
  - `referrer` (text, nullable) - Referrer URL
  - `ip_hash` (text, nullable) - Hashed IP for privacy

  ### 4. referrals
  - `id` (uuid, PK)
  - `referrer_id` (uuid, FK to profiles) - Who referred
  - `referred_id` (uuid, FK to profiles) - Who was referred
  - `points_earned` (integer) - Points earned from referral
  - `created_at` (timestamptz)

  ### 5. transactions
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `type` (text) - withdrawal/payment/reward
  - `amount` (decimal)
  - `status` (text) - pending/approved/rejected
  - `notes` (text, nullable)
  - `created_at` (timestamptz)
  - `processed_at` (timestamptz, nullable)

  ## Security
  - RLS enabled on all tables
  - Users can read/update their own profile
  - Users can CRUD their own links
  - Users can view their own clicks/analytics
  - Admins have full access to all tables
  - Public can increment click counts (for redirect functionality)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  is_admin boolean DEFAULT false,
  is_blocked boolean DEFAULT false,
  points integer DEFAULT 0,
  referral_code text UNIQUE NOT NULL,
  referred_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create links table
CREATE TABLE IF NOT EXISTS links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  short_code text UNIQUE NOT NULL,
  original_url text NOT NULL,
  title text,
  qr_code_url text,
  clicks integer DEFAULT 0,
  is_premium boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clicks table
CREATE TABLE IF NOT EXISTS clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid REFERENCES links(id) ON DELETE CASCADE NOT NULL,
  clicked_at timestamptz DEFAULT now(),
  country text,
  device text,
  browser text,
  referrer text,
  ip_hash text
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  points_earned integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Links policies
CREATE POLICY "Users can view own links"
  ON links FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Users can create own links"
  ON links FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own links"
  ON links FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own links"
  ON links FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all links"
  ON links FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Clicks policies
CREATE POLICY "Users can view clicks for their links"
  ON clicks FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM links WHERE links.id = clicks.link_id AND links.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Anyone can insert clicks"
  ON clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all clicks"
  ON clicks FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Referrals policies
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "System can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, referral_code)
  VALUES (NEW.id, NEW.email, generate_referral_code());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update link click count
CREATE OR REPLACE FUNCTION increment_link_clicks()
RETURNS trigger AS $$
BEGIN
  UPDATE links SET clicks = clicks + 1 WHERE id = NEW.link_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_click_inserted
  AFTER INSERT ON clicks
  FOR EACH ROW
  EXECUTE FUNCTION increment_link_clicks();