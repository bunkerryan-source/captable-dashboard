import type { Holding } from "./types";

export const mockHoldings: Holding[] = [
  // ── ABP Real Estate Fund III, LP ──
  { id: "hold-f3-1", entityId: "e-fund-iii", holderId: "h-abp-gp", equityClassId: "ec-f3-gp", amount: 2.0, committedCapital: 500000, holderRole: "General partner" },
  { id: "hold-f3-1b", entityId: "e-fund-iii", holderId: "h-abp-gp", equityClassId: "ec-f3-lp", amount: null, committedCapital: null, holderRole: "General partner" },

  { id: "hold-f3-2", entityId: "e-fund-iii", holderId: "h-bunker-trust", equityClassId: "ec-f3-lp", amount: 18.5, committedCapital: 4625000, holderRole: "Limited partner" },
  { id: "hold-f3-2b", entityId: "e-fund-iii", holderId: "h-bunker-trust", equityClassId: "ec-f3-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  { id: "hold-f3-3", entityId: "e-fund-iii", holderId: "h-peterson", equityClassId: "ec-f3-lp", amount: 15.0, committedCapital: 3750000, holderRole: "Limited partner" },
  { id: "hold-f3-3b", entityId: "e-fund-iii", holderId: "h-peterson", equityClassId: "ec-f3-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  { id: "hold-f3-4", entityId: "e-fund-iii", holderId: "h-chen", equityClassId: "ec-f3-lp", amount: 12.0, committedCapital: 3000000, holderRole: "Limited partner" },
  { id: "hold-f3-4b", entityId: "e-fund-iii", holderId: "h-chen", equityClassId: "ec-f3-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  { id: "hold-f3-5", entityId: "e-fund-iii", holderId: "h-martinez-trust", equityClassId: "ec-f3-lp", amount: 10.0, committedCapital: 2500000, holderRole: "Limited partner" },
  { id: "hold-f3-5b", entityId: "e-fund-iii", holderId: "h-martinez-trust", equityClassId: "ec-f3-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  { id: "hold-f3-6", entityId: "e-fund-iii", holderId: "h-whitfield", equityClassId: "ec-f3-lp", amount: 9.5, committedCapital: 2375000, holderRole: "Limited partner" },
  { id: "hold-f3-6b", entityId: "e-fund-iii", holderId: "h-whitfield", equityClassId: "ec-f3-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  { id: "hold-f3-7", entityId: "e-fund-iii", holderId: "h-nakamura", equityClassId: "ec-f3-lp", amount: 8.0, committedCapital: 2000000, holderRole: "Limited partner" },
  { id: "hold-f3-7b", entityId: "e-fund-iii", holderId: "h-nakamura", equityClassId: "ec-f3-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  { id: "hold-f3-8", entityId: "e-fund-iii", holderId: "h-sullivan-trust", equityClassId: "ec-f3-lp", amount: 25.0, committedCapital: 6250000, holderRole: "Limited partner" },
  { id: "hold-f3-8b", entityId: "e-fund-iii", holderId: "h-sullivan-trust", equityClassId: "ec-f3-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  // ── ABP Development Holdings, LLC ──
  { id: "hold-d-1a", entityId: "e-dev-llc", holderId: "h-abp-capital", equityClassId: "ec-dev-a", amount: 5000, committedCapital: null, holderRole: "Managing member" },
  { id: "hold-d-1b", entityId: "e-dev-llc", holderId: "h-abp-capital", equityClassId: "ec-dev-b", amount: null, committedCapital: null, holderRole: "Managing member" },
  { id: "hold-d-1c", entityId: "e-dev-llc", holderId: "h-abp-capital", equityClassId: "ec-dev-vote", amount: 50.0, committedCapital: null, holderRole: "Managing member" },

  { id: "hold-d-2a", entityId: "e-dev-llc", holderId: "h-bunker-trust", equityClassId: "ec-dev-a", amount: 2000, committedCapital: null, holderRole: "Member" },
  { id: "hold-d-2b", entityId: "e-dev-llc", holderId: "h-bunker-trust", equityClassId: "ec-dev-b", amount: 1500, committedCapital: null, holderRole: "Member" },
  { id: "hold-d-2c", entityId: "e-dev-llc", holderId: "h-bunker-trust", equityClassId: "ec-dev-vote", amount: 20.0, committedCapital: null, holderRole: "Member" },

  { id: "hold-d-3a", entityId: "e-dev-llc", holderId: "h-peterson", equityClassId: "ec-dev-a", amount: 1500, committedCapital: null, holderRole: "Member" },
  { id: "hold-d-3b", entityId: "e-dev-llc", holderId: "h-peterson", equityClassId: "ec-dev-b", amount: 1000, committedCapital: null, holderRole: "Member" },
  { id: "hold-d-3c", entityId: "e-dev-llc", holderId: "h-peterson", equityClassId: "ec-dev-vote", amount: 15.0, committedCapital: null, holderRole: "Member" },

  { id: "hold-d-4a", entityId: "e-dev-llc", holderId: "h-sierra-vista", equityClassId: "ec-dev-a", amount: 1000, committedCapital: null, holderRole: "Member" },
  { id: "hold-d-4b", entityId: "e-dev-llc", holderId: "h-sierra-vista", equityClassId: "ec-dev-b", amount: 500, committedCapital: null, holderRole: "Member" },
  { id: "hold-d-4c", entityId: "e-dev-llc", holderId: "h-sierra-vista", equityClassId: "ec-dev-vote", amount: 10.0, committedCapital: null, holderRole: "Member" },

  { id: "hold-d-5a", entityId: "e-dev-llc", holderId: "h-coastal", equityClassId: "ec-dev-a", amount: 500, committedCapital: null, holderRole: "Member" },
  { id: "hold-d-5b", entityId: "e-dev-llc", holderId: "h-coastal", equityClassId: "ec-dev-b", amount: 500, committedCapital: null, holderRole: "Member" },
  { id: "hold-d-5c", entityId: "e-dev-llc", holderId: "h-coastal", equityClassId: "ec-dev-vote", amount: 5.0, committedCapital: null, holderRole: "Member" },

  // ── C3 Financial Holdings, Inc. ──
  { id: "hold-c3-1a", entityId: "e-c3-holdings", holderId: "h-abp-capital", equityClassId: "ec-c3-common", amount: 600000, committedCapital: null, holderRole: "Majority shareholder" },
  { id: "hold-c3-1b", entityId: "e-c3-holdings", holderId: "h-abp-capital", equityClassId: "ec-c3-pref", amount: 200000, committedCapital: null, holderRole: "Majority shareholder" },
  { id: "hold-c3-1c", entityId: "e-c3-holdings", holderId: "h-abp-capital", equityClassId: "ec-c3-own", amount: 62.5, committedCapital: null, holderRole: "Majority shareholder" },

  { id: "hold-c3-2a", entityId: "e-c3-holdings", holderId: "h-bunker-trust", equityClassId: "ec-c3-common", amount: 200000, committedCapital: null, holderRole: "Shareholder" },
  { id: "hold-c3-2b", entityId: "e-c3-holdings", holderId: "h-bunker-trust", equityClassId: "ec-c3-pref", amount: null, committedCapital: null, holderRole: "Shareholder" },
  { id: "hold-c3-2c", entityId: "e-c3-holdings", holderId: "h-bunker-trust", equityClassId: "ec-c3-own", amount: 15.63, committedCapital: null, holderRole: "Shareholder" },

  { id: "hold-c3-3a", entityId: "e-c3-holdings", holderId: "h-peterson", equityClassId: "ec-c3-common", amount: 150000, committedCapital: null, holderRole: "Shareholder" },
  { id: "hold-c3-3b", entityId: "e-c3-holdings", holderId: "h-peterson", equityClassId: "ec-c3-pref", amount: 50000, committedCapital: null, holderRole: "Shareholder" },
  { id: "hold-c3-3c", entityId: "e-c3-holdings", holderId: "h-peterson", equityClassId: "ec-c3-own", amount: 15.63, committedCapital: null, holderRole: "Shareholder" },

  { id: "hold-c3-4a", entityId: "e-c3-holdings", holderId: "h-mgmt-plan", equityClassId: "ec-c3-common", amount: 80000, committedCapital: null, holderRole: "ESOP" },
  { id: "hold-c3-4b", entityId: "e-c3-holdings", holderId: "h-mgmt-plan", equityClassId: "ec-c3-pref", amount: null, committedCapital: null, holderRole: "ESOP" },
  { id: "hold-c3-4c", entityId: "e-c3-holdings", holderId: "h-mgmt-plan", equityClassId: "ec-c3-own", amount: 6.25, committedCapital: null, holderRole: "ESOP" },

  // ── ABP Opportunity Fund II, LP ──
  { id: "hold-o2-1", entityId: "e-opp-ii", holderId: "h-abp-opp-gp", equityClassId: "ec-o2-gp", amount: 1.5, committedCapital: 225000, holderRole: "General partner" },
  { id: "hold-o2-1b", entityId: "e-opp-ii", holderId: "h-abp-opp-gp", equityClassId: "ec-o2-lp", amount: null, committedCapital: null, holderRole: "General partner" },

  { id: "hold-o2-2", entityId: "e-opp-ii", holderId: "h-bunker-trust", equityClassId: "ec-o2-lp", amount: 22.0, committedCapital: 3300000, holderRole: "Limited partner" },
  { id: "hold-o2-2b", entityId: "e-opp-ii", holderId: "h-bunker-trust", equityClassId: "ec-o2-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  { id: "hold-o2-3", entityId: "e-opp-ii", holderId: "h-pacific-rim", equityClassId: "ec-o2-lp", amount: 18.0, committedCapital: 2700000, holderRole: "Limited partner" },
  { id: "hold-o2-3b", entityId: "e-opp-ii", holderId: "h-pacific-rim", equityClassId: "ec-o2-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  { id: "hold-o2-4", entityId: "e-opp-ii", holderId: "h-davis-trust", equityClassId: "ec-o2-lp", amount: 14.5, committedCapital: 2175000, holderRole: "Limited partner" },
  { id: "hold-o2-4b", entityId: "e-opp-ii", holderId: "h-davis-trust", equityClassId: "ec-o2-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  { id: "hold-o2-5", entityId: "e-opp-ii", holderId: "h-landmark", equityClassId: "ec-o2-lp", amount: 12.0, committedCapital: 1800000, holderRole: "Limited partner" },
  { id: "hold-o2-5b", entityId: "e-opp-ii", holderId: "h-landmark", equityClassId: "ec-o2-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  { id: "hold-o2-6", entityId: "e-opp-ii", holderId: "h-greenfield", equityClassId: "ec-o2-lp", amount: 10.0, committedCapital: 1500000, holderRole: "Limited partner" },
  { id: "hold-o2-6b", entityId: "e-opp-ii", holderId: "h-greenfield", equityClassId: "ec-o2-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  { id: "hold-o2-7", entityId: "e-opp-ii", holderId: "h-apex", equityClassId: "ec-o2-lp", amount: 8.0, committedCapital: 1200000, holderRole: "Limited partner" },
  { id: "hold-o2-7b", entityId: "e-opp-ii", holderId: "h-apex", equityClassId: "ec-o2-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  { id: "hold-o2-8", entityId: "e-opp-ii", holderId: "h-redwood", equityClassId: "ec-o2-lp", amount: 7.0, committedCapital: 1050000, holderRole: "Limited partner" },
  { id: "hold-o2-8b", entityId: "e-opp-ii", holderId: "h-redwood", equityClassId: "ec-o2-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },

  { id: "hold-o2-9", entityId: "e-opp-ii", holderId: "h-thompson-trust", equityClassId: "ec-o2-lp", amount: 7.0, committedCapital: 1050000, holderRole: "Limited partner" },
  { id: "hold-o2-9b", entityId: "e-opp-ii", holderId: "h-thompson-trust", equityClassId: "ec-o2-gp", amount: null, committedCapital: null, holderRole: "Limited partner" },
];
