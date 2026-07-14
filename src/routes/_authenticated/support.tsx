import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LifeBuoy, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/support")({
  loader: ({ context }) => context.queryClient.ensureQueryData(ticketsQuery()),
  component: SupportPage,
});

function ticketsQuery() {
  return {
    queryKey: ["support", "tickets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("support_tickets")
        .select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  } as const;
}

function SupportPage() {
  const { data: tickets } = useSuspenseQuery(ticketsQuery());
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", category: "other" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("support_tickets").insert({
      subject: form.subject, description: form.description,
      category: form.category as never, created_by: userData.user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Support request submitted");
    setOpen(false);
    setForm({ subject: "", description: "", category: "other" });
    qc.invalidateQueries({ queryKey: ["support"] });
  }

  return (
    <>
      <PageHeader
        title="Support Center"
        description="Submit and track support requests to Alphez Digital Solutions."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New request</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New support request</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2"><Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((s) => ({ ...s, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Bug report</SelectItem>
                      <SelectItem value="feature_request">Feature request</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="technical_issue">Technical issue</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Subject</Label><Input required value={form.subject} onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea rows={5} required value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} /></div>
                <DialogFooter><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-4">
        {tickets.length === 0 ? (
          <EmptyState icon={<LifeBuoy className="h-6 w-6" />} title="No support requests" description="Submit a ticket to report an issue or request a feature." />
        ) : (
          <ul className="divide-y">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{t.category.replace("_"," ")}</Badge>
                    <span className="font-medium truncate">{t.subject}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                  <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(t.created_at)}</div>
                </div>
                <Badge className="capitalize" variant={t.status === "resolved" ? "secondary" : "default"}>{t.status.replace("_"," ")}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
