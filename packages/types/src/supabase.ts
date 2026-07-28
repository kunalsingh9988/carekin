// HAND-WRITTEN PLACEHOLDER, matching packages/supabase/migrations exactly.
//
// Replace this file by running (once Docker + `supabase start` are
// available — see Section 5.3, and this repo's README for why they aren't
// yet in this sandbox):
//
//   pnpm db:types
//   # i.e. supabase gen types typescript --local --workdir packages/supabase
//
// The shape below is deliberately identical to what that command emits, so
// swapping it in is a no-op for every importer.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      user_roles: {
        Row: {
          user_id: string;
          role: Database["public"]["Enums"]["user_role"];
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: Database["public"]["Enums"]["user_role"];
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
        };
        Relationships: [];
      };
      family_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          location: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          location?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          location?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      parental_consents: {
        Row: {
          id: string;
          family_id: string;
          consented_by: string;
          method: Database["public"]["Enums"]["parental_consent_method"];
          consented_by_name: string;
          consented_at: string;
          withdrawn_at: string | null;
        };
        Insert: {
          id?: string;
          family_id: string;
          consented_by: string;
          method: Database["public"]["Enums"]["parental_consent_method"];
          consented_by_name: string;
          consented_at?: string;
          withdrawn_at?: string | null;
        };
        Update: {
          id?: string;
          family_id?: string;
          consented_by?: string;
          method?: Database["public"]["Enums"]["parental_consent_method"];
          consented_by_name?: string;
          consented_at?: string;
          withdrawn_at?: string | null;
        };
        Relationships: [];
      };
      care_recipients: {
        Row: {
          id: string;
          family_id: string;
          type: Database["public"]["Enums"]["care_recipient_type"];
          name: string;
          notes: string | null;
          parental_consent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          type: Database["public"]["Enums"]["care_recipient_type"];
          name: string;
          notes?: string | null;
          parental_consent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          type?: Database["public"]["Enums"]["care_recipient_type"];
          name?: string;
          notes?: string | null;
          parental_consent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      providers: {
        Row: {
          id: string;
          user_id: string;
          type: Database["public"]["Enums"]["provider_type"];
          bio: string | null;
          service_radius_km: number;
          latitude: number;
          longitude: number;
          location: unknown | null;
          verification_status: Database["public"]["Enums"]["verification_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: Database["public"]["Enums"]["provider_type"];
          bio?: string | null;
          service_radius_km?: number;
          latitude: number;
          longitude: number;
          location?: unknown | null;
          verification_status?: Database["public"]["Enums"]["verification_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: Database["public"]["Enums"]["provider_type"];
          bio?: string | null;
          service_radius_km?: number;
          latitude?: number;
          longitude?: number;
          location?: unknown | null;
          verification_status?: Database["public"]["Enums"]["verification_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      verification_reviews: {
        Row: {
          id: string;
          provider_id: string;
          from_status: Database["public"]["Enums"]["verification_status"] | null;
          to_status: Database["public"]["Enums"]["verification_status"];
          kyc_provider_ref: string | null;
          police_verification_ref: string | null;
          reviewed_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          from_status?: Database["public"]["Enums"]["verification_status"] | null;
          to_status: Database["public"]["Enums"]["verification_status"];
          kyc_provider_ref?: string | null;
          police_verification_ref?: string | null;
          reviewed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          from_status?: Database["public"]["Enums"]["verification_status"] | null;
          to_status?: Database["public"]["Enums"]["verification_status"];
          kyc_provider_ref?: string | null;
          police_verification_ref?: string | null;
          reviewed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          provider_id: string;
          type: Database["public"]["Enums"]["document_type"];
          storage_key: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          type: Database["public"]["Enums"]["document_type"];
          storage_key: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          type?: Database["public"]["Enums"]["document_type"];
          storage_key?: string;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          family_id: string;
          provider_id: string;
          frequency: Database["public"]["Enums"]["subscription_frequency"];
          amount_paise: number;
          next_billing_date: string;
          status: Database["public"]["Enums"]["subscription_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          provider_id: string;
          frequency: Database["public"]["Enums"]["subscription_frequency"];
          amount_paise: number;
          next_billing_date: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          provider_id?: string;
          frequency?: Database["public"]["Enums"]["subscription_frequency"];
          amount_paise?: number;
          next_billing_date?: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          family_id: string;
          provider_id: string;
          care_recipient_id: string;
          type: Database["public"]["Enums"]["booking_type"];
          status: Database["public"]["Enums"]["booking_status"];
          scheduled_at: string;
          duration_hours: number;
          amount_paise: number;
          commission_paise: number;
          subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          provider_id: string;
          care_recipient_id: string;
          type: Database["public"]["Enums"]["booking_type"];
          status?: Database["public"]["Enums"]["booking_status"];
          scheduled_at: string;
          duration_hours: number;
          amount_paise: number;
          commission_paise: number;
          subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          provider_id?: string;
          care_recipient_id?: string;
          type?: Database["public"]["Enums"]["booking_type"];
          status?: Database["public"]["Enums"]["booking_status"];
          scheduled_at?: string;
          duration_hours?: number;
          amount_paise?: number;
          commission_paise?: number;
          subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          razorpay_order_id: string;
          status: Database["public"]["Enums"]["payment_status"];
          amount_paise: number;
          captured_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          razorpay_order_id: string;
          status?: Database["public"]["Enums"]["payment_status"];
          amount_paise: number;
          captured_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          razorpay_order_id?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          amount_paise?: number;
          captured_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payouts: {
        Row: {
          id: string;
          provider_id: string;
          booking_id: string;
          amount_paise: number;
          status: Database["public"]["Enums"]["payout_status"];
          payout_provider_ref: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          booking_id: string;
          amount_paise: number;
          status?: Database["public"]["Enums"]["payout_status"];
          payout_provider_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          booking_id?: string;
          amount_paise?: number;
          status?: Database["public"]["Enums"]["payout_status"];
          payout_provider_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          provider_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          provider_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          provider_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          booking_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      claim_initial_role: {
        Args: {
          p_role: Database["public"]["Enums"]["user_role"];
        };
        Returns: Database["public"]["Tables"]["user_roles"]["Row"];
      };
      review_verification: {
        Args: {
          p_provider_id: string;
          p_new_status: Database["public"]["Enums"]["verification_status"];
          p_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["providers"]["Row"];
      };
      create_child_care_recipient: {
        Args: {
          p_family_id: string;
          p_name: string;
          p_notes: string | null;
          p_consent_method: Database["public"]["Enums"]["parental_consent_method"];
          p_consented_by_name: string;
        };
        Returns: Database["public"]["Tables"]["care_recipients"]["Row"];
      };
      search_providers: {
        Args: {
          p_service_type: Database["public"]["Enums"]["provider_type"];
          p_latitude: number;
          p_longitude: number;
          p_radius_km?: number;
        };
        Returns: {
          id: string;
          type: Database["public"]["Enums"]["provider_type"];
          bio: string | null;
          distance_km: number;
        }[];
      };
      list_pending_providers: {
        Args: Record<string, never>;
        Returns: {
          provider_id: string;
          type: Database["public"]["Enums"]["provider_type"];
          bio: string | null;
          phone: string;
          created_at: string;
        }[];
      };
    };
    Enums: {
      user_role: "family" | "provider" | "admin";
      care_recipient_type: "elder" | "child";
      provider_type: "caregiver" | "babysitter";
      verification_status: "pending" | "approved" | "rejected";
      document_type: "id_proof" | "address_proof" | "certificate";
      booking_type: "one_off" | "subscription";
      booking_status: "requested" | "confirmed" | "in_progress" | "completed" | "cancelled" | "disputed";
      subscription_frequency: "weekly" | "monthly";
      subscription_status: "active" | "paused" | "cancelled";
      payment_status: "created" | "captured" | "failed" | "refunded";
      payout_status: "queued" | "processing" | "paid" | "failed";
      parental_consent_method: "in_app_checkbox" | "digital_signature" | "otp_confirmation";
    };
    CompositeTypes: Record<string, never>;
  };
};
