import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, ListOrdered, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/queue")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(queueQuery());
    context.queryClient.ensureQueryData(queueRefsQuery());
  },
  component: QueuePage,
});

function queueQuery() {
  return {
    queryKey: ["queue", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("queue_entries")
        .select("id, status, priority, queued_at, notes, patient_id, department_id, patients(full_name, patient_number), departments(name)")
        .in("status", ["waiting","with_nurse","with_doctor"])
        .order("priority", { ascending: false }).order("queued_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  } as const;
}
function queueRefsQuery() {
  return {
    queryKey: ["queue", "refs"],
    queryFn: async () => {
      const [patients, depts] = await Promise.all([
        supabase.from("patients").select("id, full_name, patient_number").is("deleted_at", null).order("full_name").limit(500),
        supabase.from("departments").select("id, name").eq("is_active", true).order("name"),
      ]);
      return { patients: patients.data ?? [], departments: depts.data ?? [] };
    },
  } as const;
}

function QueuePage() {
  const { data: queue } = useSuspenseQuery(queueQuery());
  const { data: refs } = useSuspenseQuery(queueRefsQuery());
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patient_id: "", department_id: "", priority: "0", notes: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patient_id) return;
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("queue_entries").insert({
      patient_id: form.patient_id,
      department_id: form.department_id || null,
      priority: Number(form.priority),
      notes: form.notes || null,
      created_by: userData.user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Added to queue");
    setOpen(false);
    setForm({ patient_id: "", department_id: "", priority: "0", notes: "" });
    qc.invalidateQueries({ queryKey: ["queue"] });
  }

  async function updateStatus(id: string, status: string) {
    const patch: Record<string, unknown> = { status };
    if (status === "completed") patch.completed_at = new Date().toISOString();
    if (status === "with_doctor" || status === "with_nurse") patch.called_at = new Date().toISOString();
    const { error } = await supabase.from("queue_entries").update(patch as never).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["queue"] });
  }

  return (
    <>
      <PageHeader
        title="Patient queue"
        description="Track patients waiting for triage, nurse, and doctor."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add to queue</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add to queue</DialogTitle></DialogHeader>
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
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm((s) => ({ ...s, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Normal</SelectItem>
                      <SelectItem value="1">Urgent</SelectItem>
                      <SelectItem value="2">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} /></div>
                <DialogFooter><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-4">
        {queue.length === 0 ? (
          <EmptyState icon={<ListOrdered className="h-6 w-6" />} title="Queue is empty" description="Add walk-ins or check-in scheduled patients." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Since</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Move to</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      {q.priority === 2 ? <Badge variant="destructive">Emergency</Badge>
                        : q.priority === 1 ? <Badge className="bg-warning text-warning-foreground">Urgent</Badge>
                        : <Badge variant="secondary">Normal</Badge>}
                    </TableCell>
                    <TableCell className="font-medium">{(q.patients as { full_name?: string } | null)?.full_name ?? "—"}</TableCell>
                    <TableCell>{(q.departments as { name?: string } | null)?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(q.queued_at)}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{q.status.replace("_"," ")}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Select value={q.status} onValueChange={(v) => updateStatus(q.id, v)}>
                        <SelectTrigger className="ml-auto w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["waiting","with_nurse","with_doctor","completed","cancelled"].map((s) => (
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
