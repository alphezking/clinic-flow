import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: user } = useCurrentUser();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [pw, setPw] = useState({ current: "", next: "" });

  const { data: profile } = useSuspenseQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? "", phone: profile.phone ?? "" });
  }, [profile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, phone: form.phone || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["current-user"] });
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setPwLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    setPw({ current: "", next: "" });
  }

  return (
    <>
      <PageHeader title="Profile" description="Your account details and preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-3">
              <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary text-primary-foreground">{initials(user?.fullName)}</AvatarFallback></Avatar>
              <div>
                <div className="font-medium">{user?.fullName}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(user?.roles ?? []).map((r) => <Badge key={r} variant="secondary">{ROLE_LABELS[r]}</Badge>)}
                </div>
              </div>
            </div>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-2"><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} /></div>
              <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Change password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-4">
              <div className="space-y-2"><Label>New password</Label><Input type="password" minLength={8} required value={pw.next} onChange={(e) => setPw((s) => ({ ...s, next: e.target.value }))} /></div>
              <div className="flex justify-end"><Button type="submit" disabled={pwLoading}>{pwLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
