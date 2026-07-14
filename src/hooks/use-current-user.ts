import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/rbac";

export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string;
  avatarUrl: string | null;
  roles: AppRole[];
}

export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ["current-user"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const [{ data: profile }, { data: roleRows }] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      return {
        id: user.id,
        email: user.email ?? null,
        fullName: profile?.full_name || user.email?.split("@")[0] || "User",
        avatarUrl: profile?.avatar_url ?? null,
        roles: (roleRows ?? []).map((r) => r.role as AppRole),
      };
    },
  });
}
