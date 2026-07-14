import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pill, Plus, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/pharmacy")({
  loader: ({ context }) => context.queryClient.ensureQueryData(medsQuery()),
  component: PharmacyPage,
});

function medsQuery() {
  return {
    queryKey: ["pharmacy", "meds"],
    queryFn: async () => {
      const { data, error } = await supabase.from("medications")
        .select("id, name, generic_name, form, strength, unit, reorder_level, unit_price, supplier, is_active, medication_batches(quantity, expiry_date)")
        .order("name");
      if (error) throw error;
      return (data ?? []).map((m) => {
        const batches = m.medication_batches ?? [];
        const stock = batches.reduce((s, b) => s + (b.quantity ?? 0), 0);
        const nextExpiry = batches
          .map((b) => b.expiry_date).filter(Boolean)
          .sort()[0] ?? null;
        return { ...m, stock, nextExpiry };
      });
    },
  } as const;
}

function PharmacyPage() {
  const { data: meds } = useSuspenseQuery(medsQuery());
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", generic_name: "", form: "", strength: "", unit: "", reorder_level: "10", unit_price: "0", supplier: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("medications").insert({
      name: form.name, generic_name: form.generic_name || null, form: form.form || null,
      strength: form.strength || null, unit: form.unit || null,
      reorder_level: Number(form.reorder_level), unit_price: Number(form.unit_price),
      supplier: form.supplier || null, created_by: userData.user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Medication added");
    setOpen(false);
    setForm({ name: "", generic_name: "", form: "", strength: "", unit: "", reorder_level: "10", unit_price: "0", supplier: "" });
    qc.invalidateQueries({ queryKey: ["pharmacy"] });
  }

  const lowStock = meds.filter((m) => m.stock <= m.reorder_level).length;

  return (
    <>
      <PageHeader
        title="Pharmacy"
        description={`${meds.length} medications · ${lowStock} at/below reorder level`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New medication</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add medication</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2"><Label>Name *</Label><Input required value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Generic</Label><Input value={form.generic_name} onChange={(e) => setForm((s) => ({ ...s, generic_name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Form</Label><Input placeholder="tablet, syrup..." value={form.form} onChange={(e) => setForm((s) => ({ ...s, form: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Strength</Label><Input placeholder="500mg" value={form.strength} onChange={(e) => setForm((s) => ({ ...s, strength: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Unit</Label><Input placeholder="tab, ml" value={form.unit} onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Reorder level</Label><Input type="number" value={form.reorder_level} onChange={(e) => setForm((s) => ({ ...s, reorder_level: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Unit price</Label><Input type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm((s) => ({ ...s, unit_price: e.target.value }))} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Supplier</Label><Input value={form.supplier} onChange={(e) => setForm((s) => ({ ...s, supplier: e.target.value }))} /></div>
                <DialogFooter className="md:col-span-2"><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-4">
        {meds.length === 0 ? (
          <EmptyState icon={<Pill className="h-6 w-6" />} title="No medications" description="Add your first medication to the pharmacy inventory." />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Form / Strength</TableHead>
              <TableHead>Stock</TableHead><TableHead>Reorder at</TableHead>
              <TableHead>Price</TableHead><TableHead>Next expiry</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {meds.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="font-medium">{m.name}</div>
                    {m.generic_name && <div className="text-xs text-muted-foreground">{m.generic_name}</div>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{[m.form, m.strength].filter(Boolean).join(" · ")}</TableCell>
                  <TableCell>
                    <span className="font-mono">{m.stock}</span> {m.unit}
                    {m.stock <= m.reorder_level && (
                      <Badge variant="destructive" className="ml-2"><AlertTriangle className="mr-1 h-3 w-3" /> Low</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{m.reorder_level}</TableCell>
                  <TableCell>${Number(m.unit_price).toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.nextExpiry ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
