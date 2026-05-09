import { create } from "zustand";

import {
  PORTAL_DEAL_CATEGORY_OPTIONS,
  categoryLabelForEvent,
} from "@/lib/portal-constants";
import {
  persistBusinessSubmission,
  persistBusinessModeration,
  persistConsentEvent,
  persistHostSubmission,
  persistHostModeration,
  persistInterests,
  persistProfile,
  persistRsvp,
  persistSavedEvent,
  persistVenueFollow,
  signOutSupabase,
} from "@/lib/supabase/client-persistence";
import {
  INITIAL_PENDING_BUSINESS_DEALS,
  INITIAL_PENDING_HOST_EVENTS,
} from "@/lib/portal-mock-queue";
import type {
  BusinessDealFormValues,
  HostEventFormValues,
  PendingBusinessDealSubmission,
  PendingHostEventSubmission,
} from "@/lib/portal-types";
import { DEFAULT_MOCK_PROFILE } from "@/lib/mock-profile";
import type { MockProfileSession, MockUserRole, PuInterestId } from "@/lib/types";

function newSubmissionId(prefix: "host" | "biz"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseCoverDollars(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function hostFormToPending(values: HostEventFormValues): PendingHostEventSubmission {
  const coverDollars = parseCoverDollars(values.coverDollars);
  return {
    id: newSubmissionId("host"),
    submittedAt: new Date().toISOString(),
    status: "pending",
    title: values.title.trim(),
    category: values.category,
    categoryLabel: categoryLabelForEvent(values.category),
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    area: values.area.trim(),
    venue: values.venue.trim(),
    coverDollars,
    entryType: values.entryType,
    stagRule: values.stagRule.trim(),
    ageRestriction: values.ageRestriction.trim(),
    vibeMusic: values.vibeMusic.trim(),
    description: values.description.trim(),
    imageUrl: values.imageUrl.trim(),
    externalUrl: values.externalUrl.trim(),
  };
}

function businessFormToPending(
  values: BusinessDealFormValues,
  categoryLabel: string
): PendingBusinessDealSubmission {
  return {
    id: newSubmissionId("biz"),
    submittedAt: new Date().toISOString(),
    status: "pending",
    businessName: values.businessName.trim(),
    dealTitle: values.dealTitle.trim(),
    categoryLabel,
    categoryTag: values.categoryTag,
    perk: values.perk.trim(),
    validFrom: values.validFrom,
    validUntil: values.validUntil,
    area: values.area.trim(),
    studentOnly: values.studentOnly,
    description: values.description.trim(),
    imageUrl: values.imageUrl.trim(),
    externalUrl: values.externalUrl.trim(),
  };
}

function toggleId(list: string[], id: string): string[] {
  const i = list.indexOf(id);
  if (i === -1) return [...list, id];
  return list.slice(0, i).concat(list.slice(i + 1));
}

function toggleInterestId(
  list: PuInterestId[],
  id: PuInterestId
): PuInterestId[] {
  const i = list.indexOf(id);
  if (i === -1) return [...list, id];
  return list.slice(0, i).concat(list.slice(i + 1));
}

export type AppStore = {
  savedEventIds: string[];
  rsvpedEventIds: string[];
  savedDealIds: string[];
  selectedInterests: PuInterestId[];
  mockUserRole: MockUserRole;

  /** Local identity — replace with auth session + profile row */
  mockProfile: MockProfileSession;
  /** Venue / org / business spot IDs from `MOCK_FOLLOWABLE_VENUES` */
  followedVenueIds: string[];

  /** Mock moderation queue — replace with Supabase + RLS later */
  pendingHostSubmissions: PendingHostEventSubmission[];
  pendingBusinessSubmissions: PendingBusinessDealSubmission[];
  portalApprovedToday: number;
  portalFlaggedUpdates: number;

  toggleSaveEvent: (eventId: string) => void;
  toggleRsvpEvent: (eventId: string) => void;
  toggleSaveDeal: (dealId: string) => void;
  toggleInterest: (interestId: PuInterestId) => void;
  setMockUserRole: (role: MockUserRole) => void;
  toggleFollowVenue: (venueId: string) => void;
  setMockProfile: (profile: MockProfileSession) => void;
  updateConsent: (
    key:
      | "consentAnalytics"
      | "consentPersonalization"
      | "consentLocation"
      | "consentMarketing",
    value: boolean
  ) => void;
  hydrateFromSupabase: (payload: {
    profile: MockProfileSession | null;
    savedEventIds: string[];
    rsvpedEventIds: string[];
    followedVenueIds: string[];
    interests: PuInterestId[];
  }) => void;
  resetToMockDefaults: () => void;
  logout: () => Promise<void>;

  submitHostEventForApproval: (
    values: HostEventFormValues
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  submitBusinessDealForApproval: (
    values: BusinessDealFormValues
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  approvePendingHostEvent: (id: string, notes?: string) => Promise<void>;
  rejectPendingHostEvent: (id: string, notes?: string) => Promise<void>;
  approvePendingBusinessDeal: (id: string, notes?: string) => Promise<void>;
  rejectPendingBusinessDeal: (id: string, notes?: string) => Promise<void>;
};

export const useAppStore = create<AppStore>((set) => ({
  savedEventIds: [],
  rsvpedEventIds: [],
  savedDealIds: [],
  selectedInterests: [...DEFAULT_MOCK_PROFILE.interests],
  mockUserRole: DEFAULT_MOCK_PROFILE.role,

  mockProfile: { ...DEFAULT_MOCK_PROFILE },
  followedVenueIds: ["venue-kams", "venue-joes-brewery"],

  pendingHostSubmissions: [...INITIAL_PENDING_HOST_EVENTS],
  pendingBusinessSubmissions: [...INITIAL_PENDING_BUSINESS_DEALS],
  portalApprovedToday: 4,
  portalFlaggedUpdates: 2,

  toggleSaveEvent: (eventId) =>
    set((s) => {
      const previous = s.savedEventIds;
      const next = toggleId(s.savedEventIds, eventId);
      const shouldSave = next.includes(eventId);
      void persistSavedEvent(eventId, shouldSave).then((result) => {
        if (result?.error) {
          set({ savedEventIds: previous });
        }
      });
      return { savedEventIds: next };
    }),

  toggleRsvpEvent: (eventId) =>
    set((s) => {
      const previous = s.rsvpedEventIds;
      const next = toggleId(s.rsvpedEventIds, eventId);
      const shouldRsvp = next.includes(eventId);
      void persistRsvp(eventId, shouldRsvp).then((result) => {
        if (result?.error) {
          set({ rsvpedEventIds: previous });
        }
      });
      return { rsvpedEventIds: next };
    }),

  toggleSaveDeal: (dealId) =>
    set((s) => ({
      savedDealIds: toggleId(s.savedDealIds, dealId),
    })),

  toggleInterest: (interestId) =>
    set((s) => {
      const previous = s.selectedInterests;
      const selectedInterests = toggleInterestId(s.selectedInterests, interestId);
      void persistInterests(selectedInterests).then((result) => {
        if (result?.error) {
          set({
            selectedInterests: previous,
            mockProfile: { ...s.mockProfile, interests: previous },
          });
        }
      });
      return {
        selectedInterests,
        mockProfile: { ...s.mockProfile, interests: selectedInterests },
      };
    }),

  setMockUserRole: (role) =>
    set((s) => {
      const mockProfile = { ...s.mockProfile, role };
      void persistProfile(mockProfile).then((result) => {
        if (result?.error) {
          set({ mockProfile: s.mockProfile, mockUserRole: s.mockUserRole });
        }
      });
      return { mockUserRole: role, mockProfile };
    }),

  toggleFollowVenue: (venueId) =>
    set((s) => {
      const previous = s.followedVenueIds;
      const followedVenueIds = toggleId(s.followedVenueIds, venueId);
      const shouldFollow = followedVenueIds.includes(venueId);
      void persistVenueFollow(venueId, shouldFollow).then((result) => {
        if (result?.error) {
          set({ followedVenueIds: previous });
        }
      });
      return { followedVenueIds };
    }),

  setMockProfile: (profile) =>
    set((s) => {
      void persistProfile(profile).then((result) => {
        if (result?.error) {
          set({
            mockProfile: s.mockProfile,
            mockUserRole: s.mockUserRole,
            selectedInterests: s.selectedInterests,
          });
        }
      });
      return {
        mockProfile: profile,
        mockUserRole: profile.role,
        selectedInterests: profile.interests,
      };
    }),

  updateConsent: (key, value) =>
    set((s) => {
      const mockProfile = { ...s.mockProfile, [key]: value };
      void persistProfile(mockProfile).then((result) => {
        if (result?.error) {
          set({ mockProfile: s.mockProfile });
        }
      });
      const consentType =
        key === "consentAnalytics"
          ? "analytics"
          : key === "consentPersonalization"
            ? "personalization"
            : key === "consentLocation"
              ? "location"
              : "marketing";
      void persistConsentEvent(consentType, value, "profile_settings");
      return { mockProfile };
    }),

  hydrateFromSupabase: ({ profile, savedEventIds, rsvpedEventIds, followedVenueIds, interests }) =>
    set((s) => ({
      mockProfile: profile ?? s.mockProfile,
      mockUserRole: profile?.role ?? s.mockUserRole,
      savedEventIds,
      rsvpedEventIds,
      followedVenueIds,
      selectedInterests: interests.length > 0 ? interests : (profile?.interests ?? s.selectedInterests),
    })),

  resetToMockDefaults: () =>
    set(() => ({
      mockProfile: { ...DEFAULT_MOCK_PROFILE },
      mockUserRole: DEFAULT_MOCK_PROFILE.role,
      selectedInterests: [...DEFAULT_MOCK_PROFILE.interests],
      savedEventIds: [],
      rsvpedEventIds: [],
      followedVenueIds: ["venue-kams", "venue-joes-brewery"],
    })),

  logout: async () => {
    await signOutSupabase();
    set({
      mockProfile: { ...DEFAULT_MOCK_PROFILE },
      mockUserRole: DEFAULT_MOCK_PROFILE.role,
      selectedInterests: [...DEFAULT_MOCK_PROFILE.interests],
      savedEventIds: [],
      rsvpedEventIds: [],
      followedVenueIds: ["venue-kams", "venue-joes-brewery"],
    });
  },

  submitHostEventForApproval: async (values) => {
    const pending = hostFormToPending(values);
    set((s) => ({
      pendingHostSubmissions: [pending, ...s.pendingHostSubmissions],
    }));
    const result = await persistHostSubmission(
      pending as unknown as import("@/lib/supabase/database.types").Json
    );
    if (result?.error) {
      set((s) => ({
        pendingHostSubmissions: s.pendingHostSubmissions.filter((x) => x.id !== pending.id),
      }));
      return { ok: false as const, error: result.error.message };
    }
    return { ok: true as const };
  },

  submitBusinessDealForApproval: async (values) => {
    const label =
      PORTAL_DEAL_CATEGORY_OPTIONS.find((o) => o.id === values.categoryTag)?.label ??
      String(values.categoryTag);
    const pending = businessFormToPending(values, label);
    set((s) => ({
      pendingBusinessSubmissions: [pending, ...s.pendingBusinessSubmissions],
    }));
    const result = await persistBusinessSubmission(
      pending as unknown as import("@/lib/supabase/database.types").Json
    );
    if (result?.error) {
      set((s) => ({
        pendingBusinessSubmissions: s.pendingBusinessSubmissions.filter(
          (x) => x.id !== pending.id
        ),
      }));
      return { ok: false as const, error: result.error.message };
    }
    return { ok: true as const };
  },

  approvePendingHostEvent: async (id, notes) => {
    set((s) => ({
      pendingHostSubmissions: s.pendingHostSubmissions.filter((x) => x.id !== id),
      portalApprovedToday: s.portalApprovedToday + 1,
    }));
    await persistHostModeration(id, "approved", notes);
  },

  rejectPendingHostEvent: async (id, notes) => {
    set((s) => ({
      pendingHostSubmissions: s.pendingHostSubmissions.filter((x) => x.id !== id),
      portalFlaggedUpdates: s.portalFlaggedUpdates + 1,
    }));
    await persistHostModeration(id, "rejected", notes);
  },

  approvePendingBusinessDeal: async (id, notes) => {
    set((s) => ({
      pendingBusinessSubmissions: s.pendingBusinessSubmissions.filter(
        (x) => x.id !== id
      ),
      portalApprovedToday: s.portalApprovedToday + 1,
    }));
    await persistBusinessModeration(id, "approved", notes);
  },

  rejectPendingBusinessDeal: async (id, notes) => {
    set((s) => ({
      pendingBusinessSubmissions: s.pendingBusinessSubmissions.filter(
        (x) => x.id !== id
      ),
      portalFlaggedUpdates: s.portalFlaggedUpdates + 1,
    }));
    await persistBusinessModeration(id, "rejected", notes);
  },
}));
