import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string, displayName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const adminCheckCacheRef = useRef<Map<string, boolean>>(new Map());

  // Check if user has plan with allow_admin_mode (permissions based ONLY on plan)
  const checkAdminRole = useCallback(async (userId: string) => {
    // Check cache first
    if (adminCheckCacheRef.current.has(userId)) {
      setIsAdmin(adminCheckCacheRef.current.get(userId)!);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_plans')
        .select('plan_id, plan_definitions(allow_admin_mode)')
        .eq('user_id', userId)
        .maybeSingle();

      const hasAdminMode = !error && !!data?.plan_definitions?.allow_admin_mode;
      setIsAdmin(hasAdminMode);
      
      // Cache the result
      adminCheckCacheRef.current.set(userId, hasAdminMode);
    } catch (error) {
      console.error('Error checking admin mode:', error);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    console.log('AuthContext: Setting up auth listener');
    
    // Set up auth state listener (NON-ASYNC to prevent deadlock)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthContext: Auth state changed', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin role immediately (no setTimeout delay)
        if (session?.user) {
          checkAdminRole(session.user.id);
        } else {
          setIsAdmin(false);
        }
        
        // Set loading to false
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('AuthContext: Initial session check', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin role immediately
        if (session?.user) {
          checkAdminRole(session.user.id);
        } else {
          setIsAdmin(false);
        }
      })
      .catch((error) => {
        console.error('AuthContext: getSession error', error);
      })
      .finally(() => {
        setLoading(false);
      });

    // Safety timeout - ensure loading never gets stuck (5s for stability)
    const safetyTimeout = setTimeout(() => {
      console.warn('AuthContext: Safety timeout triggered');
      setLoading(false);
    }, 5000);

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username,
          display_name: displayName || email
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signUp, signOut }}>
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