import { createClient } from "@/lib/supabase/client";

const TITLES = ["Mr", "Mrs", "Miss", "Dr", "Prof"] as const;
type Title = (typeof TITLES)[number];

export interface RegisterValues {
  title: Title | "";
  first_name: string;
  last_name: string;
  other_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginValues {
  email: string;
  password: string;
}

export const register = async (values: RegisterValues): Promise<void> => {
  const supabase = createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        title: values.title,
        first_name: values.first_name,
        last_name: values.last_name,
        other_name: values.other_name || null,
      },
    },
  });

  if (authError) throw authError;

  if (authData.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email: values.email,
      title: values.title,
      first_name: values.first_name,
      last_name: values.last_name,
      other_name: values.other_name || null,
      phone: values.phone || null,
      created_at: new Date().toISOString(),
    });

    if (profileError) throw profileError;
  }
};

export const login = async (values: LoginValues): Promise<void> => {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });

  if (error) throw error;
};