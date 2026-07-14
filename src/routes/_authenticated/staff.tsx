import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { UserCog, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ComingSoon } from "@/components/empty-state";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/staff")({
  loader: ({ context }) => context.queryClient.ensureQueryData(staffQuery()),
  component: StaffPage,
});

function staffQuery() {
  return {
    queryKey: ["staff", "list"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, is_active, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("id, user_id, role"),
      ]);
      const rolesByUser = new Map<string, { id: string; role: AppRole }[]>();
      for (const r of roles ?? []) {
        const list = rolesByUser.get(r.user_id) ?? [];
        list.push({ id: r.id, role: r.role as AppRole });
        rolesByUser.set(r.user_id, list);
      }
      return (profiles ?? []).map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] }));
    },
  } as const;
}

function StaffPage() {
  const { data: staff } = useSuspenseQuery(staffQuery());
  const qc = useQueryClient();
  const [addingFor, setAddingFor] = useState<string | null>(null);

  async function addRole(userId: string, role: AppRole) {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) { toast.error(error.message); return; }
    toast.success("Role added");
    setAddingFor(null);
    qc.invalidateQueries({ queryKey: ["staff"] });
  }

  async function removeRole(rid: string) {
    const { error } = await supabase.from("user_roles").delete().eq("id", rid);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["staff"] });
  }

  return (
    <>
      <PageHeader title="Staff" description="Manage clinic staff and assigned roles." />

      <div className="mb-4">
        <ComingSoon
          title="Creating new staff accounts"
          description="For security, new staff sign up themselves via the /auth page — the first ever signup automatically becomes Clinic Administrator; subsequent signups default to Receptionist. Admins can then add or remove any role below. A future extension can hook this into a server-side admin-invite flow that emails temporary credentials."
        />
      </div>

      <Card className="p-4">
        {staff.length === 0 ? (
          <EmptyState icon={<UserCog className="h-6 w-6" />} title="No staff yet" />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Email</TableHead>
              <TableHead>Roles</TableHead><TableHead className="w-64">Add role</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.roles.map((r) => (
                        <Badge key={r.id} variant="secondary" className="gap-1">
                          {ROLE_LABELS[r.role]}
                          <button type="button" onClick={() => removeRole(r.id)} className="ml-1 opacity-60 hover:opacity-100">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {s.roles.length === 0 && <span className="text-xs text-muted-foreground">No roles</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {addingFor === s.id ? (
                      <Select onValueChange={(v) => addRole(s.id, v as AppRole)}>
                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                          {APP_ROLES.filter((r) => !s.roles.some((sr) => sr.role === r)).map((r) => (
                            <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setAddingFor(s.id)}>Add role</Button>
                    )}
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
