import type { Holder } from "./types";

export const mockHolders: Holder[] = [
  // Fund III & Opp II GP
  { id: "h-abp-gp", name: "ABP Capital GP, LLC", holderType: "llc", taxIdLastFour: null, contactEmail: null, notes: "General partner of ABP RE Fund III" },
  { id: "h-abp-opp-gp", name: "ABP Opportunity GP, LLC", holderType: "llc", taxIdLastFour: null, contactEmail: null, notes: "General partner of ABP Opportunity Fund II" },

  // Main operating entity
  { id: "h-abp-capital", name: "ABP Capital, LLC", holderType: "llc", taxIdLastFour: null, contactEmail: null, notes: "ABP Capital parent entity" },

  // Trusts & Family
  { id: "h-bunker-trust", name: "Bunker Family Trust", holderType: "trust", taxIdLastFour: "4521", contactEmail: "rbunker@abpcapital.com", notes: null },
  { id: "h-sullivan-trust", name: "Sullivan Irrevocable Trust", holderType: "trust", taxIdLastFour: "7832", contactEmail: null, notes: null },
  { id: "h-martinez-trust", name: "Martinez Living Trust", holderType: "trust", taxIdLastFour: "3910", contactEmail: null, notes: null },
  { id: "h-thompson-trust", name: "Thompson Living Trust", holderType: "trust", taxIdLastFour: null, contactEmail: null, notes: null },
  { id: "h-davis-trust", name: "Davis Charitable Trust", holderType: "trust", taxIdLastFour: null, contactEmail: null, notes: null },

  // LLCs & LPs
  { id: "h-peterson", name: "Peterson Holdings, LLC", holderType: "llc", taxIdLastFour: "6201", contactEmail: null, notes: null },
  { id: "h-whitfield", name: "Whitfield Capital, LP", holderType: "lp", taxIdLastFour: null, contactEmail: null, notes: null },
  { id: "h-sierra-vista", name: "Sierra Vista Partners", holderType: "lp", taxIdLastFour: null, contactEmail: null, notes: null },
  { id: "h-coastal", name: "Coastal Ventures, LLC", holderType: "llc", taxIdLastFour: null, contactEmail: null, notes: null },
  { id: "h-greenfield", name: "Greenfield Family LP", holderType: "lp", taxIdLastFour: null, contactEmail: null, notes: null },
  { id: "h-landmark", name: "Landmark Partners, LLC", holderType: "llc", taxIdLastFour: null, contactEmail: null, notes: null },
  { id: "h-redwood", name: "Redwood Ventures", holderType: "llc", taxIdLastFour: null, contactEmail: null, notes: null },
  { id: "h-apex", name: "Apex Capital Group", holderType: "llc", taxIdLastFour: null, contactEmail: null, notes: null },

  // Corporates & Others
  { id: "h-chen", name: "Chen Investment Partners", holderType: "llc", taxIdLastFour: "5543", contactEmail: null, notes: null },
  { id: "h-nakamura", name: "Nakamura Family Office", holderType: "llc", taxIdLastFour: null, contactEmail: null, notes: null },
  { id: "h-pacific-rim", name: "Pacific Rim Investors", holderType: "llc", taxIdLastFour: null, contactEmail: null, notes: null },
  { id: "h-mgmt-plan", name: "Management Stock Plan", holderType: "esop", taxIdLastFour: null, contactEmail: null, notes: "2026 equity incentive plan" },
];
