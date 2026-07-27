export type AccountType = "student" | "host" | "admin";
export type MomentumState =
  | "hot"
  | "building-fast"
  | "rising"
  | "steady"
  | "quiet"
  | "cooling"
  | "no-reliable-call";
export type SignalConfidence = "high" | "medium" | "low";
export type Risk = "low" | "watch" | "high";

export type DemoProfile = {
  accountType: AccountType;
  canHostUnofficial: boolean;
  displayName: string;
  email: string;
};

export type Venue = {
  name: string;
  host: string;
  type: string;
  momentum: MomentumState;
  momentumPct: number;
  confidence: SignalConfidence;
  internalScore: number;
  explanation: string;
  peak: string;
  arrivalWindow: string;
  crewIntent: string;
  crewSubtext: string;
  friends: string[];
  friendCount: number;
  campusIntent: string;
  evidence: string[];
  updated: string;
  distance: string;
  walkTime: string;
  cover: string;
  line: string;
  age: string;
  action: string;
  risk: Risk;
};

export const demoProfiles: Record<AccountType, DemoProfile> = {
  student: {
    accountType: "student",
    canHostUnofficial: true,
    displayName: "Sarah Patel",
    email: "sarah@illinois.edu",
  },
  host: {
    accountType: "host",
    canHostUnofficial: false,
    displayName: "Joe's Ops",
    email: "ops@joes.example",
  },
  admin: {
    accountType: "admin",
    canHostUnofficial: false,
    displayName: "Pull Up Trust",
    email: "trust@pullup.example",
  },
};

export const venues: Venue[] = [
  {
    name: "Joe's",
    host: "Joe's operations",
    type: "Campus bar",
    momentum: "building-fast",
    momentumPct: 86,
    confidence: "high",
    internalScore: 86,
    explanation:
      "Verified arrivals are accelerating and the line is still short. This is where the night is tipping.",
    peak: "Likely to peak around 11:15",
    arrivalWindow: "Go before 10:45",
    crewIntent: "4 friends leaning here",
    crewSubtext: "Maya and Dev already saved it",
    friends: ["SP", "MK", "DR", "AR"],
    friendCount: 4,
    campusIntent: "18 students heading there",
    evidence: ["42 verified arrivals", "3 ambassador reports", "Cover confirmed by host"],
    updated: "Updated 4 min ago",
    distance: "0.4 mi",
    walkTime: "8 min walk",
    cover: "$5 cover",
    line: "Moderate line",
    age: "19+",
    action: "Start a plan",
    risk: "low",
  },
  {
    name: "KAMS",
    host: "KAMS promotions",
    type: "Nightlife staple",
    momentum: "steady",
    momentumPct: 64,
    confidence: "medium",
    internalScore: 71,
    explanation: "Reliable traffic, holding steady rather than climbing.",
    peak: "Even through midnight",
    arrivalWindow: "Best after 10:30",
    crewIntent: "3 friends interested",
    crewSubtext: "Arjun is watching this one",
    friends: ["AK", "MP", "RS"],
    friendCount: 3,
    campusIntent: "12 students heading there",
    evidence: ["19 verified arrivals", "Friend intent is steady", "Line report 9 min ago"],
    updated: "Updated 9 min ago",
    distance: "0.7 mi",
    walkTime: "13 min walk",
    cover: "$10 cover",
    line: "Short line",
    age: "19+",
    action: "Start a plan",
    risk: "watch",
  },
  {
    name: "Murphy's Pub",
    host: "Murphy's manager",
    type: "Pub",
    momentum: "quiet",
    momentumPct: 34,
    confidence: "medium",
    internalScore: 58,
    explanation: "Easy and low-key right now. Good for a smaller group.",
    peak: "No rush expected",
    arrivalWindow: "Easy any time",
    crewIntent: "1 friend nearby",
    crewSubtext: "Priya is close by",
    friends: ["PV"],
    friendCount: 1,
    campusIntent: "8 students saved it",
    evidence: ["Cover confirmed", "Line verified quiet", "Historical Friday pattern"],
    updated: "Updated 6 min ago",
    distance: "0.5 mi",
    walkTime: "9 min walk",
    cover: "No cover",
    line: "No line",
    age: "21+",
    action: "Invite crew",
    risk: "low",
  },
  {
    name: "The Red Lion",
    host: "Lion host team",
    type: "Campus bar",
    momentum: "no-reliable-call",
    momentumPct: 0,
    confidence: "low",
    internalScore: 34,
    explanation:
      "A few saves, but arrivals and reports do not agree yet. Pull Up is holding the call until it is trustworthy.",
    peak: "Not enough signal",
    arrivalWindow: "Wait for a cleaner read",
    crewIntent: "2 friends watching",
    crewSubtext: "Nobody has committed yet",
    friends: ["JL", "TN"],
    friendCount: 2,
    campusIntent: "No reliable campus trend",
    evidence: ["Host report pending review", "Arrivals too sparse", "Last report 31 min ago"],
    updated: "Updated 31 min ago",
    distance: "0.6 mi",
    walkTime: "11 min walk",
    cover: "$10 cover",
    line: "Unknown line",
    age: "19+",
    action: "Watch this spot",
    risk: "high",
  },
];

