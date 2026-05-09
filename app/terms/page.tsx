import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Pull Up beta usage terms.",
};

export default function TermsPage() {
  return (
    <div className="pu-screen px-4 pb-10 pt-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-pu-border bg-black/35 p-5">
        <h1 className="pu-display text-[2rem]">Terms</h1>
        <p className="pu-meta mt-2">
          Pull Up is an early-stage beta product for live campus discovery.
        </p>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-white/78">
          <p>
            Use Pull Up responsibly. Event and deal information can change quickly and may
            be user-submitted.
          </p>
          <p>
            We may remove content, limit access, or update features to keep the product
            safe and reliable.
          </p>
          <p>
            You are responsible for following venue rules, local law, and campus policy
            when attending events discovered through the app.
          </p>
          <p>
            These terms will evolve as Pull Up moves from beta to production.
          </p>
        </div>
      </div>
    </div>
  );
}
