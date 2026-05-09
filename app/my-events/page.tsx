import type { Metadata } from "next";

import { MyEventsContent } from "@/components/my-events/my-events-content";

export const metadata: Metadata = {
  title: "Your moves — Pull Up",
  description:
    "RSVPs, saved events, and locked deals. Don’t lose the plan before tonight peaks.",
};

export default function MyEventsPage() {
  return <MyEventsContent />;
}
