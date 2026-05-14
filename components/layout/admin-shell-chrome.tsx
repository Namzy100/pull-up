"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";

type AdminShellChromeProps = {
  displayName: string;
  username: string;
  email: string | null;
  avatarUrl: string;
};

export function AdminShellChrome({
  displayName,
  username,
  email,
  avatarUrl,
}: AdminShellChromeProps) {
  const router = useRouter();
  const logout = useAppStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/90 bg-zinc-950/95 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/88">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2.5 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:flex-initial sm:min-w-[12rem]">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-700">
            <Image
              src={avatarUrl}
              alt=""
              fill
              className="object-cover"
              sizes="36px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-zinc-100">{displayName}</span>
              <span className="shrink-0 rounded border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200/95">
                Admin
              </span>
            </div>
            <p className="truncate text-[11px] font-medium text-zinc-500">@{username}</p>
            {email ? (
              <p className="truncate text-[11px] text-zinc-600" title={email}>
                {email}
              </p>
            ) : null}
          </div>
        </div>

        <nav
          className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:ml-auto sm:w-auto sm:flex-nowrap"
          aria-label="Admin session"
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 border border-transparent px-2.5 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <Link href="/admin/tools/account">Account</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 border border-transparent px-2.5 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <Link href="/" title="Open the Tonight feed as a consumer preview (same session)">
              Preview app
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 border-zinc-600 bg-zinc-900/80 px-2.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-800"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-3.5 opacity-90" aria-hidden />
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}
