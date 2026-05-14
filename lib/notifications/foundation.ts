/**
 * Notification system foundation — types and helpers for a future inbox / push layer.
 * No delivery pipeline yet; safe to call from client for dev previews.
 */

export type NotificationChannel = "in_app" | "push" | "email";

export type NotificationKind =
  | "event_going_live"
  | "crowd_surging"
  | "deal_expiring"
  | "approval_update"
  | "followed_venue_activity";

export type NotificationPayload = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** event | deal | venue id */
  targetId?: string;
  targetType?: "event" | "deal" | "venue";
  createdAtIso: string;
  read?: boolean;
  channels?: NotificationChannel[];
};

const previewBuffer: NotificationPayload[] = [];
const MAX_PREVIEW = 32;

export function enqueueLocalNotificationPreview(
  payload: Omit<NotificationPayload, "id" | "createdAtIso">
) {
  const full: NotificationPayload = {
    ...payload,
    id: `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAtIso: new Date().toISOString(),
  };
  previewBuffer.unshift(full);
  if (previewBuffer.length > MAX_PREVIEW) previewBuffer.pop();
  return full;
}

export function drainLocalNotificationPreviews(): NotificationPayload[] {
  return [...previewBuffer];
}

export function shouldNotifyChannel(
  kind: NotificationKind,
  channel: NotificationChannel,
  prefs: Partial<Record<NotificationKind, NotificationChannel[]>> | undefined
): boolean {
  const allowed = prefs?.[kind];
  if (!allowed || allowed.length === 0) return channel === "in_app";
  return allowed.includes(channel);
}
