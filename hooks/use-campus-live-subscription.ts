"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  listVenues,
  mapDbDealToPuDeal,
  mapDbEventToPuEvent,
} from "@/lib/supabase/browser-feed";
import type { Database } from "@/lib/supabase/database.types";
import type { PuDeal, PuEvent } from "@/lib/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type VenueRow = Database["public"]["Tables"]["venues"]["Row"];

type UseCampusLiveSubscriptionArgs = {
  initialEvents: PuEvent[];
  initialDeals: PuDeal[];
  /** When false, skips Supabase channel (mock / SSR-only). */
  enabled?: boolean;
};

function isFeedEventRow(row: EventRow, nowMs: number) {
  if (!["approved", "live"].includes(row.status)) return false;
  return new Date(row.ends_at).getTime() > nowMs;
}

function isFeedDealRow(row: DealRow, todayYmd: string) {
  if (!["approved", "live"].includes(row.status)) return false;
  return String(row.valid_until) >= todayYmd;
}

export function useCampusLiveSubscription({
  initialEvents,
  initialDeals,
  enabled = true,
}: UseCampusLiveSubscriptionArgs) {
  const [events, setEvents] = useState(initialEvents);
  const [deals, setDeals] = useState(initialDeals);
  const venueMapRef = useRef<Map<string, VenueRow>>(new Map());

  useEffect(() => {
    const t = window.setTimeout(() => {
      setEvents(initialEvents);
    }, 0);
    return () => window.clearTimeout(t);
  }, [initialEvents]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDeals(initialDeals);
    }, 0);
    return () => window.clearTimeout(t);
  }, [initialDeals]);

  const mergeEventRow = useCallback((row: EventRow) => {
    const nowMs = Date.now();
    if (!isFeedEventRow(row, nowMs)) {
      setEvents((prev) => prev.filter((e) => e.id !== row.id));
      return;
    }
    const venue = venueMapRef.current.get(row.venue_id);
    const mapped = mapDbEventToPuEvent(row, venue);
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === mapped.id);
      if (idx === -1) return [...prev, mapped];
      const next = [...prev];
      next[idx] = mapped;
      return next;
    });
  }, []);

  const mergeDealRow = useCallback((row: DealRow) => {
    const today = new Date().toISOString().slice(0, 10);
    if (!isFeedDealRow(row, today)) {
      setDeals((prev) => prev.filter((d) => d.id !== row.id));
      return;
    }
    const venue = venueMapRef.current.get(row.venue_id);
    const mapped = mapDbDealToPuDeal(row, venue);
    setDeals((prev) => {
      const idx = prev.findIndex((d) => d.id === mapped.id);
      if (idx === -1) return [...prev, mapped];
      const next = [...prev];
      next[idx] = mapped;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled || !hasSupabaseEnv()) return undefined;

    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("campus-live-feed")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "events" },
        (payload: RealtimePostgresChangesPayload<EventRow>) => {
          if (payload.new && typeof payload.new === "object" && "id" in payload.new) {
            mergeEventRow(payload.new as EventRow);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload: RealtimePostgresChangesPayload<EventRow>) => {
          if (payload.new && typeof payload.new === "object" && "id" in payload.new) {
            mergeEventRow(payload.new as EventRow);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deals" },
        (payload: RealtimePostgresChangesPayload<DealRow>) => {
          if (payload.new && typeof payload.new === "object" && "id" in payload.new) {
            mergeDealRow(payload.new as DealRow);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deals" },
        (payload: RealtimePostgresChangesPayload<DealRow>) => {
          if (payload.new && typeof payload.new === "object" && "id" in payload.new) {
            mergeDealRow(payload.new as DealRow);
          }
        }
      );

    void listVenues(supabase).then((venueRows) => {
      if (cancelled) return;
      venueMapRef.current = new Map(venueRows.map((v) => [v.id, v]));
      channel.subscribe();
    });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [enabled, mergeDealRow, mergeEventRow]);

  return useMemo(
    () => ({
      events,
      deals,
    }),
    [deals, events]
  );
}
