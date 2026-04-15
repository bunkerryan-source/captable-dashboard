import type { TransactionWithAttachments } from "./types";

export const mockTransactions: TransactionWithAttachments[] = [
  // ── ABP Real Estate Fund III, LP ──
  {
    id: "tx-f3-1", entityId: "e-fund-iii", transactionType: "gift",
    effectiveDate: "2026-03-28",
    description: "Sullivan Irrevocable Trust transferred 5.00% LP interest to Martinez Living Trust as part of estate planning restructuring.",
    metadata: { from_holder_id: "h-sullivan-trust", to_holder_id: "h-martinez-trust", equity_class_id: "ec-f3-lp", amount_transferred: 5.0 },
    createdAt: "2026-03-28T14:22:00Z", createdBy: "Ryan Bunker",
    attachments: [{ id: "att-1", transactionId: "tx-f3-1", fileName: "Gift_Letter_Sullivan_2026-03-28.pdf", filePath: "/docs/gift-letter.pdf", fileSize: 245000, mimeType: "application/pdf" }],
  },
  {
    id: "tx-f3-2", entityId: "e-fund-iii", transactionType: "issuance",
    effectiveDate: "2026-02-15",
    description: "Nakamura Family Office admitted as new LP with $2,000,000 capital commitment (8.00% LP interest). Existing interests diluted proportionally.",
    metadata: { holder_id: "h-nakamura", equity_class_id: "ec-f3-lp", amount_issued: 8.0, capital_contribution: 2000000, dilution_method: "pro_rata" },
    createdAt: "2026-02-15T10:30:00Z", createdBy: "Ryan Bunker",
    attachments: [{ id: "att-2", transactionId: "tx-f3-2", fileName: "Subscription_Agreement_Nakamura.pdf", filePath: "/docs/sub-nakamura.pdf", fileSize: 512000, mimeType: "application/pdf" }],
  },
  {
    id: "tx-f3-3", entityId: "e-fund-iii", transactionType: "sale",
    effectiveDate: "2026-01-10",
    description: "Whitfield Capital purchased 4.50% LP interest from Peterson Holdings at $1,125,000 (arm\u2019s length). ROFR waived by GP.",
    metadata: { from_holder_id: "h-peterson", to_holder_id: "h-whitfield", equity_class_id: "ec-f3-lp", amount_transferred: 4.5, purchase_price: 1125000 },
    createdAt: "2026-01-10T09:15:00Z", createdBy: "Ryan Bunker",
    attachments: [{ id: "att-3", transactionId: "tx-f3-3", fileName: "Transfer_Agreement_Whitfield_Peterson.pdf", filePath: "/docs/transfer.pdf", fileSize: 380000, mimeType: "application/pdf" }],
  },
  {
    id: "tx-f3-4", entityId: "e-fund-iii", transactionType: "redemption",
    effectiveDate: "2025-11-05",
    description: "Partial redemption of 3.00% LP interest held by Chen Investment Partners. Redemption price: $780,000.",
    metadata: { holder_id: "h-chen", equity_class_id: "ec-f3-lp", amount_redeemed: 3.0, redemption_price: 780000, reallocation_method: "pro_rata" },
    createdAt: "2025-11-05T16:00:00Z", createdBy: "Ryan Bunker",
    attachments: [],
  },
  {
    id: "tx-f3-5", entityId: "e-fund-iii", transactionType: "estate_transfer",
    effectiveDate: "2025-09-20",
    description: "Estate of Robert Sullivan transferred 25.00% LP interest to Sullivan Irrevocable Trust per probate order.",
    metadata: { from_holder_id: "h-sullivan-trust", to_holder_id: "h-sullivan-trust", equity_class_id: "ec-f3-lp", amount_transferred: 25.0, legal_basis: "probate_order" },
    createdAt: "2025-09-20T11:00:00Z", createdBy: "Ryan Bunker",
    attachments: [{ id: "att-5", transactionId: "tx-f3-5", fileName: "Probate_Order_Sullivan.pdf", filePath: "/docs/probate.pdf", fileSize: 620000, mimeType: "application/pdf" }],
  },
  {
    id: "tx-f3-6", entityId: "e-fund-iii", transactionType: "issuance",
    effectiveDate: "2025-06-01",
    description: "Initial closing. Fund formed with 5 founding LPs and GP.",
    metadata: {},
    createdAt: "2025-06-01T08:00:00Z", createdBy: "Ryan Bunker",
    attachments: [{ id: "att-6", transactionId: "tx-f3-6", fileName: "LPA_Executed_2025-06-01.pdf", filePath: "/docs/lpa.pdf", fileSize: 1200000, mimeType: "application/pdf" }],
  },

  // ── ABP Development Holdings, LLC ──
  {
    id: "tx-d-1", entityId: "e-dev-llc", transactionType: "sale",
    effectiveDate: "2026-04-02",
    description: "Coastal Ventures acquired 500 Class A units and 500 Class B units from Sierra Vista at $425,000.",
    metadata: { from_holder_id: "h-sierra-vista", to_holder_id: "h-coastal", equity_class_id: "ec-dev-a", amount_transferred: 500, purchase_price: 425000 },
    createdAt: "2026-04-02T13:45:00Z", createdBy: "Ryan Bunker",
    attachments: [{ id: "att-d1", transactionId: "tx-d-1", fileName: "Unit_Purchase_Agreement_Coastal.pdf", filePath: "/docs/upa-coastal.pdf", fileSize: 310000, mimeType: "application/pdf" }],
  },
  {
    id: "tx-d-2", entityId: "e-dev-llc", transactionType: "issuance",
    effectiveDate: "2026-01-20",
    description: "Authorized and issued additional 1,000 Class B units to Bunker Family Trust for $500,000 capital contribution.",
    metadata: { holder_id: "h-bunker-trust", equity_class_id: "ec-dev-b", amount_issued: 1000, capital_contribution: 500000 },
    createdAt: "2026-01-20T10:00:00Z", createdBy: "Ryan Bunker",
    attachments: [],
  },
  {
    id: "tx-d-3", entityId: "e-dev-llc", transactionType: "issuance",
    effectiveDate: "2025-08-15",
    description: "Entity formed. Initial unit issuance to founding members.",
    metadata: {},
    createdAt: "2025-08-15T08:00:00Z", createdBy: "Ryan Bunker",
    attachments: [{ id: "att-d3", transactionId: "tx-d-3", fileName: "OA_Executed_2025-08-15.pdf", filePath: "/docs/oa.pdf", fileSize: 890000, mimeType: "application/pdf" }],
  },

  // ── C3 Financial Holdings, Inc. ──
  {
    id: "tx-c3-1", entityId: "e-c3-holdings", transactionType: "issuance",
    effectiveDate: "2026-03-10",
    description: "Board authorized issuance of 30,000 shares to Management Stock Plan under 2026 equity incentive plan.",
    metadata: { holder_id: "h-mgmt-plan", equity_class_id: "ec-c3-common", amount_issued: 30000 },
    createdAt: "2026-03-10T15:30:00Z", createdBy: "Ryan Bunker",
    attachments: [{ id: "att-c1", transactionId: "tx-c3-1", fileName: "Board_Resolution_ESOP_2026.pdf", filePath: "/docs/board-res.pdf", fileSize: 180000, mimeType: "application/pdf" }],
  },
  {
    id: "tx-c3-2", entityId: "e-c3-holdings", transactionType: "issuance",
    effectiveDate: "2025-10-01",
    description: "Preferred A shares issued to ABP Capital and Peterson Holdings in Series A financing round.",
    metadata: {},
    createdAt: "2025-10-01T09:00:00Z", createdBy: "Ryan Bunker",
    attachments: [],
  },

  // ── ABP Opportunity Fund II, LP ──
  {
    id: "tx-o2-1", entityId: "e-opp-ii", transactionType: "gift",
    effectiveDate: "2026-02-28",
    description: "Greenfield Family LP gifted 2.00% LP interest to Davis Charitable Trust.",
    metadata: { from_holder_id: "h-greenfield", to_holder_id: "h-davis-trust", equity_class_id: "ec-o2-lp", amount_transferred: 2.0 },
    createdAt: "2026-02-28T11:00:00Z", createdBy: "Ryan Bunker",
    attachments: [{ id: "att-o1", transactionId: "tx-o2-1", fileName: "Gift_Deed_Greenfield_Davis.pdf", filePath: "/docs/gift-deed.pdf", fileSize: 195000, mimeType: "application/pdf" }],
  },
  {
    id: "tx-o2-2", entityId: "e-opp-ii", transactionType: "estate_transfer",
    effectiveDate: "2025-12-10",
    description: "Thompson estate transferred interest to Thompson Living Trust per trust succession documents.",
    metadata: { from_holder_id: "h-thompson-trust", to_holder_id: "h-thompson-trust", equity_class_id: "ec-o2-lp", amount_transferred: 7.0, legal_basis: "trust_succession" },
    createdAt: "2025-12-10T14:00:00Z", createdBy: "Ryan Bunker",
    attachments: [{ id: "att-o2", transactionId: "tx-o2-2", fileName: "Trust_Succession_Thompson.pdf", filePath: "/docs/trust-succ.pdf", fileSize: 430000, mimeType: "application/pdf" }],
  },
  {
    id: "tx-o2-3", entityId: "e-opp-ii", transactionType: "issuance",
    effectiveDate: "2025-07-15",
    description: "Fund II initial closing with 8 LPs and GP.",
    metadata: {},
    createdAt: "2025-07-15T08:00:00Z", createdBy: "Ryan Bunker",
    attachments: [{ id: "att-o3", transactionId: "tx-o2-3", fileName: "LPA_Fund_II_Executed.pdf", filePath: "/docs/lpa-ii.pdf", fileSize: 1100000, mimeType: "application/pdf" }],
  },
];
