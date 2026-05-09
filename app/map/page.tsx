import type { Metadata } from "next";

import { CampusRadarMap } from "@/components/map/campus-radar-map";

export const metadata: Metadata = {
  title: "Campus radar — Pull Up",
  description:
    "Mock UIUC / Champaign-Urbana heat map — see where the night is heating up before you pull up.",
};

export default function MapPage() {
  return <CampusRadarMap />;
}
