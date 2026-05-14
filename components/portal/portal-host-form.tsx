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
      className="space-y-5 rounded-2xl border border-pu-border bg-gradient-to-b from-pu-surface/90 to-black p-5"
    >
      <div className="flex items-start gap-2 border-b border-pu-border pb-4">
        <CalendarRange className="mt-0.5 size-5 shrink-0 text-pu-magenta" aria-hidden />
        <div>
          <h2 className="font-heading text-lg font-extrabold tracking-tight text-white">
            Create event
          </h2>
          <p className="pu-meta mt-1">
            Verified hosts control the pulse. Everything here goes to admin review
            before it hits campus.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-title">Event title</Label>
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
          <Label>Category</Label>
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
          <Label htmlFor="host-date">Date</Label>
          <Input
            id="host-date"
            type="date"
            value={values.date}
            onChange={(e) => set("date")(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="host-start">Start time</Label>
          <Input
            id="host-start"
            type="time"
            value={values.startTime}
            onChange={(e) => set("startTime")(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="host-end">End time</Label>
          <Input
            id="host-end"
            type="time"
            value={values.endTime}
            onChange={(e) => set("endTime")(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-area">Area / location</Label>
          <Input
            id="host-area"
            value={values.area}
            onChange={(e) => set("area")(e.target.value)}
            className={inputClass}
            placeholder="Green St, Gregory Dr, Campustown…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-venue">Venue / house / frat / org</Label>
          <Input
            id="host-venue"
            value={values.venue}
            onChange={(e) => set("venue")(e.target.value)}
            className={inputClass}
            placeholder="Chapter house, bar name, RSO…"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="host-cover">Cover price (USD, blank if free)</Label>
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
          <Label>Entry type</Label>
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
          <Label htmlFor="host-stag">Stag rule</Label>
          <Input
            id="host-stag"
            value={values.stagRule}
            onChange={(e) => set("stagRule")(e.target.value)}
            className={inputClass}
            placeholder="Ratio til 11, open, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="host-age">Age restriction</Label>
          <Input
            id="host-age"
            value={values.ageRestriction}
            onChange={(e) => set("ageRestriction")(e.target.value)}
            className={inputClass}
            placeholder="18+, 19+, all ages…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-vibe">Vibe / music</Label>
          <Input
            id="host-vibe"
            value={values.vibeMusic}
            onChange={(e) => set("vibeMusic")(e.target.value)}
            className={inputClass}
            placeholder="House, hip-hop, country night…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-desc">Description</Label>
          <Textarea
            id="host-desc"
            value={values.description}
            onChange={(e) => set("description")(e.target.value)}
            className={cn(inputClass, "min-h-28 py-2.5")}
            placeholder="Door time, dress code, what to expect…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-img">Image / flyer URL</Label>
          <Input
            id="host-img"
            value={values.imageUrl}
            onChange={(e) => set("imageUrl")(e.target.value)}
            className={inputClass}
            placeholder="https://…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="host-ext">External link (optional)</Label>
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
        <p className="text-sm font-semibold text-pu-urgent-glow" role="alert">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="text-sm font-semibold text-pu-live" role="status">
          Move submitted. Admin review pending.
        </p>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-black uppercase tracking-[0.08em] text-white shadow-[0_0_22px_-8px_oklch(0.7_0.29_328/0.45)]"
      >
        <Send className="mr-2 size-4" aria-hidden />
        Submit event
      </Button>
    </form>
  );
}
