"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";

import { getProfileAvatarInitials, isValidProfileImageUrl } from "@/lib/profile-image-url";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  avatarUrl: string;
  fullName: string;
  /** Username (no @) or other fallback label for initials */
  handle: string;
  sizeClass?: string;
  ringClassName?: string;
  className?: string;
};

export function ProfileAvatar({
  avatarUrl,
  fullName,
  handle,
  sizeClass = "size-20",
  ringClassName = "ring-2 ring-pu-magenta/35 ring-offset-2 ring-offset-zinc-950",
  className,
}: ProfileAvatarProps) {
  const url = avatarUrl.trim();
  const urlOk = Boolean(url && isValidProfileImageUrl(url));
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const showImg = urlOk && brokenUrl !== url;
  const initials = getProfileAvatarInitials(fullName, handle);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-zinc-700/90 to-zinc-900",
        ringClassName,
        sizeClass,
        className
      )}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-supplied arbitrary hosts
        <img
          src={url}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setBrokenUrl(url)}
        />
      ) : initials ? (
        <span
          className="flex size-full items-center justify-center font-heading text-lg font-black tracking-tight text-white/90 sm:text-xl"
          aria-hidden
        >
          {initials}
        </span>
      ) : (
        <span className="flex size-full items-center justify-center text-white/55" aria-hidden>
          <UserRound className="size-[45%] max-w-[2.5rem]" strokeWidth={1.75} />
        </span>
      )}
    </div>
  );
}
