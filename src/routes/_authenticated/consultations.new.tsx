import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";

const searchSchema = z.object({
  patient: z.string().optional(),
  queue: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/consultations/new")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  component: NewConsultationPage,
});

type RxItem = { medication_id?: string; medication_name: string; dosage: string; frequency: string; duration: string; quantity: number; instructions: string };
type LabItem = { lab_test_id?: string; test_name: string; price: number };

function NewConsultationPage() {
  const navigate = useNavigate();
  const { patient: patientId, queue: queueId } = Route.useSearch();

  const { data: refs } = useQuery({
    queryKey: ["consult", "refs", patientId],
    queryFn: async () => {
      const [patients, depts, meds, tests, patient] = await Promise.all([
        supabase.from("patients").select("id, full_name, patient_number").is("deleted_at", null).order("full_name").limit(500),
        supabase.from("departments").select("id, name").eq("is_active", true),
        supabase.from("medications").select("id, name, strength, unit_price").eq("is_active", true).order("name"),
        supabase.from("lab_tests").select("id, name, price").eq("is_active", true).order("name"),
        patientId ? supabase.from("patients").select("id, full_name, patient_number, allergies, chronic_conditions").eq("id", patientId).single() : Promise.resolve({ data: null, error: null }),
      ]);
      return {
        patients: patients.data ?? [],
        departments: depts.data ?? [],
        medications: meds.data ?? [],
        tests: tests.data ?? [],
        patient: patient.data,
      };
    },
  });

  const [saving, setSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(patientId ?? "");
  const [departmentId, setDepartmentId] = useState("");

  const [vitals, setVitals] = useState({
    temperature_c: "", pulse_bpm: "", respiration_bpm: "",
    systolic_bp: "", diastolic_bp: "", spo2: "",
    weight_kg: "", height_cm: "",
  });
  const [enc, setEnc] = useState({ chief_complaint: "", history_of_illness: "", examination: "", assessment: "", plan: "", follow_up_date: "" });
  const [diagnosisText, setDiagnosisText] = useState("");
  const [rx, setRx] = useState<RxItem[]>([]);
  const [labs, setLabs] = useState<LabItem[]>([]);

  function addRx() { setRx((s) => [...s, { medication_name: "", dosage: "", frequency: "", duration: "", quantity: 1, instructions: "" }]); }
  function addLab() { setLabs((s) => [...s, { test_name: "", price: 0 }]); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient) { toast.error("Select a patient"); return; }
    if (!enc.chief_complaint) { toast.error("Chief complaint is required"); return; }
    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;

    const { data: encRow, error: encErr } = await supabase.from("encounters").insert({
      patient_id: selectedPatient,
      department_id: departmentId || null,
      doctor_id: uid,
      chief_complaint: enc.chief_complaint,
      history_of_illness: enc.history_of_illness || null,
      examination: enc.examination || null,
      assessment: enc.assessment || null,
      plan: enc.plan || null,
      follow_up_date: enc.follow_up_date || null,
      ended_at: new Date().toISOString(),
      created_by: uid, updated_by: uid,
    }).select("id").single();

    if (encErr || !encRow) { setSaving(false); toast.error(encErr?.message ?? "Failed"); return; }

    const encounterId = encRow.id;
    const num = (v: string) => v ? Number(v) : null;
    const hasVitals = Object.values(vitals).some((v) => v);
    if (hasVitals) {
      await supabase.from("vitals").insert({
        encounter_id: encounterId, patient_id: selectedPatient, recorded_by: uid,
        temperature_c: num(vitals.temperature_c), pulse_bpm: num(vitals.pulse_bpm),
        respiration_bpm: num(vitals.respiration_bpm), systolic_bp: num(vitals.systolic_bp),
        diastolic_bp: num(vitals.diastolic_bp), spo2: num(vitals.spo2),
        weight_kg: num(vitals.weight_kg), height_cm: num(vitals.height_cm),
      });
    }

    if (diagnosisText.trim()) {
      await supabase.from("diagnoses").insert({
        encounter_id: encounterId, patient_id: selectedPatient,
        description: diagnosisText.trim(), is_primary: true, created_by: uid,
      });
    }

    if (rx.length > 0) {
      const { data: rxRow } = await supabase.from("prescriptions").insert({
        encounter_id: encounterId, patient_id: selectedPatient, prescribed_by: uid,
      }).select("id").single();
      if (rxRow) {
        await supabase.from("prescription_items").insert(rx.map((it) => ({
          prescription_id: rxRow.id,
          medication_id: it.medication_id || null,
          medication_name: it.medication_name,
          dosage: it.dosage, frequency: it.frequency, duration: it.duration,
          quantity: it.quantity, instructions: it.instructions,
        })));
      }
    }

    if (labs.length > 0) {
      const { data: labOrder } = await supabase.from("lab_orders").insert({
        encounter_id: encounterId, patient_id: selectedPatient, ordered_by: uid,
      }).select("id").single();
      if (labOrder) {
        await supabase.from("lab_order_items").insert(labs.map((it) => ({
          lab_order_id: labOrder.id,
          lab_test_id: it.lab_test_id || null,
          test_name: it.test_name, price: it.price,
        })));
      }
    }

    if (queueId) {
      await supabase.from("queue_entries").update({ status: "completed" as never, completed_at: new Date().toISOString() }).eq("id", queueId);
    }

    setSaving(false);
    toast.success("Consultation saved");
    navigate({ to: "/patients/$id", params: { id: selectedPatient } });
  }

  return (
    <>
      <div className="mb-4"><Button variant="ghost" size="sm" asChild><Link to="/consultations"><ArrowLeft className="mr-2 h-4 w-4" /> Consultations</Link></Button></div>
      <PageHeader title="New consultation" description="Record vitals, examination, diagnosis, prescriptions, and lab orders." />

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Patient</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {(refs?.patients ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.patient_number})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {(refs?.departments ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {refs?.patient?.allergies && (
              <div className="md:col-span-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <b className="text-destructive">Allergies:</b> {refs.patient.allergies}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Vitals</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {[
              ["temperature_c","Temp (°C)"],["pulse_bpm","Pulse"],["respiration_bpm","Resp"],["spo2","SpO₂ %"],
              ["systolic_bp","Systolic"],["diastolic_bp","Diastolic"],["weight_kg","Weight (kg)"],["height_cm","Height (cm)"],
            ].map(([k, label]) => (
              <div key={k} className="space-y-2">
                <Label>{label}</Label>
                <Input value={vitals[k as keyof typeof vitals]} onChange={(e) => setVitals((s) => ({ ...s, [k]: e.target.value }))} inputMode="decimal" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Consultation</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2"><Label>Chief complaint *</Label><Input required value={enc.chief_complaint} onChange={(e) => setEnc((s) => ({ ...s, chief_complaint: e.target.value }))} /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>History of illness</Label><Textarea rows={3} value={enc.history_of_illness} onChange={(e) => setEnc((s) => ({ ...s, history_of_illness: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Examination</Label><Textarea rows={3} value={enc.examination} onChange={(e) => setEnc((s) => ({ ...s, examination: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Assessment / Diagnosis notes</Label><Textarea rows={3} value={enc.assessment} onChange={(e) => setEnc((s) => ({ ...s, assessment: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Plan</Label><Textarea rows={3} value={enc.plan} onChange={(e) => setEnc((s) => ({ ...s, plan: e.target.value }))} /></div>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Primary diagnosis (short)</Label><Input value={diagnosisText} onChange={(e) => setDiagnosisText(e.target.value)} placeholder="e.g. Malaria" /></div>
              <div className="space-y-2"><Label>Follow-up date</Label><Input type="date" value={enc.follow_up_date} onChange={(e) => setEnc((s) => ({ ...s, follow_up_date: e.target.value }))} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Prescriptions</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addRx}><Plus className="mr-2 h-4 w-4" /> Add</Button></CardHeader>
          <CardContent className="space-y-3">
            {rx.length === 0 && <p className="text-sm text-muted-foreground">No medications prescribed.</p>}
            {rx.map((it, i) => (
              <div key={i} className="grid gap-2 rounded border p-3 md:grid-cols-12">
                <div className="md:col-span-4 space-y-1"><Label className="text-xs">Medication</Label>
                  <Select value={it.medication_id ?? ""} onValueChange={(v) => {
                    const m = refs?.medications.find((x) => x.id === v);
                    setRx((s) => s.map((x, idx) => idx === i ? { ...x, medication_id: v, medication_name: m ? `${m.name} ${m.strength ?? ""}`.trim() : x.medication_name } : x));
                  }}>
                    <SelectTrigger><SelectValue placeholder="From inventory" /></SelectTrigger>
                    <SelectContent>{(refs?.medications ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.name} {m.strength}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Or type name" value={it.medication_name} onChange={(e) => setRx((s) => s.map((x, idx) => idx === i ? { ...x, medication_name: e.target.value } : x))} />
                </div>
                <div className="md:col-span-2 space-y-1"><Label className="text-xs">Dosage</Label><Input value={it.dosage} onChange={(e) => setRx((s) => s.map((x, idx) => idx === i ? { ...x, dosage: e.target.value } : x))} /></div>
                <div className="md:col-span-2 space-y-1"><Label className="text-xs">Frequency</Label><Input value={it.frequency} onChange={(e) => setRx((s) => s.map((x, idx) => idx === i ? { ...x, frequency: e.target.value } : x))} /></div>
                <div className="md:col-span-2 space-y-1"><Label className="text-xs">Duration</Label><Input value={it.duration} onChange={(e) => setRx((s) => s.map((x, idx) => idx === i ? { ...x, duration: e.target.value } : x))} /></div>
                <div className="md:col-span-1 space-y-1"><Label className="text-xs">Qty</Label><Input type="number" min={1} value={it.quantity} onChange={(e) => setRx((s) => s.map((x, idx) => idx === i ? { ...x, quantity: Number(e.target.value) } : x))} /></div>
                <div className="md:col-span-1 flex items-end"><Button type="button" variant="ghost" size="icon" onClick={() => setRx((s) => s.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Lab orders</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLab}><Plus className="mr-2 h-4 w-4" /> Add</Button></CardHeader>
          <CardContent className="space-y-3">
            {labs.length === 0 && <p className="text-sm text-muted-foreground">No lab tests ordered.</p>}
            {labs.map((it, i) => (
              <div key={i} className="grid gap-2 rounded border p-3 md:grid-cols-12">
                <div className="md:col-span-8 space-y-1"><Label className="text-xs">Test</Label>
                  <Select value={it.lab_test_id ?? ""} onValueChange={(v) => {
                    const t = refs?.tests.find((x) => x.id === v);
                    setLabs((s) => s.map((x, idx) => idx === i ? { ...x, lab_test_id: v, test_name: t?.name ?? x.test_name, price: Number(t?.price ?? 0) } : x));
                  }}>
                    <SelectTrigger><SelectValue placeholder="From catalog" /></SelectTrigger>
                    <SelectContent>{(refs?.tests ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 space-y-1"><Label className="text-xs">Price</Label><Input type="number" step="0.01" value={it.price} onChange={(e) => setLabs((s) => s.map((x, idx) => idx === i ? { ...x, price: Number(e.target.value) } : x))} /></div>
                <div className="md:col-span-1 flex items-end"><Button type="button" variant="ghost" size="icon" onClick={() => setLabs((s) => s.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/consultations" })}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save consultation</Button>
        </div>
      </form>
    </>
  );
}
