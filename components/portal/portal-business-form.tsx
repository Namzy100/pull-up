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
      className="space-y-5 rounded-2xl border border-pu-border bg-gradient-to-b from-pu-surface/90 to-black p-5"
    >
      <div className="flex items-start gap-2 border-b border-pu-border pb-4">
        <Store className="mt-0.5 size-5 shrink-0 text-pu-amber" aria-hidden />
        <div>
          <h2 className="font-heading text-lg font-extrabold tracking-tight text-white">
            Create deal
          </h2>
          <p className="pu-meta mt-1">
            Drop an offer for campus. Submissions stay in review until an admin clears
            them.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-name">Business name</Label>
          <Input
            id="biz-name"
            value={values.businessName}
            onChange={(e) => set("businessName")(e.target.value)}
            className={inputClass}
            placeholder="Venue or brand as students know it"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-title">Deal title</Label>
          <Input
            id="biz-title"
            value={values.dealTitle}
            onChange={(e) => set("dealTitle")(e.target.value)}
            className={inputClass}
            placeholder="$5 cover before 10 · pitcher night…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Category</Label>
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
          <Label htmlFor="biz-perk">Offer / perk</Label>
          <Input
            id="biz-perk"
            value={values.perk}
            onChange={(e) => set("perk")(e.target.value)}
            className={inputClass}
            placeholder="2-for-1 slices, $15 pitchers…"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="biz-from">Valid from</Label>
          <Input
            id="biz-from"
            type="date"
            value={values.validFrom}
            onChange={(e) => set("validFrom")(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="biz-until">Valid until</Label>
          <Input
            id="biz-until"
            type="date"
            value={values.validUntil}
            onChange={(e) => set("validUntil")(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-area">Location area</Label>
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
          <Label htmlFor="biz-desc">Description</Label>
          <Textarea
            id="biz-desc"
            value={values.description}
            onChange={(e) => set("description")(e.target.value)}
            className={cn(inputClass, "min-h-24 py-2.5")}
            placeholder="Hours, exclusions, how to redeem…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-img">Image URL</Label>
          <Input
            id="biz-img"
            value={values.imageUrl}
            onChange={(e) => set("imageUrl")(e.target.value)}
            className={inputClass}
            placeholder="https://…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-ext">External link (optional)</Label>
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
        <p className="text-sm font-semibold text-pu-urgent-glow" role="alert">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="text-sm font-semibold text-pu-live" role="status">
          Deal submitted. Admin review pending.
        </p>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-black uppercase tracking-[0.08em] text-white shadow-[0_0_22px_-8px_oklch(0.7_0.29_328/0.45)]"
      >
        <Send className="mr-2 size-4" aria-hidden />
        Submit deal
      </Button>
    </form>
  );
}
