import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Pull Up privacy-first beta policy.",
};

export default function PrivacyPage() {
  return (
    <div className="pu-screen px-4 pb-10 pt-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-pu-border bg-black/35 p-5">
        <h1 className="pu-display text-[2rem]">Privacy</h1>
        <p className="pu-meta mt-2">
          Pull Up is a privacy-first beta. This page explains what we collect and why.
        </p>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-white/78">
          <p>
            Account and session data is required for authentication and security. Optional
            consent controls are off by default.
          </p>
          <p>
            Analytics, personalization, location usage, and marketing preferences are
            opt-in. You can change these settings in your profile at any time.
          </p>
          <p>
            Location context is only used when permission is granted. We do not claim
            perfect legal compliance in beta, and we continue improving controls.
          </p>
          <p>
            Export/deletion requests will be supported through support workflows while the
            product matures.
          </p>
        </div>
      </div>
    </div>
  );
}
