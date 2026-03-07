import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, referralCode?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (referralCode?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data && !error) {
      setProfile(data);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        handleReferralAfterAuth();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
          await handleReferralAfterAuth();
        } else {
          setProfile(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReferralAfterAuth = async () => {
    // Check if there's a referral code in the URL after authentication
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode && !profile) {
      // Wait a bit for the profile to be created
      setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (userProfile && !userProfile.referred_by) {
            // Process referral
            const { data: referrer } = await supabase
              .from('profiles')
              .select('id')
              .eq('referral_code', refCode)
              .maybeSingle();

            if (referrer) {
              await supabase
                .from('profiles')
                .update({ referred_by: referrer.id })
                .eq('id', user.id);

              await supabase
                .from('referrals')
                .insert({
                  referrer_id: referrer.id,
                  referred_id: user.id,
                  points_earned: 10,
                });

              await supabase
                .from('profiles')
                .update({ points: supabase.rpc('increment', { x: 10 }) })
                .eq('id', referrer.id);

              // Remove referral code from URL
              const url = new URL(window.location.href);
              url.searchParams.delete('ref');
              window.history.replaceState({}, '', url.toString());
            }
          }
        }
      }, 1000);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, referralCode?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) throw error;

      if (data.user) {
        // Update full_name when we have a session (turn off "Confirm email" in Supabase if this never runs)
        if (data.session) {
          await supabase.from('profiles').update({ full_name: fullName }).eq('id', data.user.id);
        }
        if (referralCode && data.session) {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', referralCode)
            .maybeSingle();

          if (referrer) {
            await supabase
              .from('profiles')
              .update({ referred_by: referrer.id })
              .eq('id', data.user.id);

            await supabase
              .from('referrals')
              .insert({
                referrer_id: referrer.id,
                referred_id: data.user.id,
                points_earned: 10,
              });

            await supabase
              .from('profiles')
              .update({ points: supabase.rpc('increment', { x: 10 }) })
              .eq('id', referrer.id);
          }
        }
      }

      return { error: null };
    } catch (error) {
      const err = error as Error;
      if (err.message?.includes('fetch') || err.name === 'TypeError') {
        return {
          error: new Error(
            'Cannot reach Supabase. Add your real credentials to .env (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) from supabase.com/dashboard, then restart the dev server.'
          ),
        };
      }
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      const err = error as Error;
      if (err.message?.toLowerCase().includes('fetch') || err.name === 'TypeError') {
        return {
          error: new Error(
            'Cannot reach Supabase. Add your real credentials to .env (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) from supabase.com/dashboard, then restart the dev server.'
          ),
        };
      }
      return { error: err };
    }
  };

  const signInWithGoogle = async (referralCode?: string) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: referralCode ? { ref: referralCode } : undefined,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      const err = error as Error;
      if (err.message?.toLowerCase().includes('fetch') || err.name === 'TypeError') {
        return {
          error: new Error(
            'Cannot reach Supabase. Add your real credentials to .env (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) from supabase.com/dashboard, then restart the dev server.'
          ),
        };
      }
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
