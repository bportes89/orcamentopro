import type { Session, User } from "@supabase/supabase-js";

import { translateAuthError } from "@/lib/auth-errors";
import { createProfile } from "@/services/profiles";
import { supabase } from "@/services/supabase";

export type SignUpParams = {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
};

export type SignUpResult = {
  user: User;
  session: Session | null;
};

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(translateAuthError(error));
  }

  return data.session;
}

export function onAuthStateChange(
  callback: (session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
}

export async function signIn(
  email: string,
  senha: string,
): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    throw new Error(translateAuthError(error));
  }

  return data.session;
}

export async function signUp({
  nome,
  email,
  telefone,
  senha,
}: SignUpParams): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome, telefone } },
  });

  if (error) {
    throw new Error(translateAuthError(error));
  }

  if (!data.user) {
    throw new Error("Não foi possível criar a conta. Tente novamente.");
  }

  if (data.session) {
    await createProfile({
      id: data.user.id,
      nome,
      email: data.user.email ?? email,
      telefone,
    });
  }

  return { user: data.user, session: data.session };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(translateAuthError(error));
  }
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    throw new Error(translateAuthError(error));
  }
}
