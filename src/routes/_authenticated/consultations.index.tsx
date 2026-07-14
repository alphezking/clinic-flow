import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Stethoscope, ClipboardPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/consultations/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(waitingQuery());
    context.queryClient.ensureQueryData(recentQuery());
  },
  component: ConsultationsPage,
});

function waitingQuery() {
  return {
    queryKey: ["consultations", "waiting"],
    queryFn: async () => {
      const { data, error } = await supabase.from("queue_entries")
        .select("id, status, priority, queued_at, patient_id, patients(full_name, patient_number)")
        .in("status", ["waiting","with_nurse","with_doctor"])
        .order("priority", { ascending: false }).order("queued_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  } as const;
}
function recentQuery() {
  return {
    queryKey: ["consultations", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase.from("encounters")
        .select("id, started_at, chief_complaint, patient_id, patients(full_name, patient_number)")
        .order("started_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data ?? [];
    },
  } as const;
}

function ConsultationsPage() {
  const { data: waiting } = useSuspenseQuery(waitingQuery());
  const { data: recent } = useSuspenseQuery(recentQuery());

  return (
    <>
      <PageHeader
        title="Consultations"
        description="Start a consultation from the queue or view recent encounters."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Waiting</h3>
          {waiting.length === 0 ? (
            <EmptyState icon={<Stethoscope className="h-6 w-6" />} title="Queue is empty" description="No patients currently waiting." />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Since</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {waiting.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{(q.patients as { full_name?: string; patient_number?: string } | null)?.full_name}
                      <div className="text-xs text-muted-foreground">{(q.patients as { patient_number?: string } | null)?.patient_number}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(q.queued_at)}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{q.status.replace("_"," ")}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" asChild>
                        <Link to="/consultations/new" search={{ patient: q.patient_id, queue: q.id }}>
                          <ClipboardPlus className="mr-2 h-4 w-4" /> Start
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent encounters</h3>
          {recent.length === 0 ? (
            <EmptyState icon={<Stethoscope className="h-6 w-6" />} title="No encounters yet" description="Completed consultations will show here." />
          ) : (
            <ul className="divide-y">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{(e.patients as { full_name?: string } | null)?.full_name}</div>
                    <div className="text-xs text-muted-foreground">{e.chief_complaint || "—"}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(e.started_at)}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
