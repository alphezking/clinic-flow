import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/patients/new")({
  component: NewPatientPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Full name required").max(120),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional(),
  national_id: z.string().trim().max(50).optional(),
  blood_group: z.string().trim().max(10).optional(),
  allergies: z.string().trim().max(500).optional(),
  chronic_conditions: z.string().trim().max(500).optional(),
  emergency_contact_name: z.string().trim().max(120).optional(),
  emergency_contact_phone: z.string().trim().max(30).optional(),
  emergency_contact_relation: z.string().trim().max(60).optional(),
  insurance_provider: z.string().trim().max(120).optional(),
  insurance_number: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(1000).optional(),
});

function NewPatientPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    full_name: "", date_of_birth: "", gender: "" as "" | "male" | "female" | "other",
    phone: "", email: "", address: "", national_id: "", blood_group: "",
    allergies: "", chronic_conditions: "",
    emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relation: "",
    insurance_provider: "", insurance_number: "", notes: "",
  });

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...values,
      gender: values.gender || undefined,
      email: values.email || undefined,
      date_of_birth: values.date_of_birth || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("patients").insert({
      ...parsed.data,
      created_by: userData.user?.id,
      updated_by: userData.user?.id,
    }).select("id, patient_number").single();
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Patient registered — ${data.patient_number}`);
    navigate({ to: "/patients/$id", params: { id: data.id } });
  }

  return (
    <>
      <PageHeader title="Register patient" description="Create a new patient record." />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={submit} className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Personal</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="full_name">Full name *</Label>
                  <Input id="full_name" required value={values.full_name} onChange={(e) => set("full_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input id="dob" type="date" value={values.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={values.gender} onValueChange={(v) => set("gender", v as typeof values.gender)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={values.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={values.address} onChange={(e) => set("address", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="national_id">National ID</Label>
                  <Input id="national_id" value={values.national_id} onChange={(e) => set("national_id", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blood_group">Blood group</Label>
                  <Input id="blood_group" placeholder="e.g. O+" value={values.blood_group} onChange={(e) => set("blood_group", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Medical</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea id="allergies" rows={2} value={values.allergies} onChange={(e) => set("allergies", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chronic">Chronic conditions</Label>
                  <Textarea id="chronic" rows={2} value={values.chronic_conditions} onChange={(e) => set("chronic_conditions", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Emergency contact</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2"><Label htmlFor="ec_name">Name</Label><Input id="ec_name" value={values.emergency_contact_name} onChange={(e) => set("emergency_contact_name", e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="ec_phone">Phone</Label><Input id="ec_phone" value={values.emergency_contact_phone} onChange={(e) => set("emergency_contact_phone", e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="ec_rel">Relation</Label><Input id="ec_rel" value={values.emergency_contact_relation} onChange={(e) => set("emergency_contact_relation", e.target.value)} /></div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Insurance</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="ins_p">Provider</Label><Input id="ins_p" value={values.insurance_provider} onChange={(e) => set("insurance_provider", e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="ins_n">Policy number</Label><Input id="ins_n" value={values.insurance_number} onChange={(e) => set("insurance_number", e.target.value)} /></div>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/patients" })}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Register patient
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
