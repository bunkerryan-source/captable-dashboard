# ABP Cap Table Dashboard — Product Specification

**Version:** 1.1
**Date:** April 14, 2026
**Author:** Ryan Bunker
**Status:** Ready for implementation

---

## I. Overview

### A. Purpose

ABP Capital manages approximately 20–30 legal entities with diverse ownership structures. Equity holders frequently execute gifts, sales, redemptions, new issuances, and estate transfers. Tracking these changes across entities via spreadsheets has proven unreliable and error-prone. The **ABP Cap Table Dashboard** replaces that workflow with a single web application that serves as the authoritative cap table for every ABP entity, with a complete audit trail for every change.

### B. Core Principles

1. **Every change creates a log entry.** No cap table modification — including typo corrections — bypasses the **Record Transaction** flow. The change log is the audit trail.
2. **Equity classes are configurable per entity.** The system does not assume a fixed column structure. Each entity defines its own equity classes at setup and can modify them later without recreating the entity.
3. **Percentages auto-compute.** The system calculates totals from individual holdings. Users enter holder-level values; the totals row is derived.
4. **Historical snapshots are reconstructable.** The system can render the cap table as it existed on any date for which a log entry exists.

### C. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) |
| Hosting | Vercel |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Styling | Tailwind CSS |

---

## II. Data Model

### A. Core Tables

#### 1. `entities`

The central registry of ABP legal entities.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `name` | text, not null | e.g., "ABP Real Estate Fund III, LP" |
| `entity_type` | enum | `llc`, `lp`, `corporation`, `trust`, `other` |
| `equity_model` | enum | `percentage`, `shares` |
| `state_of_formation` | text | e.g., "Delaware" |
| `date_of_formation` | date | |
| `show_committed_capital` | boolean, default false | Toggles the **Committed Capital** column |
| `notes` | text | Freeform internal notes |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `created_by` | uuid, FK → users | |

#### 2. `equity_classes`

Defines the columns that appear in an entity's cap table. Fully user-configurable per entity.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `entity_id` | uuid, FK → entities | |
| `name` | text, not null | e.g., "Class A Interest", "Common Stock", "Preferred Stock" |
| `display_order` | integer | Controls left-to-right column order |
| `unit_type` | enum | `percentage`, `shares`, `units`, `dollars` |
| `is_active` | boolean, default true | Soft-delete for retired classes |
| `created_at` | timestamptz | |

**Examples of valid configurations:**

- LLC with flat ownership: one class named "Membership Interest" with `unit_type: percentage`
- LLC with tiered interests: "Class A Interest" (`percentage`) + "Class B Interest" (`percentage`)
- Corporation: "Common Stock" (`shares`) + "Series A Preferred" (`shares`)
- LP: "LP Interest" (`percentage`) + "GP Interest" (`percentage`)

#### 3. `holders`

The registry of all equity holders across all entities. A single holder (e.g., "Bunker Family Trust") can appear in multiple entities.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `name` | text, not null | e.g., "Bunker Family Trust" |
| `holder_type` | enum | `individual`, `trust`, `llc`, `lp`, `corporation`, `estate`, `esop`, `other` |
| `tax_id_last_four` | text | Last 4 of EIN/SSN for identification only |
| `contact_email` | text | |
| `notes` | text | |
| `created_at` | timestamptz | |

#### 4. `holdings`

The current state of who holds what in each entity. This is the table that renders the cap table grid.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `entity_id` | uuid, FK → entities | |
| `holder_id` | uuid, FK → holders | |
| `equity_class_id` | uuid, FK → equity_classes | |
| `amount` | numeric(20,6) | Percentage (e.g., 18.5), share count, or dollar amount depending on `equity_class.unit_type` |
| `committed_capital` | numeric(20,2), nullable | Dollar amount; displayed only when `entity.show_committed_capital = true` |
| `holder_role` | text | Freeform: "General partner", "Managing member", "Limited partner", "Shareholder", etc. |
| `updated_at` | timestamptz | |

