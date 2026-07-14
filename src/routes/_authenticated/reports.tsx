import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComingSoon } from "@/components/empty-state";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports")({
  loader: ({ context }) => context.queryClient.ensureQueryData(reportQuery()),
  component: ReportsPage,
});

function reportQuery() {
  return {
    queryKey: ["reports", "overview"],
    queryFn: async () => {
      const start = new Date(); start.setDate(start.getDate() - 30);
      const iso = start.toISOString();
      const [patients, visits, invoices, labs, rx] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).gte("created_at", iso),
        supabase.from("encounters").select("id", { count: "exact", head: true }).gte("started_at", iso),
        supabase.from("invoices").select("amount_paid, balance").gte("created_at", iso),
        supabase.from("lab_orders").select("id", { count: "exact", head: true }).gte("created_at", iso),
        supabase.from("prescriptions").select("id", { count: "exact", head: true }).gte("created_at", iso),
      ]);
      const revenue = (invoices.data ?? []).reduce((s, i) => s + Number(i.amount_paid ?? 0), 0);
      const outstanding = (invoices.data ?? []).reduce((s, i) => s + Number(i.balance ?? 0), 0);
      return {
        newPatients: patients.count ?? 0,
        visits: visits.count ?? 0,
        labs: labs.count ?? 0,
        prescriptions: rx.count ?? 0,
        revenue, outstanding,
      };
    },
  } as const;
}

function ReportsPage() {
  const { data } = useSuspenseQuery(reportQuery());

  const cards = [
    { label: "New patients (30d)", value: data.newPatients },
    { label: "Consultations (30d)", value: data.visits },
    { label: "Lab orders (30d)", value: data.labs },
    { label: "Prescriptions (30d)", value: data.prescriptions },
    { label: "Revenue (30d)", value: formatCurrency(data.revenue) },
    { label: "Outstanding (30d)", value: formatCurrency(data.outstanding) },
  ];

  return (
    <>
      <PageHeader title="Reports" description="Operational and financial summaries." />
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{c.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <ComingSoon
          title="Detailed reports and exports"
          description="Advanced report builder — filtering, grouping, PDF/CSV export, and charts — is the next iteration. All aggregate data is already available in the tables above and via the normalized schema."
          points={[
            "Daily patient log with filters by department and doctor",
            "Monthly revenue breakdown by payment method",
            "Pharmacy consumption, low stock and expiry reports",
            "Laboratory throughput and abnormal result rate",
          ]}
        />
      </div>
    </>
  );
}
