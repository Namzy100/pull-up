"use client";

import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getFollowableVenue } from "@/lib/follow-venues";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

type FollowVenueButtonProps = {
  venueId: string;
  /** Text button vs icon-dominant */
  variant?: "default" | "compact";
  className?: string;
};

export function FollowVenueButton({
  venueId,
  variant = "default",
  className,
}: FollowVenueButtonProps) {
  const spot = getFollowableVenue(venueId);
  const following = useAppStore((s) => s.followedVenueIds.includes(venueId));
  const toggle = useAppStore((s) => s.toggleFollowVenue);

  if (!spot) return null;

  if (variant === "compact") {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-pressed={following}
        aria-label={following ? `Unfollow ${spot.name}` : `Follow ${spot.name}`}
        className={cn(
          "shrink-0 border-pu-border px-2.5 font-bold",
          following &&
            "border-pu-magenta/50 bg-pu-magenta-dim/25 text-white shadow-[0_0_14px_-6px_oklch(0.7_0.29_328/0.35)]",
          className
        )}
        onClick={() => toggle(venueId)}
      >
        <UserPlus className="mr-1 size-3.5" aria-hidden />
        {following ? "Following" : "Follow"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={following}
      aria-label={following ? `Unfollow ${spot.name}` : `Follow ${spot.name}`}
      className={cn(
        "border-pu-border font-bold text-white hover:bg-white/8",
        following &&
          "border-pu-magenta/50 bg-pu-magenta-dim/25 text-white shadow-[0_0_18px_-6px_oklch(0.7_0.29_328/0.35)]",
        className
      )}
      onClick={() => toggle(venueId)}
    >
      <UserPlus className={cn("size-4", following && "text-pu-magenta")} aria-hidden />
      <span className="ml-2">{following ? "Following" : "Follow spot"}</span>
    </Button>
  );
}