**Unique constraint:** (`entity_id`, `holder_id`, `equity_class_id`) — one row per holder per class per entity.

#### 5. `transactions`

The **Change Log**. Every modification to the cap table produces exactly one transaction record.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `entity_id` | uuid, FK → entities | |
| `transaction_type` | enum | `gift`, `sale`, `redemption`, `issuance`, `estate_transfer`, `correction`, `class_change`, `holder_update` |
| `effective_date` | date, not null | The date the change took effect (not necessarily today) |
| `description` | text, not null | User-written narrative of what happened and why |
| `metadata` | jsonb | Structured data specific to the transaction type (see Section II.B) |
| `created_at` | timestamptz | When the record was entered |
| `created_by` | uuid, FK → users | Who entered the record |

#### 6. `transaction_attachments`

Documents uploaded to support a transaction.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `transaction_id` | uuid, FK → transactions | |
| `file_name` | text | Original file name |
| `file_path` | text | Supabase Storage path |
| `file_size` | integer | Bytes |
| `mime_type` | text | |
| `uploaded_at` | timestamptz | |
| `uploaded_by` | uuid, FK → users | |

#### 7. `holdings_snapshots`

Point-in-time copies of the `holdings` table, created automatically each time a transaction is recorded.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `transaction_id` | uuid, FK → transactions | The transaction that triggered this snapshot |
| `entity_id` | uuid, FK → entities | |
| `snapshot_date` | date | Same as `transactions.effective_date` |
| `holdings_data` | jsonb | Full serialization of the entity's holdings at this point in time |
| `equity_classes_data` | jsonb | Serialization of the entity's equity class configuration at this point |
| `created_at` | timestamptz | |

**Note:** Storing the full state as JSONB (rather than reconstructing from transaction deltas) makes historical exports fast and reliable without complex replay logic.

#### 8. `users`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | Matches Supabase Auth user ID |
| `email` | text, not null | |
| `display_name` | text | |
| `role` | enum | `admin`, `editor` — both can edit; distinction reserved for future permission granularity |
| `created_at` | timestamptz | |

### B. Transaction Metadata Schema

The `transactions.metadata` JSONB field stores structured data that varies by transaction type. This enables type-specific display in the change log and future reporting.

```jsonc
// Gift
{
  "from_holder_id": "uuid",
  "to_holder_id": "uuid",
  "equity_class_id": "uuid",
  "amount_transferred": 5.00
}

// Sale
{
  "from_holder_id": "uuid",
  "to_holder_id": "uuid",
  "equity_class_id": "uuid",
  "amount_transferred": 4.50,
  "purchase_price": 1125000.00
}

// Redemption
{
  "holder_id": "uuid",
  "equity_class_id": "uuid",
  "amount_redeemed": 3.00,
  "redemption_price": 780000.00,
  "reallocation_method": "pro_rata" // or "retire" or "custom"
}

// New Issuance
{
  "holder_id": "uuid",
  "equity_class_id": "uuid",
  "amount_issued": 8.00,
  "capital_contribution": 2000000.00,
  "dilution_method": "pro_rata" // or "specific" or "from_authorized"
}

// Estate Transfer
{
  "from_holder_id": "uuid",
  "to_holder_id": "uuid",
  "equity_class_id": "uuid",
  "amount_transferred": 25.00,
  "legal_basis": "probate_order" // or "trust_succession", "beneficiary_designation", "court_order", "other"
}

// Correction (typo fix, data cleanup)
{
  "field_changed": "holder_name", // or "amount", "holder_role", etc.
  "old_value": "Sulivan Irrevocable Trust",
  "new_value": "Sullivan Irrevocable Trust"
}

// Class Change (equity class added, renamed, or retired)
{
  "action": "add", // or "rename", "retire", "reorder"
  "equity_class_id": "uuid",
  "old_name": null,
  "new_name": "Series B Preferred"
}
```

