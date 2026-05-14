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

export type EventCmsStatus = "pending" | "approved" | "rejected" | "live" | "ended";
export type DealCmsStatus = EventCmsStatus;

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
          status: EventCmsStatus;
          created_at: string;
          host_user_id: string | null;
          category_label: string | null;
          image_alt: string | null;
          area: string | null;
          venue_name: string | null;
          host_label: string | null;
          age_rule: string | null;
          vibe: string | null;
          urgency_labels: string[];
          live_now: boolean;
          saves_count: number;
          rsvps_count: number;
          watching_count: number;
          pull_ups_last_hour: number;
          updated_at: string;
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
          status?: EventCmsStatus;
          created_at?: string;
          host_user_id?: string | null;
          category_label?: string | null;
          image_alt?: string | null;
          area?: string | null;
          venue_name?: string | null;
          host_label?: string | null;
          age_rule?: string | null;
          vibe?: string | null;
          urgency_labels?: string[];
          live_now?: boolean;
          saves_count?: number;
          rsvps_count?: number;
          watching_count?: number;
          pull_ups_last_hour?: number;
          updated_at?: string;
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
          status?: EventCmsStatus;
          host_user_id?: string | null;
          category_label?: string | null;
          image_alt?: string | null;
          area?: string | null;
          venue_name?: string | null;
          host_label?: string | null;
          age_rule?: string | null;
          vibe?: string | null;
          urgency_labels?: string[];
          live_now?: boolean;
          saves_count?: number;
          rsvps_count?: number;
          watching_count?: number;
          pull_ups_last_hour?: number;
          updated_at?: string;
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
          status: DealCmsStatus;
          created_at: string;
          business_user_id: string | null;
          business_name: string | null;
          category: string | null;
          category_label: string | null;
          image_alt: string | null;
          offer: string | null;
          area: string | null;
          urgency_label: string | null;
          saves_count: number;
          claims_count: number;
          watching_count: number;
          updated_at: string;
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
          status?: DealCmsStatus;
          created_at?: string;
          business_user_id?: string | null;
          business_name?: string | null;
          category?: string | null;
          category_label?: string | null;
          image_alt?: string | null;
          offer?: string | null;
          area?: string | null;
          urgency_label?: string | null;
          saves_count?: number;
          claims_count?: number;
          watching_count?: number;
          updated_at?: string;
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
          status?: DealCmsStatus;
          business_user_id?: string | null;
          business_name?: string | null;
          category?: string | null;
          category_label?: string | null;
          image_alt?: string | null;
          offer?: string | null;
          area?: string | null;
          urgency_label?: string | null;
          saves_count?: number;
          claims_count?: number;
          watching_count?: number;
          updated_at?: string;
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
          published_event_id: string | null;
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
          published_event_id?: string | null;
        };
        Update: {
          client_submission_id?: string | null;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          moderation_notes?: string | null;
          published_event_id?: string | null;
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
          published_deal_id: string | null;
          published_event_id: string | null;
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
          published_deal_id?: string | null;
          published_event_id?: string | null;
        };
        Update: {
          client_submission_id?: string | null;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          moderation_notes?: string | null;
          published_deal_id?: string | null;
          published_event_id?: string | null;
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
      engagement_events: {
        Row: {
          id: string;
          user_id: string | null;
          subject_type: "event" | "deal" | "venue";
          subject_id: string;
          action:
            | "view"
            | "save"
            | "unsave"
            | "rsvp"
            | "unrsvp"
            | "share"
            | "follow"
            | "unfollow"
            | "intent"
            | "click";
          meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          subject_type: "event" | "deal" | "venue";
          subject_id: string;
          action:
            | "view"
            | "save"
            | "unsave"
            | "rsvp"
            | "unrsvp"
            | "share"
            | "follow"
            | "unfollow"
            | "intent"
            | "click";
          meta?: Json | null;
          created_at?: string;
        };
        Update: never;
      };
      consent_events: {
        Row: {
          id: string;
          user_id: string;
          consent_type:
            | "analytics"
            | "personalization"
            | "location"
            | "marketing"
            | "host_posting_storage"
            | "host_event_analytics"
            | "host_verification_contact"
            | "host_marketing"
            | "business_verification_storage"
            | "business_performance_analytics"
            | "business_verification_contact"
            | "business_promotional_outreach"
            | "business_public_listing";
          value: boolean;
          source: "onboarding" | "profile_settings" | "signup";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          consent_type:
            | "analytics"
            | "personalization"
            | "location"
            | "marketing"
            | "host_posting_storage"
            | "host_event_analytics"
            | "host_verification_contact"
            | "host_marketing"
            | "business_verification_storage"
            | "business_performance_analytics"
            | "business_verification_contact"
            | "business_promotional_outreach"
            | "business_public_listing";
          value: boolean;
          source: "onboarding" | "profile_settings" | "signup";
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
