"use client";

import { useState } from "react";
import { CalendarRange, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PORTAL_EVENT_CATEGORIES } from "@/lib/portal-constants";
import type { HostEventFormValues } from "@/lib/portal-types";
import { validateHostSubmission } from "@/lib/portal-validation";
import type { EntryType } from "@/lib/types";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

const emptyHost: HostEventFormValues = {
  title: "",
  category: "frat_party",
  date: "",
  startTime: "",
  endTime: "",
  area: "",
  venue: "",
  coverDollars: "",
  entryType: "free",
  stagRule: "",
  ageRestriction: "",
  vibeMusic: "",
  description: "",
  imageUrl: "",
  externalUrl: "",
};

const inputClass =
  "h-10 rounded-xl border-pu-border bg-black/45 text-white placeholder:text-white/38 md:text-sm";

type PortalHostFormProps = {
  onSubmitted?: () => void | Promise<void>;
};

export function PortalHostForm({ onSubmitted }: PortalHostFormProps = {}) {
  const submit = useAppStore((s) => s.submitHostEventForApproval);
  const [values, setValues] = useState<HostEventFormValues>(emptyHost);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set =
    <K extends keyof HostEventFormValues>(key: K) =>
    (v: HostEventFormValues[K]) => {
      setValues((s) => ({ ...s, [key]: v }));
      setError(null);
      setDone(false);
    };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateHostSubmission(values);
    if (validationError) {
      setError(validationError);
      return;
    }
    const result = await submit(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setValues(emptyHost);
    setDone(true);
    setError(null);
    await onSubmitted?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-pu-surface/90 to-black p-5 sm:p-6"
    >
      <div className="flex items-start gap-3 border-b border-white/[0.06] pb-5">
        <CalendarRange className="mt-0.5 size-5 shrink-0 text-pu-magenta" aria-hidden />
        <div className="min-w-0">
          <h2 className="font-heading text-base font-bold tracking-tight text-white sm:text-lg">
            Create event
          </h2>
          <p className="pu-meta mt-1.5 leading-relaxed">
            Verified hosts control the pulse. Everything here goes to admin review
            before it hits campus.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-title" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Event title</Label>
          <Input
            id="host-title"
            value={values.title}
            onChange={(e) => set("title")(e.target.value)}
            className={inputClass}
            placeholder="Neon lawn · chapter social"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Category</Label>
          <Select
            value={values.category}
            onValueChange={(v) => set("category")(v as HostEventFormValues["category"])}
          >
            <SelectTrigger className={cn(inputClass, "w-full")}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {PORTAL_EVENT_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="host-date" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Date</Label>
          <Input
            id="host-date"
            type="date"
            value={values.date}
            onChange={(e) => set("date")(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="host-start" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Start time</Label>
          <Input
            id="host-start"
            type="time"
            value={values.startTime}
            onChange={(e) => set("startTime")(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="host-end" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">End time</Label>
          <Input
            id="host-end"
            type="time"
            value={values.endTime}
            onChange={(e) => set("endTime")(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-area" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Area / location</Label>
          <Input
            id="host-area"
            value={values.area}
            onChange={(e) => set("area")(e.target.value)}
            className={inputClass}
            placeholder="Green St, Gregory Dr, Campustown…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-venue" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Venue / house / frat / org</Label>
          <Input
            id="host-venue"
            value={values.venue}
            onChange={(e) => set("venue")(e.target.value)}
            className={inputClass}
            placeholder="Chapter house, bar name, RSO…"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="host-cover" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Cover price (USD, blank if free)</Label>
          <Input
            id="host-cover"
            inputMode="decimal"
            value={values.coverDollars}
            onChange={(e) => set("coverDollars")(e.target.value)}
            className={inputClass}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Entry type</Label>
          <Select
            value={values.entryType}
            onValueChange={(v) => set("entryType")(v as EntryType)}
          >
            <SelectTrigger className={cn(inputClass, "w-full")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="cover">Cover</SelectItem>
              <SelectItem value="rsvp">RSVP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="host-stag" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Stag rule</Label>
          <Input
            id="host-stag"
            value={values.stagRule}
            onChange={(e) => set("stagRule")(e.target.value)}
            className={inputClass}
            placeholder="Ratio til 11, open, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="host-age" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Age restriction</Label>
          <Input
            id="host-age"
            value={values.ageRestriction}
            onChange={(e) => set("ageRestriction")(e.target.value)}
            className={inputClass}
            placeholder="18+, 19+, all ages…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-vibe" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Vibe / music</Label>
          <Input
            id="host-vibe"
            value={values.vibeMusic}
            onChange={(e) => set("vibeMusic")(e.target.value)}
            className={inputClass}
            placeholder="House, hip-hop, country night…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-desc" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Description</Label>
          <Textarea
            id="host-desc"
            value={values.description}
            onChange={(e) => set("description")(e.target.value)}
            className={cn(inputClass, "min-h-28 py-2.5")}
            placeholder="Door time, dress code, what to expect…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-img" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Image / flyer URL</Label>
          <Input
            id="host-img"
            value={values.imageUrl}
            onChange={(e) => set("imageUrl")(e.target.value)}
            className={inputClass}
            placeholder="https://…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-ext" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">External link (optional)</Label>
          <Input
            id="host-ext"
            value={values.externalUrl}
            onChange={(e) => set("externalUrl")(e.target.value)}
            className={inputClass}
            placeholder="Instagram, Partiful, ticketing off-app…"
          />
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/25 bg-red-950/30 px-3.5 py-2.5 text-sm font-medium leading-snug text-red-100"
        >
          {error}
        </div>
      ) : null}
      {done ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-950/25 px-3.5 py-2.5 text-sm font-medium leading-snug text-emerald-100"
        >
          Move submitted. Admin review pending.
        </div>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-bold uppercase tracking-[0.07em] text-white shadow-[0_4px_24px_-12px_oklch(0.7_0.29_328/0.35)]"
      >
        <Send className="mr-2 size-4" aria-hidden />
        Submit event
      </Button>
    </form>
  );
}
