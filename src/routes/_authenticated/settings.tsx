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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery()),
  component: SettingsPage,
});

function settingsQuery() {
  return {
    queryKey: ["settings"],
    queryFn: async () => {
      const [{ data: settings }, { data: depts }] = await Promise.all([
        supabase.from("clinic_settings").select("*").limit(1).maybeSingle(),
        supabase.from("departments").select("*").order("name"),
      ]);
      return { settings, departments: depts ?? [] };
    },
  } as const;
}

function SettingsPage() {
  const { data } = useSuspenseQuery(settingsQuery());
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clinic_name: "", address: "", phone: "", email: "", currency: "USD", default_consultation_fee: "0",
  });
  useEffect(() => {
    if (data.settings) setForm({
      clinic_name: data.settings.clinic_name ?? "",
      address: data.settings.address ?? "",
      phone: data.settings.phone ?? "",
      email: data.settings.email ?? "",
      currency: data.settings.currency ?? "USD",
      default_consultation_fee: String(data.settings.default_consultation_fee ?? 0),
    });
  }, [data.settings]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!data.settings) return;
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("clinic_settings").update({
      clinic_name: form.clinic_name, address: form.address, phone: form.phone,
      email: form.email, currency: form.currency,
      default_consultation_fee: Number(form.default_consultation_fee),
      updated_by: userData.user?.id,
    }).eq("id", data.settings.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }

  return (
    <>
      <PageHeader title="Settings" description="Clinic profile and configuration." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Clinic profile</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={save} className="grid gap-4">
              <div className="space-y-2"><Label>Clinic name</Label><Input value={form.clinic_name} onChange={(e) => setForm((s) => ({ ...s, clinic_name: e.target.value }))} /></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} /></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Default consultation fee</Label><Input type="number" step="0.01" value={form.default_consultation_fee} onChange={(e) => setForm((s) => ({ ...s, default_consultation_fee: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Departments</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Fee</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.departments.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>${Number(d.consultation_fee).toFixed(2)}</TableCell>
                    <TableCell>{d.is_active ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
