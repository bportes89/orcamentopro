import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import {
  getSession,
  onAuthStateChange,
  resetPassword as resetPasswordRequest,
  signIn as signInRequest,
  signOut as signOutRequest,
  signUp as signUpRequest,
  type SignUpParams,
} from "@/services/auth";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let receivedAuthEvent = false;

    getSession()
      .then((nextSession) => {
        if (active && !receivedAuthEvent) {
          setSession(nextSession);
        }
      })
      .catch(() => {
        if (active && !receivedAuthEvent) {
          setSession(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    const unsubscribe = onAuthStateChange((nextSession) => {
      if (!active) {
        return;
      }

      receivedAuthEvent = true;
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, senha: string) => {
    await signInRequest(email, senha);
  }, []);

  const signUp = useCallback(async (params: SignUpParams) => {
    return signUpRequest(params);
  }, []);

  const signOut = useCallback(async () => {
    await signOutRequest();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await resetPasswordRequest(email);
  }, []);

  return {
    user: session?.user ?? null,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
