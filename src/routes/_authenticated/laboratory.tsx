import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/laboratory")({
  loader: ({ context }) => context.queryClient.ensureQueryData(labQuery()),
  component: LabPage,
});

function labQuery() {
  return {
    queryKey: ["lab", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_orders")
        .select("id, status, created_at, notes, patients(full_name, patient_number), lab_order_items(id, test_name, price)")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  } as const;
}

function LabPage() {
  const { data: orders } = useSuspenseQuery(labQuery());
  const qc = useQueryClient();

  async function updateStatus(id: string, status: string) {
    const patch: Record<string, unknown> = { status };
    if (status === "sample_collected") patch.sample_collected_at = new Date().toISOString();
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("lab_orders").update(patch as never).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["lab"] });
  }

  return (
    <>
      <PageHeader title="Laboratory" description="Track lab requests, samples and results." />
      <Card className="p-4">
        {orders.length === 0 ? (
          <EmptyState icon={<FlaskConical className="h-6 w-6" />} title="No lab orders" description="Doctors can order tests from a consultation." />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Patient</TableHead><TableHead>Tests</TableHead><TableHead>Ordered</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Update</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{(o.patients as { full_name?: string } | null)?.full_name}
                    <div className="text-xs text-muted-foreground">{(o.patients as { patient_number?: string } | null)?.patient_number}</div>
                  </TableCell>
                  <TableCell className="text-sm">{(o.lab_order_items ?? []).map((i) => i.test_name).join(", ")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{o.status.replace("_"," ")}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="ml-auto w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["requested","sample_collected","in_progress","completed","cancelled"].map((s) =>
                          <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
