import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface UserProfile {
  user_role?: string;
  // أضف خصائص أخرى إذا احتجت
}

export interface AuthContext {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
}

export function useAuth(): AuthContext {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single()
          .then(({ data }) => {
            setProfile(data);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });
  }, []);

  return { user, profile, loading };
}
