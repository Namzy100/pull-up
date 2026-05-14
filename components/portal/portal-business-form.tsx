"use client";

import { useState } from "react";
import { Send, Store } from "lucide-react";

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
import { PORTAL_DEAL_CATEGORY_OPTIONS } from "@/lib/portal-constants";
import type { BusinessDealFormValues } from "@/lib/portal-types";
import { validateBusinessSubmission } from "@/lib/portal-validation";
import type { DealFilterId } from "@/lib/types";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

const emptyDeal: BusinessDealFormValues = {
  businessName: "",
  dealTitle: "",
  categoryTag: "food",
  perk: "",
  validFrom: "",
  validUntil: "",
  area: "",
  studentOnly: false,
  description: "",
  imageUrl: "",
  externalUrl: "",
};

const inputClass =
  "h-10 rounded-xl border-pu-border bg-black/45 text-white placeholder:text-white/38 md:text-sm";

type PortalBusinessFormProps = {
  onSubmitted?: () => void | Promise<void>;
};

export function PortalBusinessForm({ onSubmitted }: PortalBusinessFormProps = {}) {
  const submit = useAppStore((s) => s.submitBusinessDealForApproval);
  const [values, setValues] = useState<BusinessDealFormValues>(emptyDeal);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set =
    <K extends keyof BusinessDealFormValues>(key: K) =>
    (v: BusinessDealFormValues[K]) => {
      setValues((s) => ({ ...s, [key]: v }));
      setError(null);
      setDone(false);
    };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateBusinessSubmission(values);
    if (validationError) {
      setError(validationError);
      return;
    }
    const result = await submit(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setValues(emptyDeal);
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
        <Store className="mt-0.5 size-5 shrink-0 text-pu-amber" aria-hidden />
        <div className="min-w-0">
          <h2 className="font-heading text-base font-bold tracking-tight text-white sm:text-lg">
            Create deal
          </h2>
          <p className="pu-meta mt-1.5 leading-relaxed">
            Drop an offer for campus. Submissions stay in review until an admin clears
            them.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-name" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Business name</Label>
          <Input
            id="biz-name"
            value={values.businessName}
            onChange={(e) => set("businessName")(e.target.value)}
            className={inputClass}
            placeholder="Venue or brand as students know it"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-title" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Deal title</Label>
          <Input
            id="biz-title"
            value={values.dealTitle}
            onChange={(e) => set("dealTitle")(e.target.value)}
            className={inputClass}
            placeholder="$5 cover before 10 · pitcher night…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Category</Label>
          <Select
            value={values.categoryTag}
            onValueChange={(v) => set("categoryTag")(v as DealFilterId)}
          >
            <SelectTrigger className={cn(inputClass, "w-full")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PORTAL_DEAL_CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-perk" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Offer / perk</Label>
          <Input
            id="biz-perk"
            value={values.perk}
            onChange={(e) => set("perk")(e.target.value)}
            className={inputClass}
            placeholder="2-for-1 slices, $15 pitchers…"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="biz-from" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Valid from</Label>
          <Input
            id="biz-from"
            type="date"
            value={values.validFrom}
            onChange={(e) => set("validFrom")(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="biz-until" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Valid until</Label>
          <Input
            id="biz-until"
            type="date"
            value={values.validUntil}
            onChange={(e) => set("validUntil")(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-area" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Location area</Label>
          <Input
            id="biz-area"
            value={values.area}
            onChange={(e) => set("area")(e.target.value)}
            className={inputClass}
            placeholder="Green St, Downtown Champaign…"
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-pu-border bg-black/35 px-3 py-3 sm:col-span-2">
          <div>
            <p className="text-sm font-bold text-white">Student-only</p>
            <p className="pu-meta text-[0.75rem]">Require ID at the door (mock flag).</p>
          </div>
          <Switch
            checked={values.studentOnly}
            onCheckedChange={(c) => set("studentOnly")(c)}
            aria-label="Student only deal"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-desc" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Description</Label>
          <Textarea
            id="biz-desc"
            value={values.description}
            onChange={(e) => set("description")(e.target.value)}
            className={cn(inputClass, "min-h-24 py-2.5")}
            placeholder="Hours, exclusions, how to redeem…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-img" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Image URL</Label>
          <Input
            id="biz-img"
            value={values.imageUrl}
            onChange={(e) => set("imageUrl")(e.target.value)}
            className={inputClass}
            placeholder="https://…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-ext" className="text-[11px] font-semibold uppercase tracking-wide text-white/55">External link (optional)</Label>
          <Input
            id="biz-ext"
            value={values.externalUrl}
            onChange={(e) => set("externalUrl")(e.target.value)}
            className={inputClass}
            placeholder="Menu, maps link, promo page…"
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
          Deal submitted. Admin review pending.
        </div>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-bold uppercase tracking-[0.07em] text-white shadow-[0_4px_24px_-12px_oklch(0.7_0.29_328/0.35)]"
      >
        <Send className="mr-2 size-4" aria-hidden />
        Submit deal
      </Button>
    </form>
  );
}