---

## III. User Interface

### A. Page Structure

The application has one primary page: the **Dashboard**. It consists of:

1. **Top Bar** — Entity selector and action buttons
2. **Metadata Row** — Entity type, equity model, last updated, holder count
3. **Cap Table Grid** — The core data table
4. **Footer Bar** — Change log link and export controls
5. **Change Log Panel** — Right-side slide-in panel

Secondary pages/modals:

- **Record Transaction Modal** — The single entry point for all cap table changes
- **Add Holder Modal** — Quick-add a new holder to the global registry
- **Entity Setup Modal** — Create or configure an entity (name, type, equity classes)
- **Entity Settings** — Modify equity classes, toggle committed capital, edit entity metadata

### B. Dashboard — Top Bar

| Element | Behavior |
|---|---|
| **Entity Selector** | Dropdown showing all entities alphabetically. Selecting an entity loads its cap table, metadata, and change log. Persists selection in URL query param (`?entity=uuid`) so the link is shareable. |
| **Record Transaction** button | Opens the **Record Transaction Modal** pre-scoped to the selected entity. Primary action; styled prominently. |
| **Add Holder** button | Opens the **Add Holder Modal**. Secondary style. |
| **Entity Settings** gear icon | Opens the **Entity Settings** panel for the selected entity. |
| **+ New Entity** button | Opens the **Entity Setup Modal**. Shown near or within the entity selector. |

### C. Dashboard — Metadata Row

A single horizontal line of key facts about the selected entity:

- Entity type (e.g., "Limited partnership")
- Equity model (e.g., "Percentage interests" or "Shares")
- Last updated date (derived from most recent transaction)
- Number of active holders

### D. Dashboard — Cap Table Grid

#### 1. Structure

| Column | Source | Notes |
|---|---|---|
| **Equity Holder** (left-pinned) | `holders.name` + `holdings.holder_role` | Name in bold, role as subtitle beneath. Column is pinned on horizontal scroll. |
| **[Equity Class 1]** | `equity_classes.name` | One column per active equity class for this entity. Header shows class name. |
| **[Equity Class 2]** | " | Dynamic number of columns. |
| **[Equity Class N]** | " | |
| **Committed Capital** (conditional) | `holdings.committed_capital` | Only visible when `entity.show_committed_capital = true`. Formatted as USD. |
| **Totals Row** (bottom) | Computed | Auto-sums each column. For percentages: sum of all holders. For shares/units: total outstanding. For committed capital: total dollars. |

#### 2. Display Rules

- Percentages display as `XX.XX%` with two decimal places.
- Share/unit counts display with comma separators (e.g., `1,030,000`).
- Dollar amounts display as `$X,XXX,XXX` with comma separators.
- Empty holdings display as `—` (em dash), not zero.
- Rows sorted alphabetically by holder name, with the general partner or managing member pinned to the top.

#### 3. No Inline Editing

Cells are **read-only**. Clicking a cell (or a row-level edit icon) opens the **Record Transaction Modal** pre-populated with that holder and equity class. This enforces the audit trail requirement.

### E. Dashboard — Footer Bar

| Element | Behavior |
|---|---|
| **Change Log** link | Opens the right-side **Change Log Panel**. Shows a badge with the total number of log entries for this entity. |
| **Export Current** button | Exports the cap table in its current state. See Section V. |
| **Export as of Date** button | Opens a date picker listing all dates on which a transaction was recorded. Selecting a date exports the historical snapshot. See Section V. |

### F. Change Log Panel

A right-side slide-in panel, 400–450px wide, overlaying the dashboard content with a dimmed backdrop.

#### 1. Panel Header

- Title: "Change log"
- Close button (×)
- Filter controls: dropdown to filter by transaction type, date range picker

