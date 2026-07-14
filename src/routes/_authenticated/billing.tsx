import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/billing")({
  loader: ({ context }) => context.queryClient.ensureQueryData(invoicesQuery()),
  component: BillingPage,
});

function invoicesQuery() {
  return {
    queryKey: ["billing", "invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices")
        .select("id, invoice_number, status, total, amount_paid, balance, created_at, patients(full_name, patient_number)")
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  } as const;
}

function BillingPage() {
  const { data: invoices } = useSuspenseQuery(invoicesQuery());

  const revenue = invoices.reduce((s, i) => s + Number(i.amount_paid ?? 0), 0);
  const outstanding = invoices.reduce((s, i) => s + Number(i.balance ?? 0), 0);

  return (
    <>
      <PageHeader title="Billing" description="Invoices, payments and outstanding balances." />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card><CardContent className="py-5"><div className="text-xs text-muted-foreground">Total collected</div><div className="mt-1 text-2xl font-semibold">{formatCurrency(revenue)}</div></CardContent></Card>
        <Card><CardContent className="py-5"><div className="text-xs text-muted-foreground">Outstanding</div><div className="mt-1 text-2xl font-semibold text-destructive">{formatCurrency(outstanding)}</div></CardContent></Card>
        <Card><CardContent className="py-5"><div className="text-xs text-muted-foreground">Invoices</div><div className="mt-1 text-2xl font-semibold">{invoices.length}</div></CardContent></Card>
      </div>

      <Card className="p-4">
        {invoices.length === 0 ? (
          <EmptyState icon={<Receipt className="h-6 w-6" />} title="No invoices yet" description="Invoices generated at checkout will appear here." />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Invoice #</TableHead><TableHead>Patient</TableHead>
              <TableHead>Date</TableHead><TableHead>Total</TableHead>
              <TableHead>Paid</TableHead><TableHead>Balance</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                  <TableCell>{(inv.patients as { full_name?: string } | null)?.full_name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(inv.created_at)}</TableCell>
                  <TableCell>{formatCurrency(inv.total)}</TableCell>
                  <TableCell>{formatCurrency(inv.amount_paid)}</TableCell>
                  <TableCell>{formatCurrency(inv.balance)}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{inv.status.replace("_"," ")}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
