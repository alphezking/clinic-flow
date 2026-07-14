import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DatabaseBackup, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ComingSoon } from "@/components/empty-state";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/backups")({
  loader: ({ context }) => context.queryClient.ensureQueryData(backupsQuery()),
  component: BackupsPage,
});

function backupsQuery() {
  return {
    queryKey: ["backups", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("backups").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  } as const;
}

function BackupsPage() {
  const { data: backups } = useSuspenseQuery(backupsQuery());
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: "", notes: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("backups").insert({
      label: form.label, notes: form.notes || null, created_by: userData.user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Backup entry created");
    setOpen(false); setForm({ label: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["backups"] });
  }

  return (
    <>
      <PageHeader
        title="Backups"
        description="Application backup history managed by the clinic administrator."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New backup entry</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log a backup</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2"><Label>Label</Label><Input required value={form.label} onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} /></div>
                <DialogFooter><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4">
        <ComingSoon
          title="Automated backups and restore"
          description="Platform-level database snapshots and disaster recovery are managed by Alphez Digital Solutions (Super Admin). This page lets Clinic Administrators log application-level backup checkpoints and add notes. A future extension will trigger scheduled dumps and one-click restore via the platform."
        />
      </div>

      <Card className="p-4">
        {backups.length === 0 ? (
          <EmptyState icon={<DatabaseBackup className="h-6 w-6" />} title="No backup entries" description="Add a backup log entry to keep an operational record." />
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Label</TableHead><TableHead>Kind</TableHead><TableHead>When</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
            <TableBody>
              {backups.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.label}</TableCell>
                  <TableCell>{b.kind}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(b.created_at)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.notes ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
