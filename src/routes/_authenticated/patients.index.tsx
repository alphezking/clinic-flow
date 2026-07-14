import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDate, calculateAge } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/patients/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(patientsQuery());
  },
  component: PatientsPage,
});

function patientsQuery() {
  return {
    queryKey: ["patients", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, patient_number, full_name, gender, date_of_birth, phone, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  } as const;
}

function PatientsPage() {
  const { data: patients } = useSuspenseQuery(patientsQuery());
  const [q, setQ] = useState("");

  const filtered = patients.filter((p) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(needle) ||
      p.patient_number.toLowerCase().includes(needle) ||
      (p.phone ?? "").toLowerCase().includes(needle)
    );
  });

  return (
    <>
      <PageHeader
        title="Patients"
        description="Register, search and manage patient records."
        actions={
          <Button asChild>
            <Link to="/patients/new"><Plus className="mr-2 h-4 w-4" /> New patient</Link>
          </Button>
        }
      />

      <Card className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, MRN, or phone" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
          <div className="ml-auto text-xs text-muted-foreground">{filtered.length} of {patients.length}</div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={patients.length === 0 ? "No patients yet" : "No matches"}
            description={patients.length === 0 ? "Register your first patient to get started." : "Try a different search."}
            action={patients.length === 0 ? <Button asChild><Link to="/patients/new">Register patient</Link></Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MRN</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer">
                    <TableCell className="font-mono text-xs">
                      <Link to="/patients/$id" params={{ id: p.id }} className="hover:underline">{p.patient_number}</Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link to="/patients/$id" params={{ id: p.id }} className="hover:underline">{p.full_name}</Link>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{p.gender ?? "—"}</Badge></TableCell>
                    <TableCell>{calculateAge(p.date_of_birth)}</TableCell>
                    <TableCell>{p.phone ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(p.created_at)}</TableCell>
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