export const fridayJourney = [
  {
    time: "9:15 PM",
    title: "Sarah opens Pull Up",
    detail: "She sees Joe's building fast, while The Red Lion has no reliable call yet.",
  },
  {
    time: "9:22 PM",
    title: "The crew leans in",
    detail: "Four friends mark private interest in Joe's without exposing live location trails.",
  },
  {
    time: "9:40 PM",
    title: "Arrival window locks",
    detail: "Pull Up recommends going before 10:45 because verified arrivals are accelerating.",
  },
  {
    time: "10:36 PM",
    title: "One arrival verifies conditions",
    detail: "A crew member confirms moderate line and $5 cover, improving the signal for others.",
  },
];

export const coldStartStages = [
  { users: "25 users", mode: "Official info plus ambassador reports. Pull Up abstains often." },
  { users: "100 users", mode: "Crew intent starts shaping useful local recommendations." },
  { users: "500 users", mode: "Verified arrivals and fresh reports make momentum visible." },
  { users: "Campus-wide", mode: "Student, host, and admin evidence produces reliable live calls." },
];

export const signalHierarchy = [
  "Official venue information",
  "Trusted ambassadors",
  "Host-submitted operational facts",
  "Explicit student intent",
  "Verified arrivals",
  "Recent crowd reports",
  "Historical patterns, used carefully",
  "Abstention when evidence is weak",
];

export const adminQueue = [
  {
    title: "Host claim conflicts with arrivals",
    venue: "The Red Lion",
    detail: "Host says line is building; verified arrivals are too sparse to publish momentum.",
    risk: "high" as Risk,
  },
  {
    title: "Intent cluster needs review",
    venue: "KAMS",
    detail: "Several new accounts saved the same plan within six minutes.",
    risk: "watch" as Risk,
  },
  {
    title: "Ambassador report supports listing",
    venue: "Joe's",
    detail: "Fresh line report matches verified arrival velocity.",
    risk: "low" as Risk,
  },
];

export const crewMembers = ["Maya", "Dev", "Arjun", "Priya", "Noah", "Bella"];

export const arrivalWindows = ["10:15 – 10:30", "10:30 – 10:45", "10:45 – 11:00"];

export function momentumCopy(momentum: MomentumState) {
  const labels: Record<MomentumState, string> = {
    hot: "Hot",
    "building-fast": "Building fast",
    rising: "Rising",
    steady: "Steady",
    quiet: "Quiet right now",
    cooling: "Cooling",
    "no-reliable-call": "No reliable call yet",
  };
  return labels[momentum];
}

export function confidenceCopy(confidence: SignalConfidence) {
  if (confidence === "high") return "Strong signal";
  if (confidence === "medium") return "Fair signal";
  return "Weak signal";
}

export function riskCopy(risk: Risk) {
  if (risk === "low") return "Clean";
  if (risk === "watch") return "Watch";
  return "Review";
}
