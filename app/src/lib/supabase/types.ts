// ============================================================
// Dr Fit Veda — Database Types
// Auto-generated shape matching 001_initial_schema.sql
// Database Engineer Agent
// ============================================================

export type UserRole =
  | 'super_admin' | 'admin' | 'doctor' | 'naturopathy_doctor'
  | 'nutritionist' | 'trainer' | 'yoga_doctor' | 'yoga_consultant' | 'customer'

export type MembershipStatus = 'active' | 'inactive' | 'expired' | 'cancelled' | 'suspended'
export type OrderStatus      = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
export type PaymentStatus    = 'pending' | 'processing' | 'success' | 'failed' | 'refunded'
export type PayoutStatus     = 'pending' | 'on_hold' | 'approved' | 'paid' | 'cancelled'
export type PlanStatus       = 'draft' | 'published' | 'archived'
export type ReviewStatus     = 'due' | 'in_progress' | 'completed' | 'approved' | 'skipped' | 'cancelled'
export type SessionStatus    = 'scheduled' | 'live' | 'completed' | 'cancelled'
export type RecordingStatus  = 'uploading' | 'processing' | 'available' | 'inactive' | 'deleted'
export type RetentionMode    = 'immediate' | 'grace_period'
export type CheckInStatus    = 'yes' | 'partial' | 'no' | 'skip'
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string; role: UserRole; full_name: string | null
          display_name: string | null; phone: string | null
          avatar_url: string | null; is_active: boolean
          created_at: string; updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['user_profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>
      }
      professionals: {
        Row: {
          id: string; user_id: string | null; role: UserRole
          full_name: string; qualification: string | null; specialization: string | null
          experience_years: number | null; bio: string | null; photo_url: string | null
          is_available: boolean; is_active: boolean; created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['professionals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['professionals']['Row']>
      }
      customers: {
        Row: {
          id: string; user_id: string; membership_status: MembershipStatus
          is_active: boolean; created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['customers']['Row']>
      }
      customer_profiles: {
        Row: {
          id: string; customer_id: string; date_of_birth: string | null
          gender: string | null; height_cm: number | null; weight_kg: number | null
          bmi: number | null; occupation: string | null; work_schedule: string | null
          sleep_hours: number | null; activity_level: string | null
          exercise_history: string | null; stress_level: number | null
          lifestyle_notes: string | null; goals: string | null
          women_wellness: Record<string, unknown> | null
          created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['customer_profiles']['Row'], 'id' | 'bmi' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['customer_profiles']['Row'], 'bmi'>>
      }
      memberships: {
        Row: {
          id: string; name: string; description: string | null
          duration_days: number; original_price: number; current_price: number
          discount: number; benefits: unknown | null; included_services: unknown | null
          included_reviews: number; is_featured: boolean; display_order: number
          is_active: boolean; created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['memberships']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['memberships']['Row']>
      }
      orders: {
        Row: {
          id: string; customer_id: string; membership_id: string; offer_id: string | null
          gross_amount: number; discount_amount: number; net_amount: number
          currency: string; status: OrderStatus; provider_order_id: string | null
          created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Row']>
      }
      daily_check_ins: {
        Row: {
          id: string; customer_id: string; plan_version_id: string | null
          check_in_date: string; workout_status: CheckInStatus | null
          diet_status: CheckInStatus | null; yoga_status: CheckInStatus | null
          water_status: CheckInStatus | null; other_status: CheckInStatus | null
          energy_level: number | null; mood_level: number | null; note: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['daily_check_ins']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['daily_check_ins']['Row']>
      }
      weekly_reviews: {
        Row: {
          id: string; customer_id: string; doctor_id: string
          plan_version_id: string | null; review_date: string; status: ReviewStatus
          adherence_notes: string | null; doctor_notes: string | null; outcome: string | null
          new_plan_version_id: string | null; next_review_date: string | null
          completed_at: string | null; approved_at: string | null; approved_by: string | null
          created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['weekly_reviews']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['weekly_reviews']['Row']>
      }
      training_sessions: {
        Row: {
          id: string; customer_id: string; trainer_id: string
          scheduled_at: string | null; started_at: string | null; ended_at: string | null
          status: SessionStatus; notes: string | null
          created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['training_sessions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['training_sessions']['Row']>
      }
      training_recordings: {
        Row: {
          id: string; session_id: string; customer_id: string; storage_key: string
          recording_status: RecordingStatus; is_active: boolean
          file_size_bytes: number | null; duration_seconds: number | null
          activated_at: string | null; deactivated_at: string | null
          deletion_queued_at: string | null; deleted_at: string | null
          created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['training_recordings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['training_recordings']['Row']>
      }
      training_retention_config: {
        Row: {
          id: string; config_key: string; retention_mode: RetentionMode
          grace_period_hours: number | null; updated_by: string | null; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['training_retention_config']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['training_retention_config']['Row']>
      }
      compensation_rule_versions: {
        Row: {
          id: string; name: string; effective_from: string; effective_to: string | null
          is_active: boolean; created_by: string | null; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['compensation_rule_versions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['compensation_rule_versions']['Row']>
      }
      payouts: {
        Row: {
          id: string; professional_id: string; customer_id: string | null
          order_id: string | null; service_event_id: string | null; payout_type: string
          amount: number; currency: string; rule_version_id: string | null
          service_date: string | null; status: PayoutStatus
          approved_by: string | null; approved_at: string | null; paid_at: string | null
          notes: string | null; created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payouts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payouts']['Row']>
      }
      notifications: {
        Row: {
          id: string; user_id: string; title: string; body: string | null
          type: string | null; is_read: boolean; action_url: string | null; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
      audit_logs: {
        Row: {
          id: string; user_id: string | null; action: string; table_name: string | null
          record_id: string | null; old_data: unknown | null; new_data: unknown | null
          ip_address: string | null; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
      website_settings: {
        Row: { key: string; value: unknown | null; updated_at: string }
        Insert: { key: string; value?: unknown | null }
        Update: { value?: unknown | null }
      }
      testimonials: {
        Row: {
          id: string; customer_name: string; content: string; rating: number | null
          avatar_url: string | null; is_featured: boolean; display_order: number
          is_active: boolean; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['testimonials']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['testimonials']['Row']>
      }
      faqs: {
        Row: {
          id: string; question: string; answer: string; category: string | null
          display_order: number; is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['faqs']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['faqs']['Row']>
      }
      professional_assignments: {
        Row: {
          id: string; customer_id: string; professional_id: string; role: UserRole
          assigned_by: string | null; assigned_at: string; unassigned_at: string | null
          is_active: boolean; notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['professional_assignments']['Row'], 'id' | 'assigned_at'>
        Update: Partial<Database['public']['Tables']['professional_assignments']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      membership_status: MembershipStatus
      session_status: SessionStatus
      recording_status: RecordingStatus
      retention_mode: RetentionMode
      check_in_status: CheckInStatus
      payout_status: PayoutStatus
    }
  }
}
