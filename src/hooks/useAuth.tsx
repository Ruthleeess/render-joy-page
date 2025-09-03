import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (emailOrUsername: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      console.log('Starting signup with email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            username: username
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        return { error };
      }

      // If email confirmation is disabled, session is returned. If not, try to auto sign in.
      if (!data?.session) {
        console.log('No session returned on signup; attempting auto sign-in...');
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          console.error('Auto sign-in after signup failed:', signInError);
          return { error: signInError };
        }
      }

      console.log('Signup (and auto sign-in if needed) completed');
      return { error: null };
    } catch (error) {
      console.error('Signup catch error:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      let email = emailOrUsername;
      
      // Check if input is username (doesn't contain @)
      if (!emailOrUsername.includes('@')) {
        console.log('Looking up username:', emailOrUsername);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', emailOrUsername)
          .maybeSingle();
        
        if (profileError) {
          console.error('Profile lookup error:', profileError);
          return { error: new Error('Error looking up username') };
        }
        
        if (profile?.email) {
          email = profile.email;
          console.log('Found email for username:', email);
        } else {
          console.log('Username not found in profiles');
          return { error: new Error('Username not found') };
        }
      }

      console.log('Attempting sign in with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase sign in error:', error);
        return { error };
      }

      console.log('Sign in successful:', data);
      return { error: null };
    } catch (error) {
      console.error('Sign in catch error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      signUp,
      signIn,
      signOut,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};