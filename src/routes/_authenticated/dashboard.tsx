import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Users, Calendar, ListOrdered, FlaskConical, Pill, Receipt, TrendingUp, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ROLE_LABELS } from "@/lib/rbac";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(dashboardStatsQuery());
  },
  component: DashboardPage,
});

function dashboardStatsQuery() {
  return {
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const iso = today.toISOString();

      const [patients, appts, queue, labs, invoices, encounters] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }).gte("scheduled_at", iso),
        supabase.from("queue_entries").select("id", { count: "exact", head: true }).in("status", ["waiting", "with_nurse", "with_doctor"]),
        supabase.from("lab_orders").select("id", { count: "exact", head: true }).neq("status", "completed").neq("status", "cancelled"),
        supabase.from("invoices").select("total, amount_paid, status"),
        supabase.from("encounters").select("id, started_at, chief_complaint, patient_id, patients(full_name)").order("started_at", { ascending: false }).limit(5),
      ]);

      const revenueToday = (invoices.data ?? [])
        .filter((i) => i.status === "paid" || i.status === "partially_paid")
        .reduce((sum, i) => sum + Number(i.amount_paid ?? 0), 0);

      return {
        totalPatients: patients.count ?? 0,
        appointmentsToday: appts.count ?? 0,
        queueActive: queue.count ?? 0,
        pendingLabs: labs.count ?? 0,
        revenueToday,
        recentEncounters: encounters.data ?? [],
      };
    },
  } as const;
}

function DashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: stats } = useSuspenseQuery(dashboardStatsQuery());

  const primaryRole = user?.roles[0];

  const cards = [
    { label: "Total patients", value: stats.totalPatients, icon: Users, tone: "bg-primary/10 text-primary" },
    { label: "Appointments today", value: stats.appointmentsToday, icon: Calendar, tone: "bg-accent/15 text-accent" },
    { label: "Queue active", value: stats.queueActive, icon: ListOrdered, tone: "bg-warning/15 text-warning-foreground" },
    { label: "Pending lab orders", value: stats.pendingLabs, icon: FlaskConical, tone: "bg-chart-3/15 text-chart-3" },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.fullName?.split(" ")[0] ?? "team"}`}
        description={primaryRole ? `Signed in as ${ROLE_LABELS[primaryRole]}` : "Signed in"}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-semibold leading-none">{c.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{c.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent consultations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.recentEncounters.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No consultations yet.</p>
            ) : (
              <ul className="divide-y">
                {stats.recentEncounters.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <div className="font-medium">
                        {(e.patients as { full_name?: string } | null)?.full_name ?? "Patient"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-md">
                        {e.chief_complaint || "No chief complaint recorded"}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(e.started_at)}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Revenue today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex h-full flex-col justify-center py-4">
              <div className="text-3xl font-semibold">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(stats.revenueToday)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                From invoices marked paid or partially paid today.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              { href: "/patients/new", label: "Register patient", icon: Users },
              { href: "/appointments", label: "Book appointment", icon: Calendar },
              { href: "/queue", label: "Open queue", icon: ListOrdered },
              { href: "/pharmacy", label: "Pharmacy", icon: Pill },
              { href: "/billing", label: "Billing", icon: Receipt },
            ].map((q) => (
              <a key={q.href} href={q.href}
                className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/10 hover:text-accent">
                <q.icon className="h-4 w-4" />
                {q.label}
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
