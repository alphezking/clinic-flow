import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, CalendarPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/appointments")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(apptQuery());
    context.queryClient.ensureQueryData(refsQuery());
  },
  component: AppointmentsPage,
});

function apptQuery() {
  return {
    queryKey: ["appointments", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, scheduled_at, reason, status, is_walk_in, patient_id, department_id, patients(full_name, patient_number), departments(name)")
        .order("scheduled_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  } as const;
}
function refsQuery() {
  return {
    queryKey: ["appointments", "refs"],
    queryFn: async () => {
      const [patients, depts] = await Promise.all([
        supabase.from("patients").select("id, full_name, patient_number").is("deleted_at", null).order("full_name").limit(500),
        supabase.from("departments").select("id, name").eq("is_active", true).order("name"),
      ]);
      return { patients: patients.data ?? [], departments: depts.data ?? [] };
    },
  } as const;
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  scheduled: "secondary", checked_in: "outline", in_progress: "default",
  completed: "outline", cancelled: "destructive", no_show: "destructive",
};

function AppointmentsPage() {
  const { data: appts } = useSuspenseQuery(apptQuery());
  const { data: refs } = useSuspenseQuery(refsQuery());
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patient_id: "", department_id: "", scheduled_at: "", reason: "", is_walk_in: false });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patient_id || !form.scheduled_at) { toast.error("Patient and time required"); return; }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("appointments").insert({
      patient_id: form.patient_id,
      department_id: form.department_id || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      reason: form.reason || null,
      is_walk_in: form.is_walk_in,
      created_by: userData.user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Appointment created");
    setOpen(false);
    setForm({ patient_id: "", department_id: "", scheduled_at: "", reason: "", is_walk_in: false });
    qc.invalidateQueries({ queryKey: ["appointments"] });
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("appointments").update({ status: status as never }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["appointments"] });
  }

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Schedule and track patient visits."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New appointment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New appointment</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient *</Label>
                  <Select value={form.patient_id} onValueChange={(v) => setForm((s) => ({ ...s, patient_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {refs.patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.patient_number})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={form.department_id} onValueChange={(v) => setForm((s) => ({ ...s, department_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {refs.departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scheduled at *</Label>
                  <Input type="datetime-local" required value={form.scheduled_at} onChange={(e) => setForm((s) => ({ ...s, scheduled_at: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea rows={2} value={form.reason} onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_walk_in} onChange={(e) => setForm((s) => ({ ...s, is_walk_in: e.target.checked }))} />
                  Walk-in
                </label>
                <DialogFooter>
                  <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-4">
        {appts.length === 0 ? (
          <EmptyState icon={<CalendarPlus className="h-6 w-6" />} title="No appointments" description="Book the first appointment to get started." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{formatDateTime(a.scheduled_at)}{a.is_walk_in && <Badge variant="outline" className="ml-2">Walk-in</Badge>}</TableCell>
                    <TableCell>{(a.patients as { full_name?: string } | null)?.full_name ?? "—"}</TableCell>
                    <TableCell>{(a.departments as { name?: string } | null)?.name ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{a.reason ?? "—"}</TableCell>
                    <TableCell><Badge variant={statusVariant[a.status] ?? "secondary"} className="capitalize">{a.status.replace("_"," ")}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v)}>
                        <SelectTrigger className="ml-auto w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["scheduled","checked_in","in_progress","completed","cancelled","no_show"].map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </>
  );
}
