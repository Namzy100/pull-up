import type {
  DealFilterId,
  EventCategory,
  MockUserRole,
  PuInterestId,
  RequestedRole,
  VerificationStatus,
} from "@/lib/types";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DbInterest = Extract<PuInterestId, EventCategory | "deals" | "live_music">;
export type DbDealCategory = DealFilterId;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          campus: string | null;
          role: MockUserRole;
          requested_role: RequestedRole;
          verification_status: VerificationStatus;
          business_name: string | null;
          business_type: string | null;
          business_website: string | null;
          business_contact: string | null;
          organization_name: string | null;
          organization_type: string | null;
          verification_notes: string | null;
          created_at: string;
          onboarding_complete: boolean;
          interests: DbInterest[];
          consent_analytics: boolean;
          consent_personalization: boolean;
          consent_location: boolean;
          consent_marketing: boolean;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          campus?: string | null;
          role?: MockUserRole;
          requested_role?: RequestedRole;
          verification_status?: VerificationStatus;
          business_name?: string | null;
          business_type?: string | null;
          business_website?: string | null;
          business_contact?: string | null;
          organization_name?: string | null;
          organization_type?: string | null;
          verification_notes?: string | null;
          created_at?: string;
          onboarding_complete?: boolean;
          interests?: DbInterest[];
          consent_analytics?: boolean;
          consent_personalization?: boolean;
          consent_location?: boolean;
          consent_marketing?: boolean;
        };
        Update: {
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          campus?: string | null;
          role?: MockUserRole;
          requested_role?: RequestedRole;
          verification_status?: VerificationStatus;
          business_name?: string | null;
          business_type?: string | null;
          business_website?: string | null;
          business_contact?: string | null;
          organization_name?: string | null;
          organization_type?: string | null;
          verification_notes?: string | null;
          onboarding_complete?: boolean;
          interests?: DbInterest[];
          consent_analytics?: boolean;
          consent_personalization?: boolean;
          consent_location?: boolean;
          consent_marketing?: boolean;
        };
      };
      venues: {
        Row: {
          id: string;
          name: string;
          area: string;
          kind: "bar_club" | "restaurant" | "frat_student_org";
          tagline: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          area: string;
          kind: "bar_club" | "restaurant" | "frat_student_org";
          tagline?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          area?: string;
          kind?: "bar_club" | "restaurant" | "frat_student_org";
          tagline?: string | null;
          image_url?: string | null;
        };
      };
      events: {
        Row: {
          id: string;
          venue_id: string;
          title: string;
          category: EventCategory;
          starts_at: string;
          ends_at: string;
          cover_cents: number | null;
          entry_type: "free" | "cover" | "rsvp";
          stag_rule: string;
          age_restriction: string;
          vibe_music: string;
          description: string;
          image_url: string;
          external_url: string | null;
          created_by: string | null;
          status: "pending" | "approved" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          title: string;
          category: EventCategory;
          starts_at: string;
          ends_at: string;
          cover_cents?: number | null;
          entry_type: "free" | "cover" | "rsvp";
          stag_rule: string;
          age_restriction: string;
          vibe_music: string;
          description: string;
          image_url: string;
          external_url?: string | null;
          created_by?: string | null;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
        };
        Update: {
          venue_id?: string;
          title?: string;
          category?: EventCategory;
          starts_at?: string;
          ends_at?: string;
          cover_cents?: number | null;
          entry_type?: "free" | "cover" | "rsvp";
          stag_rule?: string;
          age_restriction?: string;
          vibe_music?: string;
          description?: string;
          image_url?: string;
          external_url?: string | null;
          status?: "pending" | "approved" | "rejected";
        };
      };
      deals: {
        Row: {
          id: string;
          venue_id: string;
          title: string;
          category_tag: DbDealCategory;
          perk: string;
          valid_from: string;
          valid_until: string;
          description: string;
          image_url: string;
          external_url: string | null;
          student_only: boolean;
          created_by: string | null;
          status: "pending" | "approved" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          title: string;
          category_tag: DbDealCategory;
          perk: string;
          valid_from: string;
          valid_until: string;
          description: string;
          image_url: string;
          external_url?: string | null;
          student_only?: boolean;
          created_by?: string | null;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
        };
        Update: {
          venue_id?: string;
          title?: string;
          category_tag?: DbDealCategory;
          perk?: string;
          valid_from?: string;
          valid_until?: string;
          description?: string;
          image_url?: string;
          external_url?: string | null;
          student_only?: boolean;
          status?: "pending" | "approved" | "rejected";
        };
      };
      saved_events: {
        Row: { user_id: string; event_id: string; created_at: string };
        Insert: { user_id: string; event_id: string; created_at?: string };
        Update: never;
      };
      rsvps: {
        Row: { user_id: string; event_id: string; created_at: string };
        Insert: { user_id: string; event_id: string; created_at?: string };
        Update: never;
      };
      venue_follows: {
        Row: { user_id: string; venue_id: string; created_at: string };
        Insert: { user_id: string; venue_id: string; created_at?: string };
        Update: never;
      };
      interest_preferences: {
        Row: { user_id: string; interest: DbInterest; created_at: string };
        Insert: { user_id: string; interest: DbInterest; created_at?: string };
        Update: never;
      };
      host_submissions: {
        Row: {
          id: string;
          client_submission_id: string | null;
          user_id: string;
          event_payload: Json;
          status: "pending" | "approved" | "rejected";
          reviewed_at: string | null;
          reviewed_by: string | null;
          moderation_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_submission_id?: string | null;
          user_id: string;
          event_payload: Json;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          moderation_notes?: string | null;
          created_at?: string;
        };
        Update: {
          client_submission_id?: string | null;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          moderation_notes?: string | null;
        };
      };
      business_submissions: {
        Row: {
          id: string;
          client_submission_id: string | null;
          user_id: string;
          deal_payload: Json;
          status: "pending" | "approved" | "rejected";
          reviewed_at: string | null;
          reviewed_by: string | null;
          moderation_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_submission_id?: string | null;
          user_id: string;
          deal_payload: Json;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          moderation_notes?: string | null;
          created_at?: string;
        };
        Update: {
          client_submission_id?: string | null;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          moderation_notes?: string | null;
        };
      };
      access_requests: {
        Row: {
          id: string;
          user_id: string;
          requested_role: Exclude<RequestedRole, "none">;
          status: "pending" | "approved" | "rejected";
          note: string | null;
          metadata: Json | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          moderation_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          requested_role: Exclude<RequestedRole, "none">;
          status?: "pending" | "approved" | "rejected";
          note?: string | null;
          metadata?: Json | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          moderation_notes?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "pending" | "approved" | "rejected";
          note?: string | null;
          metadata?: Json | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          moderation_notes?: string | null;
        };
      };
      consent_events: {
        Row: {
          id: string;
          user_id: string;
          consent_type:
            | "analytics"
            | "personalization"
            | "location"
            | "marketing";
          value: boolean;
          source: "onboarding" | "profile_settings";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          consent_type:
            | "analytics"
            | "personalization"
            | "location"
            | "marketing";
          value: boolean;
          source: "onboarding" | "profile_settings";
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
