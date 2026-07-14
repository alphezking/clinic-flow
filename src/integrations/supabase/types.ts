export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string | null
          doctor_id: string | null
          id: string
          is_walk_in: boolean
          notes: string | null
          patient_id: string
          reason: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          doctor_id?: string | null
          id?: string
          is_walk_in?: boolean
          notes?: string | null
          patient_id: string
          reason?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          doctor_id?: string | null
          id?: string
          is_walk_in?: boolean
          notes?: string | null
          patient_id?: string
          reason?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          label: string
          notes: string | null
          size_bytes: number | null
          storage_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          label: string
          notes?: string | null
          size_bytes?: number | null
          storage_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          label?: string
          notes?: string | null
          size_bytes?: number | null
          storage_url?: string | null
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          address: string | null
          clinic_name: string
          currency: string
          default_consultation_fee: number
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          clinic_name?: string
          currency?: string
          default_consultation_fee?: number
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          clinic_name?: string
          currency?: string
          default_consultation_fee?: number
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          consultation_fee: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          consultation_fee?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          consultation_fee?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          code: string | null
          created_at: string
          created_by: string | null
          description: string
          encounter_id: string
          id: string
          is_primary: boolean
          patient_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          encounter_id: string
          id?: string
          is_primary?: boolean
          patient_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          encounter_id?: string
          id?: string
          is_primary?: boolean
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dispense_items: {
        Row: {
          dispense_id: string
          id: string
          line_total: number
          medication_id: string | null
          medication_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          dispense_id: string
          id?: string
          line_total?: number
          medication_id?: string | null
          medication_name: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          dispense_id?: string
          id?: string
          line_total?: number
          medication_id?: string | null
          medication_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "dispense_items_dispense_id_fkey"
            columns: ["dispense_id"]
            isOneToOne: false
            referencedRelation: "dispenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispense_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      dispenses: {
        Row: {
          dispensed_at: string
          dispensed_by: string | null
          id: string
          notes: string | null
          patient_id: string
          prescription_id: string | null
          total_amount: number
        }
        Insert: {
          dispensed_at?: string
          dispensed_by?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          prescription_id?: string | null
          total_amount?: number
        }
        Update: {
          dispensed_at?: string
          dispensed_by?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          prescription_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "dispenses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispenses_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      encounters: {
        Row: {
          appointment_id: string | null
          assessment: string | null
          chief_complaint: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          doctor_id: string | null
          ended_at: string | null
          examination: string | null
          follow_up_date: string | null
          history_of_illness: string | null
          id: string
          notes: string | null
          patient_id: string
          plan: string | null
          started_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          appointment_id?: string | null
          assessment?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          doctor_id?: string | null
          ended_at?: string | null
          examination?: string | null
          follow_up_date?: string | null
          history_of_illness?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          plan?: string | null
          started_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          appointment_id?: string | null
          assessment?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          doctor_id?: string | null
          ended_at?: string | null
          examination?: string | null
          follow_up_date?: string | null
          history_of_illness?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          plan?: string | null
          started_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encounters_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          category: string | null
          description: string
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          unit_price: number
        }
        Insert: {
          category?: string | null
          description: string
          id?: string
          invoice_id: string
          line_total?: number
          quantity?: number
          unit_price?: number
        }
        Update: {
          category?: string | null
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          balance: number
          created_at: string
          created_by: string | null
          discount: number
          encounter_id: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          notes: string | null
          patient_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          balance?: number
          created_at?: string
          created_by?: string | null
          discount?: number
          encounter_id?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          notes?: string | null
          patient_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          balance?: number
          created_at?: string
          created_by?: string | null
          discount?: number
          encounter_id?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          notes?: string | null
          patient_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_order_items: {
        Row: {
          id: string
          lab_order_id: string
          lab_test_id: string | null
          price: number
          test_name: string
        }
        Insert: {
          id?: string
          lab_order_id: string
          lab_test_id?: string | null
          price?: number
          test_name: string
        }
        Update: {
          id?: string
          lab_order_id?: string
          lab_test_id?: string | null
          price?: number
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_order_items_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_order_items_lab_test_id_fkey"
            columns: ["lab_test_id"]
            isOneToOne: false
            referencedRelation: "lab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          encounter_id: string | null
          id: string
          notes: string | null
          ordered_by: string | null
          patient_id: string
          sample_collected_at: string | null
          status: Database["public"]["Enums"]["lab_order_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          encounter_id?: string | null
          id?: string
          notes?: string | null
          ordered_by?: string | null
          patient_id: string
          sample_collected_at?: string | null
          status?: Database["public"]["Enums"]["lab_order_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          encounter_id?: string | null
          id?: string
          notes?: string | null
          ordered_by?: string | null
          patient_id?: string
          sample_collected_at?: string | null
          status?: Database["public"]["Enums"]["lab_order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_orders_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          id: string
          is_abnormal: boolean
          lab_order_id: string
          lab_order_item_id: string
          patient_id: string
          reported_at: string
          reported_by: string | null
          result_notes: string | null
          result_value: string | null
        }
        Insert: {
          id?: string
          is_abnormal?: boolean
          lab_order_id: string
          lab_order_item_id: string
          patient_id: string
          reported_at?: string
          reported_by?: string | null
          result_notes?: string | null
          result_value?: string | null
        }
        Update: {
          id?: string
          is_abnormal?: boolean
          lab_order_id?: string
          lab_order_item_id?: string
          patient_id?: string
          reported_at?: string
          reported_by?: string | null
          result_notes?: string | null
          result_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_lab_order_item_id_fkey"
            columns: ["lab_order_item_id"]
            isOneToOne: false
            referencedRelation: "lab_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_tests: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          price: number
          reference_range: string | null
          sample_type: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price?: number
          reference_range?: string | null
          sample_type?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          reference_range?: string | null
          sample_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      medication_batches: {
        Row: {
          batch_number: string | null
          created_by: string | null
          expiry_date: string | null
          id: string
          medication_id: string
          quantity: number
          received_at: string
        }
        Insert: {
          batch_number?: string | null
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          medication_id: string
          quantity?: number
          received_at?: string
        }
        Update: {
          batch_number?: string | null
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          medication_id?: string
          quantity?: number
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_batches_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          created_at: string
          created_by: string | null
          form: string | null
          generic_name: string | null
          id: string
          is_active: boolean
          name: string
          reorder_level: number
          strength: string | null
          supplier: string | null
          unit: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          form?: string | null
          generic_name?: string | null
          id?: string
          is_active?: boolean
          name: string
          reorder_level?: number
          strength?: string | null
          supplier?: string | null
          unit?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          form?: string | null
          generic_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          reorder_level?: number
          strength?: string | null
          supplier?: string | null
          unit?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          allergies: string | null
          blood_group: string | null
          chronic_conditions: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          insurance_number: string | null
          insurance_provider: string | null
          national_id: string | null
          notes: string | null
          patient_number: string
          phone: string | null
          photo_url: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          national_id?: string | null
          notes?: string | null
          patient_number?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          national_id?: string | null
          notes?: string | null
          patient_number?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          patient_id: string
          received_at: string
          received_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          patient_id: string
          received_at?: string
          received_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          patient_id?: string
          received_at?: string
          received_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_items: {
        Row: {
          dosage: string | null
          duration: string | null
          frequency: string | null
          id: string
          instructions: string | null
          medication_id: string | null
          medication_name: string
          prescription_id: string
          quantity: number
        }
        Insert: {
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication_id?: string | null
          medication_name: string
          prescription_id: string
          quantity?: number
        }
        Update: {
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication_id?: string | null
          medication_name?: string
          prescription_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          encounter_id: string | null
          id: string
          notes: string | null
          patient_id: string
          prescribed_by: string | null
          status: Database["public"]["Enums"]["prescription_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          encounter_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          prescribed_by?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          encounter_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          prescribed_by?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      queue_entries: {
        Row: {
          appointment_id: string | null
          assigned_doctor_id: string | null
          called_at: string | null
          completed_at: string | null
          created_by: string | null
          department_id: string | null
          id: string
          notes: string | null
          patient_id: string
          priority: number
          queued_at: string
          status: Database["public"]["Enums"]["queue_status"]
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          assigned_doctor_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_by?: string | null
          department_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          priority?: number
          queued_at?: string
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          assigned_doctor_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_by?: string | null
          department_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          priority?: number
          queued_at?: string
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_entries_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          attachments: Json | null
          category: Database["public"]["Enums"]["support_category"]
          created_at: string
          created_by: string | null
          description: string
          id: string
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          category?: Database["public"]["Enums"]["support_category"]
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          category?: Database["public"]["Enums"]["support_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["support_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vitals: {
        Row: {
          bmi: number | null
          diastolic_bp: number | null
          encounter_id: string
          height_cm: number | null
          id: string
          patient_id: string
          pulse_bpm: number | null
          recorded_at: string
          recorded_by: string | null
          respiration_bpm: number | null
          spo2: number | null
          systolic_bp: number | null
          temperature_c: number | null
          weight_kg: number | null
        }
        Insert: {
          bmi?: number | null
          diastolic_bp?: number | null
          encounter_id: string
          height_cm?: number | null
          id?: string
          patient_id: string
          pulse_bpm?: number | null
          recorded_at?: string
          recorded_by?: string | null
          respiration_bpm?: number | null
          spo2?: number | null
          systolic_bp?: number | null
          temperature_c?: number | null
          weight_kg?: number | null
        }
        Update: {
          bmi?: number | null
          diastolic_bp?: number | null
          encounter_id?: string
          height_cm?: number | null
          id?: string
          patient_id?: string
          pulse_bpm?: number | null
          recorded_at?: string
          recorded_by?: string | null
          respiration_bpm?: number | null
          spo2?: number | null
          systolic_bp?: number | null
          temperature_c?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vitals_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "clinic_admin"
        | "receptionist"
        | "doctor"
        | "nurse"
        | "lab_tech"
        | "pharmacist"
        | "cashier"
        | "accountant"
        | "records_officer"
      appointment_status:
        | "scheduled"
        | "checked_in"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      gender: "male" | "female" | "other"
      invoice_status: "draft" | "issued" | "partially_paid" | "paid" | "void"
      lab_order_status:
        | "requested"
        | "sample_collected"
        | "in_progress"
        | "completed"
        | "cancelled"
      payment_method:
        | "cash"
        | "card"
        | "mobile_money"
        | "insurance"
        | "bank_transfer"
      prescription_status:
        | "pending"
        | "dispensed"
        | "partially_dispensed"
        | "cancelled"
      queue_status:
        | "waiting"
        | "with_nurse"
        | "with_doctor"
        | "completed"
        | "cancelled"
      support_category:
        | "bug"
        | "feature_request"
        | "emergency"
        | "technical_issue"
        | "other"
      support_status: "open" | "in_progress" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "clinic_admin",
        "receptionist",
        "doctor",
        "nurse",
        "lab_tech",
        "pharmacist",
        "cashier",
        "accountant",
        "records_officer",
      ],
      appointment_status: [
        "scheduled",
        "checked_in",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      gender: ["male", "female", "other"],
      invoice_status: ["draft", "issued", "partially_paid", "paid", "void"],
      lab_order_status: [
        "requested",
        "sample_collected",
        "in_progress",
        "completed",
        "cancelled",
      ],
      payment_method: [
        "cash",
        "card",
        "mobile_money",
        "insurance",
        "bank_transfer",
      ],
      prescription_status: [
        "pending",
        "dispensed",
        "partially_dispensed",
        "cancelled",
      ],
      queue_status: [
        "waiting",
        "with_nurse",
        "with_doctor",
        "completed",
        "cancelled",
      ],
      support_category: [
        "bug",
        "feature_request",
        "emergency",
        "technical_issue",
        "other",
      ],
      support_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
