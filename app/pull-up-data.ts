export type AccountType = "student" | "host" | "admin";
export type VenueState = "rising" | "stable" | "uncertain";
export type Risk = "low" | "watch" | "high";

export type DemoProfile = {
  accountType: AccountType;
  canHostUnofficial: boolean;
  displayName: string;
  email: string;
};

export const demoProfiles: Record<AccountType, DemoProfile> = {
  student: {
    accountType: "student",
    canHostUnofficial: true,
    displayName: "Naman Behl",
    email: "naman@illinois.edu",
  },
  host: {
    accountType: "host",
    canHostUnofficial: false,
    displayName: "Joes Ops",
    email: "ops@joes.example",
  },
  admin: {
    accountType: "admin",
    canHostUnofficial: false,
    displayName: "Pull Up Trust",
    email: "trust@pullup.example",
  },
};

export const venues = [
  {
    name: "Joes Brewery",
    host: "Joes ops desk",
    type: "Campus bar",
    state: "rising" as VenueState,
    confidence: 86,
    distance: "0.4 mi",
    cover: "$5 after 10:30",
    age: "19+",
    friends: "18 friends saved or heading there",
    proof: "42 verified arrivals, 3 ambassador checks",
    risk: "low" as Risk,
  },
  {
    name: "Canopy Club",
    host: "Canopy show team",
    type: "Live event",
    state: "rising" as VenueState,
    confidence: 79,
    distance: "1.1 mi",
    cover: "$12 advance",
    age: "18+",
    friends: "7 friends committed",
    proof: "Ticket scans accelerated after opener",
    risk: "low" as Risk,
  },
  {
    name: "KAMS",
    host: "KAMS promotions",
    type: "Nightlife staple",
    state: "stable" as VenueState,
    confidence: 71,
    distance: "0.7 mi",
    cover: "$10",
    age: "19+",
    friends: "9 friends watching",
    proof: "Arrivals flattened after 10:15",
    risk: "watch" as Risk,
  },
  {
    name: "Murphys Pub",
    host: "Murphys manager",
    type: "Pub",
    state: "uncertain" as VenueState,
    confidence: 39,
    distance: "0.5 mi",
    cover: "No cover",
    age: "21+",
    friends: "4 friends interested",
    proof: "Host report conflicts with check-ins",
    risk: "high" as Risk,
  },
];

export const adminQueue = [
  {
    title: "Conflicting host claim",
    venue: "Murphys Pub",
    detail: "Host says line is building; verified arrivals are stale.",
    risk: "high" as Risk,
  },
  {
    title: "Duplicate intent cluster",
    venue: "KAMS",
    detail: "Nine saves from adjacent accounts inside six minutes.",
    risk: "watch" as Risk,
  },
  {
    title: "Ambassador lift",
    venue: "Joes Brewery",
    detail: "Trusted field reports match check-in velocity.",
    risk: "low" as Risk,
  },
];

export function stateCopy(state: VenueState) {
  if (state === "rising") return "Rising";
  if (state === "stable") return "Stable";
  return "No call";
}

export function riskCopy(risk: Risk) {
  if (risk === "low") return "Clean";
  if (risk === "watch") return "Watch";
  return "Review";
}