#### 2. Log Entry Display

Each log entry shows:

- **Date** — `transactions.effective_date`, formatted as "Mon DD, YYYY"
- **Transaction Type Badge** — Color-coded pill: Gift (purple), Sale (teal), Redemption (amber), New Issuance (blue), Estate Transfer (pink), Correction (gray), Class Change (gray)
- **Description** — `transactions.description`, the user-written narrative
- **Entered By** — `users.display_name` and `transactions.created_at` timestamp
- **Attachments** — List of attached documents with download links
- **View Snapshot** tag — Clickable tag: "View cap table as of this date." Clicking it replaces the main grid with the historical snapshot (read-only, with a banner indicating the date and a "Return to current" button).

#### 3. Sort Order

Reverse chronological (most recent first).

### G. Record Transaction Modal

The single entry point for all cap table modifications. Required fields are enforced; the modal cannot be submitted without them.

#### 1. Header

- Title: "Record transaction"
- Entity badge showing the current entity name (read-only context)

#### 2. Transaction Type Selector

Horizontal pill buttons. Selecting a type dynamically shows/hides the relevant fields below.

**Types:** Gift, Sale, Redemption, New Issuance, Estate Transfer, Correction

#### 3. Common Fields (All Types)

| Field | Type | Required | Notes |
|---|---|---|---|
| Effective Date | date picker | Yes | Defaults to today |
| Description | textarea | Yes | Becomes the log entry narrative |
| Supporting Documents | file upload (multi) | No | Stored in Supabase Storage |

#### 4. Type-Specific Fields

