import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone, Mail, MapPin, Stethoscope, FlaskConical, Pill, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { calculateAge, formatDate, formatDateTime, initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/patients/$id")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(patientQuery(params.id));
  },
  component: PatientDetailPage,
});

function patientQuery(id: string) {
  return {
    queryKey: ["patient", id],
    queryFn: async () => {
      const [patient, encounters, prescriptions, labOrders, invoices] = await Promise.all([
        supabase.from("patients").select("*").eq("id", id).single(),
        supabase.from("encounters").select("id, started_at, chief_complaint, assessment, plan").eq("patient_id", id).order("started_at", { ascending: false }).limit(20),
        supabase.from("prescriptions").select("id, created_at, status, notes, prescription_items(medication_name, dosage, frequency, quantity)").eq("patient_id", id).order("created_at", { ascending: false }).limit(20),
        supabase.from("lab_orders").select("id, created_at, status, notes, lab_order_items(test_name)").eq("patient_id", id).order("created_at", { ascending: false }).limit(20),
        supabase.from("invoices").select("id, invoice_number, status, total, amount_paid, balance, created_at").eq("patient_id", id).order("created_at", { ascending: false }).limit(20),
      ]);
      if (patient.error) throw patient.error;
      return {
        patient: patient.data,
        encounters: encounters.data ?? [],
        prescriptions: prescriptions.data ?? [],
        labOrders: labOrders.data ?? [],
        invoices: invoices.data ?? [],
      };
    },
  } as const;
}

function PatientDetailPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(patientQuery(id));
  const p = data.patient;

  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild><Link to="/patients"><ArrowLeft className="mr-2 h-4 w-4" /> All patients</Link></Button>
      </div>
      <PageHeader
        title={p.full_name}
        description={`MRN ${p.patient_number} · Registered ${formatDate(p.created_at)}`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary text-primary-foreground">{initials(p.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{p.full_name}</div>
                <div className="text-xs text-muted-foreground capitalize">{p.gender ?? "—"} · {calculateAge(p.date_of_birth)}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {p.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {p.phone}</div>}
            {p.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {p.email}</div>}
            {p.address && <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /> <span>{p.address}</span></div>}
            <div className="grid grid-cols-2 gap-2 pt-3 text-xs">
              <div className="rounded border p-2"><div className="text-muted-foreground">DOB</div><div className="font-medium">{formatDate(p.date_of_birth)}</div></div>
              <div className="rounded border p-2"><div className="text-muted-foreground">Blood group</div><div className="font-medium">{p.blood_group || "—"}</div></div>
            </div>
            {p.allergies && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
                <div className="mb-1 font-semibold text-destructive">Allergies</div>
                <div>{p.allergies}</div>
              </div>
            )}
            {p.chronic_conditions && (
              <div className="rounded-md border p-3 text-xs">
                <div className="mb-1 font-semibold">Chronic conditions</div>
                <div>{p.chronic_conditions}</div>
              </div>
            )}
            {(p.emergency_contact_name || p.emergency_contact_phone) && (
              <div className="rounded-md border p-3 text-xs">
                <div className="mb-1 font-semibold">Emergency contact</div>
                <div>{p.emergency_contact_name} {p.emergency_contact_relation ? `(${p.emergency_contact_relation})` : ""}</div>
                <div className="text-muted-foreground">{p.emergency_contact_phone}</div>
              </div>
            )}
            {(p.insurance_provider || p.insurance_number) && (
              <div className="rounded-md border p-3 text-xs">
                <div className="mb-1 font-semibold">Insurance</div>
                <div>{p.insurance_provider}</div>
                <div className="text-muted-foreground">{p.insurance_number}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="visits">
            <TabsList>
              <TabsTrigger value="visits"><Stethoscope className="mr-2 h-4 w-4" /> Visits</TabsTrigger>
              <TabsTrigger value="prescriptions"><Pill className="mr-2 h-4 w-4" /> Prescriptions</TabsTrigger>
              <TabsTrigger value="labs"><FlaskConical className="mr-2 h-4 w-4" /> Labs</TabsTrigger>
              <TabsTrigger value="billing"><Receipt className="mr-2 h-4 w-4" /> Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="visits">
              <Card>
                <CardHeader><CardTitle className="text-base">Consultation history</CardTitle></CardHeader>
                <CardContent>
                  {data.encounters.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No consultations yet.</p>
                  ) : (
                    <ul className="divide-y">
                      {data.encounters.map((e) => (
                        <li key={e.id} className="py-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{e.chief_complaint || "Consultation"}</span>
                            <span className="text-xs text-muted-foreground">{formatDateTime(e.started_at)}</span>
                          </div>
                          {e.assessment && <p className="mt-1 text-sm text-muted-foreground"><b>Assessment:</b> {e.assessment}</p>}
                          {e.plan && <p className="mt-1 text-sm text-muted-foreground"><b>Plan:</b> {e.plan}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prescriptions">
              <Card><CardContent className="pt-6">
                {data.prescriptions.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No prescriptions.</p>
                ) : (
                  <ul className="divide-y">
                    {data.prescriptions.map((rx) => (
                      <li key={rx.id} className="py-3">
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="outline" className="capitalize">{rx.status.replace("_"," ")}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(rx.created_at)}</span>
                        </div>
                        <ul className="mt-2 space-y-1 text-sm">
                          {(rx.prescription_items ?? []).map((it, i) => (
                            <li key={i}>• {it.medication_name} — {it.dosage} · {it.frequency} · qty {it.quantity}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="labs">
              <Card><CardContent className="pt-6">
                {data.labOrders.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No lab orders.</p>
                ) : (
                  <ul className="divide-y">
                    {data.labOrders.map((o) => (
                      <li key={o.id} className="py-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>{(o.lab_order_items ?? []).map((i) => i.test_name).join(", ") || "Lab order"}</span>
                          <Badge variant="outline" className="capitalize">{o.status.replace("_"," ")}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="billing">
              <Card><CardContent className="pt-6">
                {data.invoices.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No invoices.</p>
                ) : (
                  <ul className="divide-y">
                    {data.invoices.map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <div className="font-mono text-xs">{inv.invoice_number}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(inv.created_at)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${Number(inv.total).toFixed(2)}</div>
                          <Badge variant="outline" className="capitalize">{inv.status.replace("_"," ")}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
