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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PORTAL_BUSINESS_PROMO_TYPE_OPTIONS } from "@/lib/portal-constants";
import type { BusinessEventPromoFormValues } from "@/lib/portal-types";
import type { BusinessPromoTypeId } from "@/lib/supabase/business-deal-payload";
import { validateBusinessEventPromoSubmission } from "@/lib/portal-validation";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

const emptyPromo: BusinessEventPromoFormValues = {
  businessName: "",
  promoTitle: "",
  promoType: "event",
  description: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  area: "",
  imageUrl: "",
  entryInfo: "",
  studentOnly: false,
  expectedVibe: "",
  externalUrl: "",
};

const inputClass =
  "h-10 rounded-xl border-pu-border bg-black/45 text-white placeholder:text-white/38 md:text-sm";

type PortalBusinessEventPromoFormProps = {
  onSubmitted?: () => void | Promise<void>;
};

export function PortalBusinessEventPromoForm({
  onSubmitted,
}: PortalBusinessEventPromoFormProps = {}) {
  const submit = useAppStore((s) => s.submitBusinessEventPromoForApproval);
  const [values, setValues] = useState<BusinessEventPromoFormValues>(emptyPromo);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set =
    <K extends keyof BusinessEventPromoFormValues>(key: K) =>
    (v: BusinessEventPromoFormValues[K]) => {
      setValues((s) => ({ ...s, [key]: v }));
      setError(null);
      setDone(false);
    };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateBusinessEventPromoSubmission(values);
    if (validationError) {
      setError(validationError);
      return;
    }
    const result = await submit(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setValues(emptyPromo);
    setDone(true);
    setError(null);
    await onSubmitted?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-950/25 to-black p-5"
    >
      <div className="flex items-start gap-2 border-b border-amber-500/20 pb-4">
        <CalendarRange className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden />
        <div>
          <h2 className="font-heading text-lg font-extrabold tracking-tight text-white">
            Create event / promo
          </h2>
          <p className="pu-meta mt-1">
            One-night moves, watch parties, drops — same review path as deals. Food specials and
            limited drops publish to Deals when approved.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bep-name">Business name</Label>
          <Input
            id="bep-name"
            value={values.businessName}
            onChange={(e) => set("businessName")(e.target.value)}
            className={inputClass}
            placeholder="As students know you on campus"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bep-title">Promo / event title</Label>
          <Input
            id="bep-title"
            value={values.promoTitle}
            onChange={(e) => set("promoTitle")(e.target.value)}
            className={inputClass}
            placeholder="Late-night DJ · gameday buckets…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Type</Label>
          <Select
            value={values.promoType}
            onValueChange={(v) => set("promoType")(v as BusinessPromoTypeId)}
          >
            <SelectTrigger className={cn(inputClass, "w-full")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PORTAL_BUSINESS_PROMO_TYPE_OPTIONS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bep-desc">Description</Label>
          <Textarea
            id="bep-desc"
            value={values.description}
            onChange={(e) => set("description")(e.target.value)}
            className={cn(inputClass, "min-h-24 py-2.5")}
            placeholder="What happens, who it’s for, dress code, door policy…"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bep-date">Date</Label>
          <Input
            id="bep-date"
            type="date"
            value={values.eventDate}
            onChange={(e) => set("eventDate")(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="hidden sm:block" aria-hidden />

        <div className="space-y-2">
          <Label htmlFor="bep-start">Start time</Label>
          <Input
            id="bep-start"
            type="time"
            value={values.startTime}
            onChange={(e) => set("startTime")(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bep-end">End time</Label>
          <Input
            id="bep-end"
            type="time"
            value={values.endTime}
            onChange={(e) => set("endTime")(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bep-area">Location / area</Label>
          <Input
            id="bep-area"
            value={values.area}
            onChange={(e) => set("area")(e.target.value)}
            className={inputClass}
            placeholder="Green St, State Farm Center lot…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bep-img">Image / flyer URL (optional)</Label>
          <Input
            id="bep-img"
            value={values.imageUrl}
            onChange={(e) => set("imageUrl")(e.target.value)}
            className={inputClass}
            placeholder="https://… (defaults to a stock flyer if empty)"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bep-entry">Entry / price info (optional)</Label>
          <Input
            id="bep-entry"
            value={values.entryInfo}
            onChange={(e) => set("entryInfo")(e.target.value)}
            className={inputClass}
            placeholder="Free before 10 · $10 after · RSVP only…"
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-pu-border bg-black/35 px-3 py-3 sm:col-span-2">
          <div>
            <p className="text-sm font-bold text-white">Student-only</p>
            <p className="pu-meta text-[0.75rem]">Marks student ID / campus eligibility.</p>
          </div>
          <Switch
            checked={values.studentOnly}
            onCheckedChange={(c) => set("studentOnly")(c)}
            aria-label="Student only event or promo"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bep-vibe">Expected vibe / crowd (optional)</Label>
          <Input
            id="bep-vibe"
            value={values.expectedVibe}
            onChange={(e) => set("expectedVibe")(e.target.value)}
            className={inputClass}
            placeholder="Packed bar energy, chill study crowd…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bep-ext">External link (optional)</Label>
          <Input
            id="bep-ext"
            value={values.externalUrl}
            onChange={(e) => set("externalUrl")(e.target.value)}
            className={inputClass}
            placeholder="Tickets, menu, maps…"
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm font-semibold text-pu-urgent-glow" role="alert">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="text-sm font-semibold text-amber-200" role="status">
          Event / promo submitted. Admin review pending.
        </p>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-amber-600 to-amber-400 font-black uppercase tracking-[0.08em] text-black shadow-[0_0_22px_-8px_oklch(0.75_0.18_75/0.45)] hover:from-amber-500 hover:to-amber-300"
      >
        <Send className="mr-2 size-4" aria-hidden />
        Submit event / promo
      </Button>
    </form>
  );
}
