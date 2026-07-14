import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  loader: ({ context }) => context.queryClient.ensureQueryData(auditQuery()),
  component: AuditPage,
});

function auditQuery() {
  return {
    queryKey: ["audit", "logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_logs")
        .select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  } as const;
}

function AuditPage() {
  const { data: logs } = useSuspenseQuery(auditQuery());
  return (
    <>
      <PageHeader title="Audit logs" description="Every important action performed in the system." />
      <Card className="p-4">
        {logs.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="h-6 w-6" />} title="No audit events yet" description="Actions like logins, patient changes and billing updates will appear here." />
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead></TableRow></TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(l.created_at)}</TableCell>
                  <TableCell className="text-sm">{l.actor_email ?? l.actor_id ?? "system"}</TableCell>
                  <TableCell><Badge variant="secondary">{l.action}</Badge></TableCell>
                  <TableCell className="text-sm">{l.entity}{l.entity_id ? ` · ${l.entity_id}` : ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