**Gift:**
| Field | Type | Required |
|---|---|---|
| From Holder | dropdown (entity's holders) | Yes |
| To Holder | dropdown (entity's holders + "Add new") | Yes |
| Equity Class | dropdown (entity's classes) | Yes |
| Amount Transferred | number input | Yes |

**Sale:**
| Field | Type | Required |
|---|---|---|
| From Holder (Seller) | dropdown | Yes |
| To Holder (Buyer) | dropdown + "Add new" | Yes |
| Equity Class | dropdown | Yes |
| Amount Transferred | number input | Yes |
| Purchase Price ($) | number input | Yes |

**Redemption:**
| Field | Type | Required |
|---|---|---|
| Holder Being Redeemed | dropdown | Yes |
| Equity Class | dropdown | Yes |
| Amount Redeemed | number input | Yes |
| Redemption Price ($) | number input | Yes |
| Reallocation Method | dropdown: Pro rata / Retire / Custom | Yes |

**New Issuance:**
| Field | Type | Required |
|---|---|---|
| Holder | dropdown + "Add new" | Yes |
| Equity Class | dropdown | Yes |
| Amount Issued | number input | Yes |
| Capital Contribution ($) | number input | No |
| Dilution Method | dropdown: Pro rata / Specific holders / From authorized | Yes |

**Estate Transfer:**
| Field | Type | Required |
|---|---|---|
| From (Decedent/Estate) | dropdown | Yes |
| To (Beneficiary/Successor) | dropdown + "Add new" | Yes |
| Equity Class | dropdown | Yes |
| Amount Transferred | number input | Yes |
| Legal Basis | dropdown: Probate order / Trust succession / Beneficiary designation / Court order / Other | Yes |

**Correction:**
| Field | Type | Required |
|---|---|---|
| What Changed | dropdown: Holder name / Holder role / Amount / Other | Yes |
| Holder Affected | dropdown | Yes |
| Equity Class (if applicable) | dropdown | Conditional |
| Old Value | text (auto-populated) | Yes |
| New Value | text | Yes |

#### 5. Submission Behavior

On submit:

1. Validate all required fields.
2. Create a `transactions` record.
3. Upload any attachments to Supabase Storage; create `transaction_attachments` records.
4. Apply the changes to the `holdings` table (insert, update, or delete rows as needed).
5. Snapshot the entity's full holdings state into `holdings_snapshots`.
6. Refresh the dashboard grid and change log.

#### 6. Footer Buttons

- **Cancel** — Closes modal without saving.
- **Save as Draft** — Saves the transaction record with a `draft` status flag. Does not modify holdings or create a snapshot. Draft transactions appear in the change log with a "Draft" badge and can be finalized later.
- **Record Transaction** — Commits the change. Primary action button.

### H. Entity Setup Modal

Used when creating a new entity or accessed via Entity Settings.

#### 1. Fields

| Field | Type | Required |
|---|---|---|
| Entity Name | text | Yes |
| Entity Type | dropdown: LLC, LP, Corporation, Trust, Other | Yes |
| Equity Model | dropdown: Percentage, Shares | Yes |
| State of Formation | text | No |
| Date of Formation | date | No |
| Show Committed Capital | toggle | No (default off) |
| Notes | textarea | No |

#### 2. Equity Class Configuration

Below the entity fields, a dynamic list for defining equity classes:

- Each row: **Class Name** (text input) + **Unit Type** (dropdown: Percentage / Shares / Units / Dollars) + **Delete** button
- **+ Add Equity Class** button appends a new row
- Drag handles for reordering (sets `display_order`)
- Minimum one equity class required

**When editing an existing entity:** Renaming a class updates the class name everywhere. Deleting a class is only allowed if no holdings reference it (soft-delete via `is_active = false` if holdings exist, with a warning). Adding a new class is always allowed and creates a log entry of type `class_change`.

### I. Add Holder Modal

A simple form for adding a new holder to the global registry.

| Field | Type | Required |
|---|---|---|
| Holder Name | text | Yes |
| Holder Type | dropdown: Individual, Trust, LLC, LP, Corporation, Estate, ESOP, Other | Yes |
| Last 4 of Tax ID | text (4 chars) | No |
| Contact Email | email | No |
| Notes | textarea | No |

The new holder becomes immediately available in all entity dropdowns. Adding a holder does not itself modify any cap table — a transaction is still required to assign holdings.

---

## IV. Authentication and Access Control

### A. Auth Flow

- Supabase Auth with email/password or magic link.
- No self-registration. Admin (Ryan) creates user accounts manually via Supabase dashboard or an admin panel.

### B. Roles

| Role | Permissions |
|---|---|
| **Admin** | Full access. Can create/edit entities, holders, transactions. Can create user accounts. Can delete draft transactions. |
| **Editor** | Full access to create/edit entities, holders, and transactions. Cannot manage user accounts. Cannot delete finalized transactions. |

Both roles can edit all data. The key constraint is not who can edit but that **every edit is logged** with the user's identity and a description.

### C. Row-Level Security

Supabase RLS policies:

- All authenticated users can read all entities, holders, holdings, transactions, and attachments.
- All authenticated users can insert transactions, holdings changes, and attachments.
- Only admins can delete records (and only drafts).
- No anonymous access.

---

## V. Export

### A. Current State Export

Exports the cap table as it appears on screen for the selected entity.

**Format:** XLSX workbook with:
- **Sheet 1 ("Cap Table"):** Mirrors the grid. Entity name and export date in a header row. Holder names in column A, equity classes in subsequent columns, totals row at bottom.
- **Sheet 2 ("Entity Info"):** Entity name, type, equity model, state and date of formation, notes.

**Trigger:** "Export current" button in the footer bar.

### B. Historical Snapshot Export

Exports the cap table as it existed on a specific date.

**Flow:**
1. User clicks "Export as of date."
2. A dropdown or date-picker appears listing all dates for which a `holdings_snapshot` exists (derived from transaction effective dates).
3. User selects a date.
4. System retrieves the `holdings_snapshots.holdings_data` and `equity_classes_data` for that date.
5. Exports an XLSX identical in format to the current-state export, with the date clearly labeled in the header.

### C. Future Consideration — PDF Export

Not in MVP. Flag for a later phase: PDF export with ABP letterhead for use in investor communications or closing binders.

---

## VI. Implementation Plan

### A. Phase 1 — Foundation (MVP)

1. Supabase project setup: database schema, RLS policies, storage bucket.
2. Next.js project scaffolding with Tailwind CSS.
3. Auth flow (login page, session management, protected routes).
4. Entity CRUD (setup modal, settings panel, entity selector).
5. Equity class configuration (dynamic per-entity setup).
6. Holder CRUD (add holder modal, global holder registry).
7. Cap table grid (dynamic columns, auto-computed totals, read-only cells).
8. Record Transaction modal (all six types with validation and holdings updates).
9. Change log panel (slide-in, filterable, with "entered by" attribution).
10. Snapshot creation on every transaction commit.
11. Historical Setup Mode (streamlined sequential entry, chronological date validation, batch description templates, skip-attachments toggle).
12. Retroactive document attachment on existing log entries.
13. Vercel deployment.

### B. Phase 2 — Export and Polish

1. XLSX export (current state).
2. Historical snapshot viewer (render past cap table in read-only mode).
3. Historical snapshot export (XLSX as of date).
4. Draft transaction support.
5. Document upload and attachment viewing.
6. Entity selector search/filter for quick navigation.

### C. Phase 3 — Enhancements

1. Dashboard home page: summary view across all entities (e.g., "Bunker Family Trust holds interests in 14 entities").
2. Holder detail page: view all entities and holdings for a single holder.
3. PDF export with ABP letterhead.
4. Bulk CSV import tool (upload a spreadsheet to seed an entity's initial holdings as an alternative to manual entry via Historical Setup Mode).
5. Activity feed: cross-entity view of recent transactions.
6. Email notifications on transaction recording (optional).

---

## VII. Design Direction

### A. Aesthetic

Clean, utilitarian, professional. This is an internal tool for a legal/finance team — not a consumer product. Prioritize clarity, information density, and speed of use over visual flair.

- **Typography:** System font stack or a clean sans-serif (e.g., Geist). Monospaced numbers in the grid for alignment.
- **Color palette:** Neutral grays for structure. Purple as the primary accent (consistent with ABP branding). Semantic colors for transaction type badges only.
- **Layout:** Single-page dashboard. No unnecessary navigation. Entity selector is the primary navigation mechanism.
- **Tables:** Compact rows, clear column headers, alternating row backgrounds for scanability. Pinned first column on horizontal scroll.
- **Dark mode:** Not required for MVP. Light theme only.

### B. Responsive Behavior

Desktop-first. The primary use case is a desktop browser. Tablet should be functional but not optimized. Mobile is not a priority — a simplified read-only view is acceptable.

---

## VIII. Confirmed Design Decisions

1. **Dilution mechanics:** When a new issuance dilutes existing holders pro rata, the system auto-calculates each holder's new percentage and presents a before/after confirmation step. The user reviews the computed dilution and confirms before the transaction is committed.
2. **Holder deduplication:** The Add Holder modal includes fuzzy-match search against existing holders to prevent duplicates at entry time. An admin merge capability (consolidating two holder records into one, with full transaction history preserved) is scoped for Phase 3.
3. **Concurrent editing:** Optimistic locking via a version counter on the `holdings` table. If a second editor attempts to commit a transaction after the holdings have changed since their form was loaded, the system rejects the commit with a warning ("The cap table has been updated since you opened this form. Please refresh and re-enter your transaction.").
4. **Audit immutability:** Finalized transactions are immutable. They cannot be edited or deleted. If a transaction was recorded in error, the correct workflow is to record a new "Correction" transaction that reverses it, preserving the complete audit trail. Only draft transactions may be deleted, and only by an admin.

---

## IX. Historical Entity Onboarding

### A. The Problem

Most ABP entities have existed for years — some as long as 12 years. When setting up an entity in the dashboard for the first time, the user needs to reconstruct the full ownership history from inception to present day so the change log reflects reality and historical snapshots are available for any past date.

### B. Workflow

The recommended onboarding workflow for each entity:

1. **Create the entity** via the Entity Setup Modal. Set the Date of Formation to the actual formation date (e.g., June 15, 2014). Configure equity classes as they existed at inception.
2. **Record the initial issuance.** Open the Record Transaction modal, select "New Issuance," set the effective date to the formation date, and enter each founding holder's initial interest. Attach the executed operating agreement, LPA, or articles of incorporation if available. This becomes the first log entry and first snapshot.
3. **Work forward chronologically.** Record each subsequent ownership change (gift, sale, redemption, new issuance, estate transfer, class change) with its actual effective date and a description of what happened. Attach supporting documents where available.
4. **Verify the final state.** After entering all historical transactions, confirm that the current cap table matches the entity's actual current ownership. If it does not, record a "Correction" transaction to reconcile.

### C. Chronological Entry Requirement

During historical onboarding, transactions **must be entered in chronological order** (oldest to newest). This is required because each transaction commit creates a holdings snapshot that captures the cumulative state of the cap table after that change. Entering transactions out of order would produce incorrect snapshots.

**Enforcement:** The Record Transaction modal validates that the effective date is equal to or later than the most recent transaction's effective date for that entity. If the user enters an earlier date, the system displays a warning: "This date is earlier than the most recent transaction ([date]). Historical transactions must be entered in chronological order to ensure accurate snapshots. Please enter earlier transactions first."

**Exception for post-onboarding use:** Once an entity is fully onboarded and in active use, backdating is unlikely. If a legitimate need arises later (e.g., discovering a transfer that was never recorded), the user can record a "Correction" type transaction with today's effective date and describe the historical event in the description field.

### D. Historical Setup Mode

To streamline bulk data entry during onboarding, the dashboard includes a **Historical Setup Mode** accessible from the Entity Settings panel. When enabled for an entity:

1. **Streamlined transaction entry.** After recording a transaction, the modal does not close. Instead it clears the fields (preserving the entity and incrementing the effective date to the next day as a starting point) so the user can immediately enter the next transaction. A "Done — exit setup mode" button closes the modal.
2. **Progress indicator.** A banner at the top of the dashboard shows "Historical setup in progress — [X] transactions recorded" with a timeline visualization showing the date range covered (formation date to most recent entry).
3. **Batch description templates.** For common transaction types, the description field pre-populates with a template: "Initial issuance at formation per [Operating Agreement / LPA / Articles] dated [date]" or "Transfer of [amount] [class] from [holder] to [holder] per [document type] dated [date]." The user edits as needed.
4. **Skip attachments option.** A toggle labeled "I'll attach documents later" suppresses the file upload section to speed up entry. The user can return to any transaction in the change log and attach documents afterward.

### E. Attaching Documents After the Fact

Any change log entry can have documents attached retroactively. In the Change Log Panel, each entry includes an "Attach document" link that opens a file upload dialog. This is especially useful during historical onboarding when the user may want to enter all transactions first and then go back and attach supporting documents in a separate pass.

### F. Snapshot Integrity

Each transaction commit generates a snapshot of the entity's full holdings state at that point in time. For historical onboarding, this means:

- The first transaction (initial issuance) produces a snapshot showing the founding ownership.
- Each subsequent transaction produces a snapshot reflecting all changes up to and including that transaction.
- The final transaction produces a snapshot that matches the entity's current actual ownership.

If the user discovers an error in a past entry after onboarding is complete, the correct workflow is to record a new "Correction" transaction (with today's date) that adjusts the holdings to the correct values. The correction transaction's snapshot captures the corrected state. Prior snapshots remain untouched to preserve the audit trail as entered.
