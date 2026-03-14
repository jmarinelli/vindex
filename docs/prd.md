# Verifier-First MVP — Product Requirements Document
## VinDex — Vehicle Identity & Secondary Market Trust Layer

*Internal Founder Document — Not for distribution*
*Version: 1.1*
*Derived from: work/verifiers/context.md | work/verifiers/decisions.md | one-pager.md v2.0 | 90-day-validation-plan.md v2.0*

---

## 1. Context and MVP Objective

### 1.1 Why This MVP Exists

The original MVP PRD defined a workshop-first infrastructure build. A critical review revealed a structural tension: the workshop panel was a data entry interface for the platform's benefit, not a tool that solved a workshop's immediate problem. Without a compelling day-1 reason to adopt, the workshop model depended on delayed gratification — a known failure mode for supply-side acquisition.

The verifier-first pivot reframes the entry point: start with independent vehicle inspectors, actors whose entire business IS the production of a documented, credible assessment. The tool value proposition is immediate and self-contained — a better report generator that produces professional, verifiable, white-label output. Signing and platform accumulation are side effects of using a better tool, not the primary ask.

### 1.2 What This MVP Validates

This build exists to produce the evidence required by the 90-day validation plan. Specifically:

- **H1 — Inspector Tool Value Is Real:** The report generator is perceived as a genuine improvement over existing methods.
- **H2 — Inspector Usage Persists:** Inspectors continue using the tool without prompting.
- **H3 — Verified Links Generate Buyer Engagement:** Buyers open and engage with verified report links.
- **H5 — Inspector Onboarding Is Frictionless:** First verified report within a single session, under 90 minutes.
- **H6 — Inspector-Workshop Overlap Exists:** A meaningful proportion of inspectors also operate as workshops.

H4 (Market Values Verification) is validated through observation, not product features.

### 1.3 The Architectural Commitment

The system is designed as vehicle identity infrastructure from day one. The go-to-market deploys it to inspectors first.

This means:

- The VIN is the central entity — not the inspector, not the report.
- Events are the atomic unit — inspections are one type; execution events (workshop work) are another, built later.
- Signing nodes are the trust authority — inspectors are one type; workshops are another, onboarded later.
- The vehicle page aggregates all events from all node types over the vehicle's lifecycle.

Nothing in this MVP is designed exclusively for inspections in a way that would need to be rebuilt for workshops. The architecture serves the long-term vision. The go-to-market serves the short-term reality.

### 1.4 Revenue and Monetization

Revenue = $0 in Phase 1. The tool is free. Every barrier to inspector adoption works against the primary objective: maximizing signed events.

The Phase 1 deliverable is traction metrics that make the project fundeable:

- Active inspectors (using the tool recurrently without prompting).
- Signed inspection events per month.
- Verified links appearing in marketplace listings.
- Buyer engagement with verified links (open rate, time on page).
- Inspector retention at 30/60/90 days.

No billing, subscription, or monetization infrastructure is built.

---

## 2. Users and Actors

### 2.1 Inspector (Primary — Supply Side)

The inspector is the only actor that creates content in Phase 1. They are a verified signing node on the platform.

**Profile:** Independent pre-purchase vehicle inspectors, alignment specialists, mechanics who offer inspection as a distinct service. Many also operate as workshops (repairs, maintenance, modifications) — this overlap is a strategic asset.

**What they do on the platform:**
- Define their inspection template (sections, items, order).
- Create inspections for vehicles (by VIN or plate).
- Fill structured inspection forms with observations, photos, and measurements.
- Sign completed inspections, generating verified reports.
- Share verified report links with their clients.

**What they get:**
- A professional report generator superior to their current method (Word, PDF, Google Docs).
- White-label output branded with their identity — the platform is invisible infrastructure.
- A permanent, verifiable link for each report with professional OpenGraph preview.
- An accumulated public profile (inspection count, detail level, operating since).

**Acquisition:** Phase 1 inspectors are acquired through direct hunting. There is no self-signup or application flow. Each inspector is identified, contacted, and onboarded by the founder.

### 2.2 Buyer (Secondary — Demand Side)

The buyer is the consumer of verified inspection reports. They do not create accounts or content in Phase 1.

**What they do:**
- Receive verified report links (from inspectors, sellers, or marketplace listings).
- View verified inspection reports — no authentication required.
- View vehicle pages aggregating all inspections for a VIN.
- Optionally leave post-purchase reviews on inspection reports.

**What they get:**
- Access to a verified, immutable inspection report with inspector identity and track record visible.
- Transparency about who commissioned the inspection (buyer/seller/agency).
- The ability to verify that a report has not been altered after signing.

### 2.3 Seller / Agency (Tertiary — Indirect Participants)

Sellers and agencies are not platform users in Phase 1. They participate indirectly:

- A seller may commission an inspection and share the verified link in a listing.
- An agency may incorporate verified inspections into their service package.
- The "requested by" field on the report captures their role without requiring an account.

No seller or agency features are built. The inspection flow is agnostic to who pays.

### 2.4 Platform Administrator (Internal)

The founder or team member responsible for:

- Onboarding inspectors (creating node accounts, granting signing authority).
- Monitoring platform metrics (traction dashboard).
- Managing inspector profiles and node status.

Admin functions are backend or minimal UI — not a polished admin panel.

---

## 3. System Architecture

### 3.1 Core Entities

The entity model inherits from the original infrastructure design and is scoped to the verifier-first deployment. Entities not used in Phase 1 are defined in the data model but have no UI or active flows.

#### 3.1.1 Vehicle

The central entity. All events, inspection reports, and identity data attach to the vehicle.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | Internal identifier |
| `vin` | String (17 chars) | Vehicle Identification Number — primary external identifier, unique |
| `plate` | String, nullable | License plate — optional, jurisdiction-specific |
| `make` | String, nullable | Manufacturer — decoded from VIN or manually entered |
| `model` | String, nullable | Model — decoded from VIN or manually entered |
| `year` | Integer, nullable | Model year — decoded from VIN or manually entered |
| `trim` | String, nullable | Trim level / variant (e.g., "XEI", "SEG", "Sport") — decoded from VIN or manually entered |
| `created_by_node_id` | UUID, nullable | Node that first created this vehicle record |
| `created_at` | Timestamp | Record creation time |

**Constraints:**
- VIN is unique in the system.
- A vehicle may be created by an inspector during the inspection flow (if not already in the system).
- Vehicle history persists across any future ownership changes — the ledger belongs to the VIN, not an owner.
- No owner claims in Phase 1. The vehicle is a data container, not an owned entity.

**VIN decoding:** When a VIN is entered, the system attempts to decode make, model, year, and trim automatically. If decoding fails or returns incomplete data, the inspector enters these fields manually. VIN decoding is a best-effort convenience, not a required step.

#### 3.1.2 Node

A verified entity authorized to sign inspection events. In Phase 1, all nodes are inspectors.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | Internal identifier |
| `type` | Enum | `inspector` (Phase 1). Extensible to `workshop` in Phase 2 |
| `display_name` | String | Inspector or business name |
| `logo_url` | String, nullable | Brand logo for white-label reports |
| `brand_color` | String, nullable | Primary brand color (hex) — deferred from MVP visual customization, stored for future use |
| `contact_email` | String | Business contact email |
| `contact_phone` | String, nullable | Business contact phone |
| `address` | String, nullable | Physical location |
| `bio` | Text, nullable | Short professional description |
| `status` | Enum | `active` / `suspended` |
| `verified_at` | Timestamp | Date of verification / onboarding |
| `created_at` | Timestamp | Record creation time |

**Constraints:**
- Nodes are created by the platform administrator during onboarding. No self-registration.
- Signing authority belongs to the node entity; individual users execute signing actions on the node's behalf.
- Node identity is visible on all signed inspection reports — accountability is structural.

#### 3.1.3 User

A single account representing a human in the system. In Phase 1, users are node members (inspectors) or platform administrators.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | Internal identifier |
| `email` | String | Authentication identifier, unique |
| `display_name` | String | Display name |
| `role` | Enum | `user` / `platform_admin` |
| `created_at` | Timestamp | Record creation time |

**Phase 1 scope:** No owner role. No buyer accounts. The only authenticated users are inspectors (node members) and administrators.

**Future extension:** The user entity supports adding an `owner` role flag when vehicle claims and owner dashboards are built. A user may hold multiple roles (e.g., a mechanic who is both an inspector and a vehicle owner). Node membership is managed through the `NodeMember` relationship (see 3.1.4), not through the user entity directly.

#### 3.1.4 Node Member

The relationship between users and nodes. A user may belong to multiple nodes, and a node may have multiple members. This is the N:N join entity.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | Internal identifier |
| `node_id` | UUID | The node |
| `user_id` | UUID | The user |
| `role` | Enum | `member` / `node_admin` |
| `status` | Enum | `active` / `inactive` |
| `joined_at` | Timestamp | Date the user joined the node |

**Constraints:**
- A user may belong to multiple nodes (e.g., an inspector who operates independently and also works for an agency).
- A node may have multiple members (e.g., a workshop with several mechanics).
- `role` here is the user's role within the node — `node_admin` can manage the node's profile and members; `member` can create and sign events on behalf of the node.
- In Phase 1, each inspector node has exactly one member. The N:N structure exists in the data model to avoid refactoring when multi-user nodes are needed.

**Phase 1 simplification:** No UI for managing node membership. The admin creates the node and the user, and links them via a single `NodeMember` record. Multi-user management UI is deferred.

#### 3.1.5 Inspection Template

Defines the structure an inspector uses for their reports. Each inspector has one template in Phase 1.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | Internal identifier |
| `node_id` | UUID | Owning node |
| `name` | String | Template name (e.g., "Pre-purchase Full Inspection") |
| `sections` | JSON | Ordered list of sections, each containing ordered items |
| `created_at` | Timestamp | Record creation time |
| `updated_at` | Timestamp | Last modification time |

**Section structure:**
```json
{
  "sections": [
    {
      "id": "uuid",
      "name": "Engine",
      "order": 1,
      "items": [
        {
          "id": "uuid",
          "name": "Oil level and condition",
          "order": 1,
          "type": "checklist_item"
        },
        {
          "id": "uuid",
          "name": "Coolant system",
          "order": 2,
          "type": "checklist_item"
        }
      ]
    },
    {
      "id": "uuid",
      "name": "Conclusion",
      "order": 7,
      "items": [
        {
          "id": "uuid",
          "name": "General observations and recommendation",
          "order": 1,
          "type": "free_text"
        }
      ]
    }
  ]
}
```

**Item types:**
- `checklist_item` — renders with a status selector (good / attention / critical / not evaluated), free-text observation, photo upload, and optional tags. Used for specific evaluation points (e.g., "Oil level and condition", "Brake pad wear").
- `free_text` — renders with only a text field and optional photo upload. No status selector, no tags. Used for general observations, conclusions, notes, or any content that does not fit a checklist evaluation model (e.g., "General observations and recommendation", "Pre-inspection notes").

**Constraints:**
- One template per inspector in Phase 1. Multiple templates (e.g., one for pre-purchase, another for periodic) are deferred.
- The inspector defines their own sections, item order, item names, and item types — the tool adapts to the inspector's methodology, not the reverse.
- The platform provides a starter template that the inspector can customize. The starter template serves as a professional baseline and reduces onboarding friction. The starter template includes a "Conclusion" section with a free_text item by default.
- Template changes apply to future inspections only — completed inspections retain the template structure used at the time of creation.

#### 3.1.6 Event

The atomic unit of the vehicle's ledger. Every signed record — whether an inspection, a repair, a modification, or a measurement — is an Event. In Phase 1, the only event type is `inspection`. The model is designed so that adding new event types (execution, modification, measurement) requires only a new detail table and a new enum value — no refactoring of the core event model.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | Internal identifier |
| `vehicle_id` | UUID | Vehicle this event belongs to |
| `node_id` | UUID | Signing node |
| `signed_by_user_id` | UUID | Specific user who executed the signing action |
| `event_type` | Enum | `inspection` (Phase 1). Extensible to `execution`, `modification`, `measurement`, etc. |
| `odometer_km` | Integer | Reported odometer at time of event |
| `event_date` | Date | Date of event |
| `status` | Enum | `draft` / `signed` |
| `signed_at` | Timestamp, nullable | System-set timestamp of signing |
| `slug` | String | URL-friendly unique identifier for the public page |
| `correction_of_id` | UUID, nullable | References original event if this is a correction |
| `created_at` | Timestamp | Record creation time |
| `updated_at` | Timestamp | Last modification time |

**Constraints:**
- An event is editable while in `draft` status. Once signed, it is immutable.
- `signed_at` is set by the system at the moment of signing — it cannot be set by the user.
- `signed_by_user_id` is recorded for internal audit; `node_id` is the authoritative signing identity displayed publicly.
- Corrections are new events, not mutations of existing ones. A correction references the original via `correction_of_id`.

**Why a base event table:** The vehicle page, timeline, and any cross-type query operate on the `events` table directly — one query, sorted by date, gives the complete vehicle history regardless of event type. Detail tables provide the type-specific data only when the user opens a specific event. This keeps the timeline simple while allowing each event type to have arbitrarily rich domain-specific data.

**Extensibility model:** When a new event type is needed (e.g., `execution` for workshop repairs):
1. Add the enum value to `event_type`.
2. Create a new detail table (e.g., `execution_details`) with a FK to `events.id`.
3. Build the UI for creation and display.
4. The vehicle page, timeline, signing flow, and immutability constraints work automatically — they operate on the base `events` table.

#### 3.1.7 Inspection Detail

Type-specific data for events where `event_type = inspection`. One-to-one relationship with Event.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | Internal identifier |
| `event_id` | UUID | Parent event (FK to events.id, unique) |
| `template_snapshot` | JSON | Snapshot of the template structure at inspection creation |
| `inspection_type` | Enum | `pre_purchase` / `intake` / `periodic` / `other` |
| `requested_by` | Enum | `buyer` / `seller` / `agency` / `other` |

**Constraints:**
- One `InspectionDetail` per event. The FK is unique.
- The `template_snapshot` preserves the exact template structure used, ensuring the report renders correctly even if the inspector later modifies their template.

**Future event types** will have their own detail tables with domain-specific fields. For example, a future `execution_details` table might include: execution_type (repair / maintenance / modification), description, parts replaced (structured), specs changed (before/after values with units). Each detail table has its own rich schema without polluting the base event or other event types.

#### 3.1.8 Inspection Finding

The content the inspector produces for each item in the template. Each finding is anchored to a specific slot (section + item) in the template snapshot. The template defines the structure and order of the report; findings are the content that fills each slot.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | Internal identifier |
| `event_id` | UUID | Parent event (must be an inspection event) |
| `section_id` | UUID | Reference to section in template snapshot |
| `item_id` | UUID | Reference to item in template snapshot |
| `status` | Enum, nullable | `good` / `attention` / `critical` / `not_evaluated` — null for free_text items |
| `observation` | Text, nullable | Free-text observation or content |
| `tags` | JSON, nullable | Optional normalized tags (see below) |
| `created_at` | Timestamp | Record creation time |

**How template and findings relate:**

1. The inspector defines their **template**: sections in order, each with items in order. Each item has a `type` (`checklist_item` or `free_text`).
2. When an inspection is created, the template is **snapshotted** into the event's `InspectionDetail.template_snapshot`. This freezes the structure for this inspection.
3. For **each item** in the template snapshot, a **Finding** is created. The finding's `section_id` and `item_id` link it to the corresponding slot in the snapshot.
4. The **report is rendered** by walking the template snapshot in order: Section 1 → Item 1 → render Finding for Item 1 → Item 2 → render Finding for Item 2 → etc.

The inspector controls the order and structure of the report through their template. Findings do not "float" independently — they are anchored to the template structure.

**Behavior by item type:**

- **`checklist_item`**: the finding has a `status` (good / attention / critical / not_evaluated), an `observation` (optional free text), photos, and optional tags. The report renders the status indicator, observation text, and any attached photos.
- **`free_text`**: the finding has `status = null`, an `observation` (the text content), and optional photos. No status selector is shown in the form or the report. Used for general observations, conclusions, notes.

**Status values (for checklist items):**
- `good` — item is in acceptable condition.
- `attention` — item shows wear or minor issues; not urgent but notable.
- `critical` — item requires immediate attention or repair.
- `not_evaluated` — item was not assessed in this inspection.

**Optional normalized tags (checklist items only):**
```json
{
  "vehicle_system": "brakes",
  "finding_type": "wear",
  "severity": "moderate"
}
```

Tags are optional in Phase 1. The inspector can add them if they choose. The tag taxonomy is predefined by the platform (vehicle systems, finding types, severity levels) but not enforced. This preserves the option for structured cross-inspector analytics in Phase 2 without adding friction to Phase 1 adoption.

**Risk acknowledged:** Optional tags may not get used, leaving the platform without structured data for cross-inspector metrics. This is the correct trade-off — an inspector who uses the tool without tags is better than one who does not use the tool because of mandatory metadata.

#### 3.1.9 Event Photo

Photos attached to findings or to the event as a whole.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | Internal identifier |
| `event_id` | UUID | Parent event |
| `finding_id` | UUID, nullable | Associated finding (null if general event photo) |
| `url` | String | Storage URL |
| `caption` | String, nullable | Optional description |
| `order` | Integer | Display order |
| `created_at` | Timestamp | Upload time |

**Constraints:**
- Photos are uploaded during event creation.
- Photos are associated with specific findings (per-item evidence) or with the event globally (e.g., vehicle exterior overview shots).
- Photos cannot be modified or replaced after the event is signed.
- Photo entity is named `EventPhoto` (not `InspectionPhoto`) because it belongs to the base event model and will be reused by future event types.

#### 3.1.10 Review

Post-purchase buyer reviews of inspection reports. Reviews measure **inspection accuracy**, not service satisfaction.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | Internal identifier |
| `event_id` | UUID | Reviewed event (inspection) |
| `match_rating` | Enum | `yes` / `partially` / `no` |
| `comment` | Text, nullable | Optional free-text comment |
| `reviewer_identifier` | String | Pseudonymous identifier (not a full account) |
| `created_at` | Timestamp | Submission time |

**The review question:** "Did the vehicle's actual condition match what the inspection report described?"

- **`yes`** — the vehicle was as described in the report. The inspector's assessment was accurate.
- **`partially`** — some findings matched, others did not. The inspector may have missed issues or some conditions changed between inspection and purchase.
- **`no`** — the vehicle's condition differed significantly from the report. The inspection was inaccurate or misleading.

**Why this format instead of star ratings:** A 1-5 star system invites evaluation of irrelevant factors (inspector friendliness, price, speed). The ternary match question forces evaluation on the only dimension that matters to the next buyer considering this inspector: **does this inspector produce accurate reports?** On the inspector's profile, this aggregates as: "Of X reviews, Y% confirmed the vehicle matched the report."

**Constraints:**
- Reviews are linked to specific inspection events, not to inspectors generally.
- No authentication required to leave a review — the system uses a lightweight verification mechanism (e.g., a review token included in the report link, or email-based verification) to prevent spam while minimizing friction.
- Reviews are displayed on the inspection report and aggregated on the inspector's profile.
- Review volume will be low initially. This is expected and acceptable.

### 3.2 Entity Relationship Summary

```
Vehicle (VIN)
  └── Event (1..n) [immutable after signing]
        ├── Signed by Node via authorized User
        ├── event_type determines which detail table applies
        ├── InspectionDetail (1:1, when event_type = inspection)
        │     ├── Template Snapshot (from Inspection Template at creation time)
        │     ├── inspection_type, requested_by
        │     └── Inspection Findings (1..n)
        │           ├── Anchored to template section + item
        │           ├── Status (good/attention/critical/not_evaluated — null for free_text items)
        │           ├── Observation (free text)
        │           ├── Tags (optional normalized metadata)
        │           └── Photos (0..n)
        ├── [Future: ExecutionDetail, ModificationDetail, etc.]
        ├── General Photos (0..n)
        ├── Reviews (0..n)
        └── May reference prior Event (correction)

Node (inspector)
  ├── Has NodeMembers (N:N with Users)
  ├── Has Inspection Templates (1 in Phase 1)
  ├── Signs Events (via its members)
  └── Has public profile

User
  ├── Holds platform role (user / platform_admin)
  └── Belongs to Nodes via NodeMember (N:N)
        └── NodeMember has node-level role (member / node_admin)
```

### 3.3 Inherited Architectural Decisions

The following decisions from the original infrastructure design remain in force:

- **Immutability of signed events.** Once signed, an event cannot be edited or deleted. Corrections are new events referencing the original.
- **Policy-enforced signing.** Signing in the MVP is a system-recorded action (node ID, user ID, timestamp), not a cryptographic signature. Cryptographic infrastructure is post-MVP.
- **Node identity on signed events.** The signing node's identity is visible on every signed report. Accountability is structural.
- **VIN as canonical identifier.** VIN is the primary external identifier for vehicles. Non-VIN entry is an exception handled by plate-to-VIN resolution where possible.
- **Coverage is not built in Phase 1.** Verification Coverage tiers, gap detection, and inconsistency detection are deferred. The vehicle page in Phase 1 simply lists all signed events chronologically.
- **Event-based extensibility.** The base Event table + detail tables per type pattern (Section 3.1.6) is the architectural decision for supporting multiple event types. This replaces the single-entity Inspection model and aligns with the original vision of multiple event types (inspection, execution) on the same vehicle ledger.

---

## 4. MVP Features

### 4.1 Inspector-Facing Features

#### 4.1.1 Inspector Onboarding (Admin-Assisted)

The founder creates the inspector's node and user accounts. The inspector receives credentials and logs in.

**What is built:**
- Admin creates node: display name, logo upload, contact info, bio.
- Admin creates user account and links it to the node via NodeMember.
- Inspector logs in, sees their dashboard.
- Inspector receives a starter inspection template (predefined, professional baseline).

**What is deferred:**
- Self-registration or application flow (Phase 2).
- Multiple users per node (Phase 1 assumes one user per inspector node; N:N support exists in the data model but has no management UI).
- Node membership management UI.

**Landing page CTA:** The public-facing landing page includes a "Are you a vehicle inspector? Contact us to use the platform" call-to-action with a simple contact form or email link. This is not a self-signup flow — it is a lead capture mechanism that feeds the founder's direct hunting pipeline. The inspector expresses interest; the founder follows up manually.

#### 4.1.2 Inspection Template Management

The inspector customizes their inspection structure.

**What is built:**
- View and edit the starter template.
- Add, remove, reorder sections.
- Add, remove, reorder items within sections.
- Rename sections and items.
- Set item type: `checklist_item` (status + observation + photos + tags) or `free_text` (text + photos only).
- Save template changes (apply to future inspections only).

**What is deferred:**
- Multiple templates per inspector.
- Template import/export.
- Sharing templates between inspectors.
- Visual customization of the report layout (colors, fonts, custom layouts).

**Design principle:** The template editor must be simple enough that an inspector can customize their methodology in under 15 minutes during onboarding.

#### 4.1.3 Inspection Creation and Signing

The core workflow. An inspector creates an inspection for a vehicle and signs it.

**Critical design constraint — field-first UX:** This is NOT a form the inspector fills out after the inspection at a desk. This is the tool the inspector uses DURING the physical inspection, standing next to the vehicle, often in a garage or outdoor environment. The inspector holds a phone or tablet in one hand (possibly dirty or gloved) while examining components with the other. The inspection form IS the note-taking method — it replaces the inspector's current workflow of scribbling on paper, dictating voice notes, or typing into a personal Google Doc.

This means:
- **The form must be the fastest way to capture findings.** If it is slower than the inspector's current method, they will not use it. Every interaction must be optimized for one-handed, mobile use: large touch targets, minimal typing, status selection via single tap, swipe navigation between items.
- **Photos are taken in-line, not uploaded later.** The inspector taps a camera button on the current item, takes the photo, and it is immediately associated with that finding. The photo capture flow must be faster than the inspector's native camera app + manual organization afterward.
- **Section/item navigation must be instant.** The inspector moves through the vehicle physically (engine bay → interior → undercarriage) and the form must keep pace. Quick jump between sections, clear progress indication, no page reloads.
- **The form must work in hostile conditions.** Poor lighting (garage), sun glare (outdoor), wet or dirty hands, intermittent or zero connectivity. The UI must be high-contrast, touch-forgiving, and fully functional offline.

**Flow:**

1. **Vehicle identification.** Inspector enters VIN or plate. If the vehicle exists in the system, it is loaded. If not, a new vehicle record is created. Make/model/year/trim are decoded from VIN or entered manually.

2. **Inspection metadata.** Inspector selects:
   - Inspection type: pre-purchase / intake / periodic / other.
   - Requested by: buyer / seller / agency / other.
   - Odometer reading (km).
   - Inspection date.

3. **Structured inspection form.** The inspector's template is rendered as a form. For each item, the form adapts to the item type:
   - **Checklist items:** status selection (good / attention / critical / not evaluated), free-text observation, photo upload (zero or more), optional normalized tags.
   - **Free-text items:** text field and optional photo upload only. No status selector or tags.

4. **General photos.** Inspector uploads overview photos (vehicle exterior, VIN plate, odometer, etc.) not tied to a specific finding.

5. **Review and sign.** Inspector reviews the complete inspection summary. Signs with a single action. The system sets `signed_at = now()`, creates the immutable record, and generates the verified report link.

6. **Share.** Inspector receives the permanent verified report link, ready to share with their client.

**What is built:**
- Full inspection creation flow as described above.
- **Continuous local auto-save** — every field change, status selection, and observation keystroke is persisted to device local storage (IndexedDB) immediately. The inspector NEVER loses work due to browser closure, tab refresh, device shutdown, or battery death. When the app is reopened, the draft is exactly where it was left.
- **Background remote sync** — when connectivity is available, drafts sync to the server silently in the background. If connectivity is lost, changes queue locally and sync when connectivity returns. The inspector is never blocked or interrupted by sync status.
- **Offline-capable inspection creation** — the entire inspection flow (vehicle entry, metadata, findings, photo capture) works without any network connectivity. The inspector can complete a full inspection in airplane mode. Connectivity is only required for signing (which happens after the physical inspection, when the inspector is back at a desk or has signal).
- **Photo capture and local queuing** — photos taken during inspection are stored locally on the device first, compressed in the background, and uploaded when connectivity allows. Photos that fail to upload are retried automatically. The inspector sees their photos immediately in the form regardless of upload status.
- Vehicle auto-creation on first inspection if not in system.
- VIN decoding (best-effort, via external service or local decoder).
- Signing action with immutability enforcement.
- Verified report link generation with URL slug.

**What is deferred:**
- Bulk inspection creation.
- Inspection cloning or duplication.
- Voice-to-text for observations.
- AI-assisted findings or recommendations.

#### 4.1.4 Inspector Dashboard

The inspector's home screen after login.

**What is built:**
- List of recent inspections (draft and signed), sorted by date.
- Quick access to create a new inspection.
- Search/filter inspections by vehicle VIN, date, or status.
- Link to edit their template.
- Link to their public profile.

**What is deferred:**
- Analytics or statistics dashboard.
- Calendar or scheduling features.
- Client management.
- Revenue tracking.

#### 4.1.5 Inspector Profile (Public)

A public page displaying the inspector's professional identity and track record.

**What is built:**
- Inspector/business name, logo, contact information, bio.
- Number of signed inspections.
- "Inspecting since" date (date of first signed inspection).
- Average detail level: sections completed, photos attached, observations per report (computed automatically).
- Aggregated review summary (count and breakdown of match ratings).
- Link to all public inspection reports by this inspector.

**What is deferred:**
- Finding rate (percentage of inspections with reported issues) — deferred to Phase 2 due to inflation risk with small numbers.
- Average observations per report as a standalone visible metric.
- Tier badges.
- Contact form or lead generation features.
- Inspector discovery or directory.

### 4.2 Buyer-Facing Features

#### 4.2.1 Verified Inspection Report (Public Link)

The primary artifact the platform produces. A permanent, public URL displaying the complete inspection report.

**URL pattern:** `/{slug}` or `/report/{slug}`

**What is displayed:**
- **Vehicle summary:** VIN (full or partially masked — TBD), make, model, year, trim.
- **Inspection metadata:** inspection type, date, odometer reading.
- **Requested by:** buyer / seller / agency / other — displayed prominently. Transparency, not concealment.
- **Inspector identity:** name/business, logo, link to public profile.
- **Full inspection findings:** organized by section as structured by the inspector's template. Each item shows status, observation, tags (if present), and photos.
- **General photos:** vehicle overview images.
- **Verification metadata:** "This report was signed on [date] by [inspector name] and cannot be modified." Clear statement of immutability.
- **Reviews:** any post-purchase reviews left for this inspection.
- **White-label presentation:** the inspector's brand is prominent — name, logo, contact information. The platform appears as verification infrastructure: a footer-level attribution ("Verified on [platform name]" with a small logo).

**What is NOT displayed:**
- Owner identity (no owner concept in Phase 1).
- Other inspections of the same vehicle (that is on the vehicle page).
- Coverage tiers or scoring.

**No authentication required.** Anyone with the link can view the report.

#### 4.2.2 OpenGraph Preview (Share Card)

When the verified report link is pasted in a marketplace listing (MercadoLibre, Facebook Marketplace), messaging app (WhatsApp), or social media, it renders a professional preview card.

**What the preview card shows:**
- Vehicle photo (first general photo, or a branded placeholder).
- Vehicle identity: make, model, year.
- Inspector name.
- Inspection date and summary line (e.g., "Pre-purchase inspection — 23 items evaluated, 4 findings noted").
- Verification badge or indicator.

**Design principle:** The preview card must be visually superior to any link an inspector could produce independently (Google Doc, personal website, PDF link). This is the day-1 artifact advantage that captures inspectors before network effects exist.

**Implementation:** Standard OpenGraph meta tags (`og:title`, `og:description`, `og:image`, `og:url`) on the report page. The `og:image` should be dynamically generated per report to include vehicle-specific and inspector-specific information.

#### 4.2.3 Vehicle Page (Public)

A page accessible by VIN, listing all signed events for that vehicle as a timeline.

**URL pattern:** `/vehicle/{vin}` or `/v/{vin}`

**What is displayed:**
- Vehicle summary: VIN, make, model, year, trim.
- Chronological timeline of all signed events for this VIN.
- Each event displays: event type label (e.g., "Inspection"), date, odometer, node name (inspector), and link to the full event page.

In Phase 1, all events are inspections. However, the vehicle page renders them as typed events — each entry shows its `event_type` label — so that when execution events, modifications, or measurements are added in later phases, the timeline accommodates them without redesign. The UI is built for a heterogeneous event timeline from day one, even though the initial content is homogeneous.

**What is NOT displayed:**
- Coverage tiers or scoring.
- Owner identity.
- Gap detection or inconsistency analysis.
- Unsigned or draft inspections.

**Design principle:** In Phase 1, this page exists but is not actively marketed to buyers. Its value emerges as vehicles accumulate multiple inspections. It is built now because it is architecturally central — the VIN is the organizing entity — and because it enables the second-opinion dynamic: two independent inspections on the same vehicle that substantially agree create high confidence.

#### 4.2.4 Post-Purchase Review Flow

A buyer who used a verified inspection report in a purchase decision can leave a structured review.

**Flow:**
1. Buyer accesses the review mechanism (via a link in the report, or a prompted email if contact information was captured).
2. Buyer answers: "Did the vehicle's condition match the inspection report?" — Yes / Partially / No.
3. Buyer optionally adds a free-text comment.
4. Review is submitted and displayed on the inspection report and aggregated on the inspector's profile.

**What is built:**
- Review submission form (accessible without full account creation).
- Review display on inspection report page.
- Review aggregation on inspector profile.
- Basic spam prevention (rate limiting, review token, or email verification — lightweight).

**What is deferred:**
- Review incentive mechanisms (discounts, prompts).
- Structured follow-up questions.
- Review moderation beyond spam prevention.

### 4.3 Platform / Admin Features

#### 4.3.1 Inspector Onboarding Administration

**What is built:**
- Create node (inspector) with profile information and logo.
- Create user account and link to node via NodeMember.
- Activate / suspend node.
- View list of all nodes and their status.

**What is deferred:**
- Application and verification flow for incoming inspector requests.
- Node self-management of profile information (in MVP, changes are admin-assisted or via a simple edit page).
- Node membership management UI (adding/removing members from nodes).

#### 4.3.2 Traction Metrics Dashboard

**What is built:**
- Active inspectors (produced at least 1 report in the last 30 days).
- Total signed inspections (all time and per month).
- Inspections per inspector per month.
- Verified link engagement: page views, unique visitors, average time on page per report.
- Inspector retention: first report date, last report date, total reports, activity frequency.
- Review submission count and breakdown.

**Implementation:** This can be a simple internal dashboard or a set of database queries / analytics tool integration. It does not need to be a polished product feature — it is internal tooling for the founder.

---

## 5. Principal Flows

### 5.1 Flow 1 — Inspector Creates a Verified Inspection Report

```
Inspector logs in
  → Dashboard: recent inspections, "New Inspection" button
    → Enter VIN or plate
      → System looks up vehicle
        → Found: load vehicle data
        → Not found: create vehicle, attempt VIN decode, manual entry fallback
    → Select inspection type + requested by + odometer + date
    → Structured form renders (from inspector's template)
      → For each item: set status, write observation, upload photos, add tags (optional)
      → Upload general photos
    → Review summary screen
      → Inspector reviews all findings
      → "Sign Inspection" action
        → System creates immutable record, sets signed_at
        → Generates permanent verified report link with slug
    → Confirmation screen with shareable link
      → Copy link, share via WhatsApp, etc.
```

**Time target:** Under 30 minutes for a typical inspection (excluding the physical inspection itself). Under 90 minutes for the first inspection including template setup.

**Critical note:** The flow above is presented linearly for clarity, but in practice steps 3-4 (structured form + general photos) happen DURING the physical inspection, not after it. The inspector walks around the vehicle, examines each component, and records findings in real-time on their phone/tablet. The form IS the inspection workflow. See Section 4.1.3's field-first UX constraint and Section 9.4 for the technical requirements this implies.

### 5.2 Flow 2 — Buyer Views Verified Report

```
Buyer receives link (from inspector, seller, marketplace listing, or WhatsApp)
  → Clicks link (motivated by OpenGraph preview card)
    → Verified report page loads (no auth required)
      → Buyer sees: vehicle info, inspector identity, inspection date/odometer
      → Buyer sees: "Requested by: [buyer/seller/agency]"
      → Buyer sees: full findings by section with status, observations, photos
      → Buyer sees: "Signed on [date] by [inspector]. This report cannot be modified."
      → Buyer can click through to inspector's public profile
      → Buyer can click through to vehicle page (see other inspections)
```

### 5.3 Flow 3 — Verified Link in Marketplace Listing

```
Inspector (or seller/buyer) copies verified report link
  → Pastes in marketplace listing (MercadoLibre, Facebook Marketplace) or WhatsApp
    → Platform renders OpenGraph preview:
      → Vehicle photo, make/model/year, inspector name, inspection summary
    → Potential buyer sees professional preview in listing
      → Clicks through to full verified report
```

### 5.4 Flow 4 — Post-Purchase Review

```
Buyer completes vehicle purchase
  → Buyer returns to verified report link (bookmarked or in message history)
    → "Leave a review" section visible on report page
      → Buyer answers: "Did condition match the report?" → Yes / Partially / No
      → Buyer optionally adds comment
      → Submits (lightweight verification: token or email)
    → Review appears on report page and inspector profile
```

### 5.5 Flow 5 — Correction of a Signed Inspection

```
Inspector identifies an error in a signed report (e.g., wrong odometer)
  → From dashboard, selects the signed event
    → "Create Correction" action
      → Creates a new event linked to the original via correction_of_id
      → Inspector fills in corrected data
      → Signs the correction
    → Both original and correction appear on the vehicle page
    → Original report displays a notice: "A correction has been issued for this report"
    → Correction report displays: "This corrects report [original link]"
```

---

## 6. What Is NOT Built (Phase 1)

Each exclusion is deliberate and documented.

### 6.1 Vehicle Claims and Ownership

No owner accounts, no vehicle claims, no owner dashboard. The vehicle is a data container identified by VIN. Ownership is not modeled in Phase 1.

**Why:** The verifier-first model does not require vehicle ownership to function. Inspectors create reports for vehicles. Buyers view them. Adding ownership introduces authentication complexity, claim disputes, and privacy considerations that do not serve the core validation hypotheses.

### 6.2 Execution Events (Workshop Work Records)

No event type for work performed (oil changes, repairs, modifications). The only event type is inspection.

**Why:** Execution events are Phase 2, activated when workshops join via the intake inspection bridge. The data model supports execution events (the event type is extensible), but no UI or flow is built.

### 6.3 Event Proposals as Separate Entities

No draft-then-sign two-layer model with separate proposal and ledger event entities. In Phase 1, the inspector creates an event directly and signs it. The event has `draft` and `signed` states, but there is no separate "proposal" entity.

**Why:** The proposal layer in the original design existed to support owner-submitted events awaiting node validation. Without owners in Phase 1, the two-layer model adds complexity without value. The event entity with draft/signed states provides the same immutability guarantees.

**Architectural note:** The event model can be extended to support proposals if owner-submitted events are added later. This is not a one-way door.

### 6.4 Verification Coverage Tiers and Scoring

No coverage calculation, no tier labels, no gap detection, no inconsistency analysis.

**Why:** Coverage requires event density to be meaningful. A vehicle with one inspection has no "coverage" to evaluate. These features are Phase 2+ when vehicles begin accumulating multiple events from multiple sources.

### 6.5 Finding Rate and Quality Metrics for Inspectors

No finding rate (percentage of inspections with reported issues), no average observations per report as a standalone metric, no tier badges, no cross-validation between inspectors.

**Why:** Finding rate with small numbers is noise, not signal. Displaying "80% finding rate" based on 5 inspections is misleading. Worse, displaying finding rate incentivizes inflated findings. These metrics are introduced in Phase 2 when volume makes them meaningful and reviews provide counterbalancing signal.

Phase 1 displays only safe metrics: inspection count, average detail level (an automated proxy for thoroughness), and operating-since date.

### 6.6 Workshop Panel and Workshop-Specific Features

No workshop management interface, no service records, no appointment scheduling, no client database, no intake inspection as a distinct flow.

**Why:** The intake inspection uses the same tool as pre-purchase inspections — the inspector selects "intake" as the inspection type. No separate flow is needed. Workshop-specific features (execution events, service records) are Phase 2.

### 6.7 Marketplace Integration

No direct integration with MercadoLibre, Facebook Marketplace, or other listing platforms.

**Why:** The verified link with OpenGraph preview is the integration mechanism. It works on any platform that renders link previews. Direct API integration with marketplaces is a Phase 3 consideration.

### 6.8 Billing, Subscriptions, and Monetization

No payment processing, no subscription management, no paywalls, no freemium limits.

**Why:** Revenue = $0 in Phase 1 by design. Every friction point on the supply side works against adoption. Monetization infrastructure is built when traction justifies it.

### 6.9 Mobile-Native Application

No iOS or Android app. The MVP is a web application (responsive, mobile-friendly).

**Why:** A responsive web app is sufficient for inspector use (primarily tablet or phone in the field). Native app development doubles the build effort without proportional value in Phase 1.

### 6.10 AI or Automated Features

No AI-assisted findings, no automated photo analysis, no predictive maintenance, no smart suggestions.

**Why:** These are product enhancements that depend on volume and structured data. In Phase 1, the tool's value comes from structure and professionalism, not automation.

---

## 7. Success Metrics

Aligned with the [90-day validation plan](../../90-day-validation-plan.md).

### 7.1 Primary Metric

**Signed inspection events per month from active beta inspectors.**

Target by end of month 3: at least 3 inspectors each producing at least 8 verified reports per month. Total signed inspection events >= 80 across the period.

### 7.2 Secondary Metrics

| Metric | Definition | Target |
|---|---|---|
| Inspector conversion rate | Proportion of contacted inspectors that complete at least one verified report | >= 30% of qualified outreach |
| Time-to-first-verified-report | Elapsed time from tool introduction to first completed report (including template setup) | <= 90 minutes in a single session |
| Inspector usage persistence | Proportion of inspectors active in weeks 1-4 that continue in weeks 9-12 | >= 70% persistence rate |
| Buyer link engagement | Open rate for verified report links delivered to buyers | >= 40% open rate |
| Buyer time on page | Average time on page for opened verified report links | >= 60 seconds |
| Inspector-workshop overlap | Proportion of onboarded inspectors that also operate as workshops | >= 30% (below 20% requires reassessment) |
| Review submission rate | Reviews submitted per inspection that led to a purchase | Directional — any volume is positive in Phase 1 |

### 7.3 Red Flag Indicators

- Any inspector produces reports in weeks 1-2 but zero in weeks 5-6.
- Average time-to-first-verified-report exceeds 3 hours or requires multiple sessions.
- More than 50% of outreach conversations result in the tool being perceived as a platform threat.
- Buyer open rate for verified links below 15% across all contexts.
- Zero inspectors in the initial cohort also operate as workshops.

### 7.4 Structural Invariants

These are pass/fail constraints, not metrics:

- No ability to alter signed inspection reports (immutability holds).
- Signed inspector identity visible on every report (accountability holds).
- Report link is permanent and accessible without authentication (public accessibility holds).
- OpenGraph preview renders correctly on MercadoLibre, Facebook Marketplace, and WhatsApp (distribution mechanism works).

---

## 8. Risks and Dependencies

### 8.1 Critical Risk — Workshop Bridge Failure

**Risk:** The bridge from inspectors to workshops does not materialize. Inspectors and workshops are genuinely distinct populations. The inspector-workshop overlap is near zero. Workshops do not adopt the intake inspection use case.

**Impact:** Without workshops, vehicle histories remain collections of inspection snapshots. The vision of vehicle identity infrastructure is not achievable. The inspection business alone is too small for a sustainable company.

**Mitigation:** Probe the inspector-workshop overlap aggressively from day 1. Every inspector conversation must include the overlap question. If early signal is negative (below 20% overlap), begin designing a standalone workshop acquisition strategy before Phase 1 ends.

**Kill implication:** This is not a Phase 1 kill criterion — the MVP validates inspector adoption, not workshop transition. But it is the existential question for Phase 2. If the overlap is zero and intake inspections do not resonate with workshops, the long-term thesis requires fundamental revision.

### 8.2 Risk — Inspector Tool Is Not Better Enough

**Risk:** The report generator is a marginal improvement over the inspector's existing method, not sufficient to overcome switching inertia. An inspector with a well-developed personal template may resist switching even if the platform output is objectively superior.

**Mitigation:** The tool must be noticeably faster AND produce noticeably better output. The white-label report must be something the inspector is proud to deliver. The verified link with OpenGraph preview must be something the inspector cannot replicate independently. Validate through inspector conversations before committing to build.

### 8.3 Risk — Verified Links Are Ignored by Buyers

**Risk:** Buyers treat verified report links as unfamiliar noise — another link in a market full of scams and marketing.

**Mitigation:** The OpenGraph preview must be compelling enough to generate the click. The report page must be compelling enough to hold attention. Invest in preview card design and report page UX. Test with buyer conversations before and during build.

### 8.4 Risk — Data Loss During Field Use

**Risk:** Inspectors work in environments with variable connectivity (garages, outdoor locations) and hostile device conditions (dirty hands, low battery, accidental app closure). Any data loss — findings, observations, photos — during an active inspection is a trust-destroying event. An inspector who loses work once will never use the tool again.

**Mitigation:** This risk is addressed as a core architectural requirement, not an afterthought. See Section 9.4 (Field Resilience and Data Persistence) for the complete specification. Key guarantees:
- Local-first data model: all changes persist to device storage before any network request.
- Continuous auto-save with no explicit save action required.
- Photo capture stored locally first, uploaded asynchronously.
- Full offline capability for the inspection form (signing requires connectivity).
- Draft recovery on app reopen after any interruption (browser kill, device shutdown, battery death).

### 8.5 Dependency — VIN Decoding Service

**Dependency:** VIN-to-vehicle-data decoding relies on an external service or local database.

**Mitigation:** VIN decoding is best-effort. The system must function fully with manual entry of make, model, and year. The decoder is a convenience that reduces friction, not a hard dependency.

### 8.6 Dependency — Image Storage

**Dependency:** Photo storage requires a reliable object storage service (S3, GCS, or equivalent).

**Decision:** Standard cloud object storage. Images are served via CDN for fast loading of report pages. Storage cost at Phase 1 volume is negligible.

---

## 9. Technical Considerations

### 9.1 Platform

**Web application.** Responsive design optimized for both desktop (template management, dashboard) and mobile/tablet (inspection creation in the field).

**No native mobile app in Phase 1.** The inspection creation flow must work well in a mobile browser. **Progressive Web App (PWA) capabilities are a hard requirement for MVP**, not optional. Specifically:
- **Service Worker** for offline caching of application shell, static assets, and the inspection form UI. The inspector must be able to open the app and begin an inspection even with zero connectivity.
- **IndexedDB** for local persistence of draft inspections, queued photos, and pending sync operations.
- **Add-to-home-screen** so the inspector launches the app like a native app, without navigating through a browser. This eliminates the risk of accidentally closing the browser tab and reinforces the tool's identity as "their inspection app."
- **Background Sync API** (where supported) for deferred upload of photos and draft data when connectivity is restored.

### 9.2 Authentication

**Simple authentication for inspectors.** Email + password or magic link. No social login complexity required.

**No authentication for report viewers.** Public pages (verified reports, vehicle pages, inspector profiles) are fully accessible without any account.

### 9.3 Data Model Principles

- **UUIDs as primary keys** for all entities. No auto-increment IDs exposed externally.
- **Immutability enforced at the application layer.** Signed events cannot be updated or deleted via any API endpoint. Database-level enforcement (write-once tables or triggers) is recommended but not required for MVP.
- **Soft deletes only.** No hard deletion of any data, ever. Even draft events that are abandoned are retained.
- **Timestamps are server-set** for all system events (created_at, signed_at). Client-provided timestamps (inspection_date) are metadata, not system timestamps.

### 9.4 Field Resilience and Data Persistence

**Design principle: zero data loss, zero connectivity dependence during inspection.**

This is the most critical technical requirement for inspector adoption. An inspector who loses 30 minutes of work once will never use the tool again. The architecture must guarantee that no user action is ever lost, regardless of device state or network conditions.

#### 9.4.1 Local-First Data Model

All inspection data follows a local-first pattern:

1. **Every mutation is written to IndexedDB first.** Status changes, observation text, photo captures — all persist locally before any network request is attempted.
2. **Remote sync is asynchronous and non-blocking.** The app attempts to sync to the server when connectivity is available. Sync failures are silent to the user — data remains safe locally and retries automatically.
3. **Conflict resolution is last-write-wins per field.** If the inspector edits the same draft from two devices (unlikely but possible), the most recent write per field takes precedence. Full conflict resolution is not needed for Phase 1 (single user per node).

#### 9.4.2 Auto-Save Behavior

- **Keystroke-level persistence:** Every change triggers a debounced write to IndexedDB (debounce: 500ms for text fields, immediate for status selections and photo captures).
- **No explicit "Save" button for drafts.** The inspection is always saved. A subtle visual indicator confirms sync status (e.g., "Saved locally" / "Synced" / "Waiting for connection") but no user action is required.
- **Recovery on app reopen:** If the browser/app is killed, the inspector reopens the app and sees their draft exactly as they left it — same section, same scroll position where feasible.

#### 9.4.3 Photo Queuing

Photos are the largest and most fragile data element. The pipeline:

1. Inspector taps camera → native camera opens (or in-app capture).
2. Photo is saved to IndexedDB as a blob immediately after capture.
3. Photo thumbnail is generated locally and displayed in the form instantly.
4. A background process compresses the photo (target: ~500KB-1MB).
5. The compressed photo is queued for upload.
6. Upload occurs when connectivity is available, with exponential backoff on failure.
7. Upload status is visible per photo (local only / uploading / uploaded) but never blocks the inspector's workflow.

**Constraint:** The inspector must never wait for a photo to upload before continuing to the next item. Photo capture → form continuation must feel instantaneous.

#### 9.4.4 Connectivity States

The app operates in three connectivity modes, transparent to the user:

| State | Behavior |
|---|---|
| **Online** | All changes sync to server in real-time. Photos upload as captured. Full functionality. |
| **Degraded** | Intermittent connectivity. Changes queue locally, sync when possible. Photo uploads retry automatically. Inspector workflow is uninterrupted. |
| **Offline** | All changes persist locally only. Photos stored as local blobs. When connectivity returns, everything syncs. The only feature unavailable offline is **signing** (requires server confirmation for immutability guarantee). |

**Signing requires connectivity** because the signed_at timestamp and immutability record must be server-authoritative. This is acceptable because signing happens after the physical inspection — the inspector can sign later when they have signal. The draft is safe regardless.

### 9.5 Image Handling

- **Upload:** Direct to object storage (presigned URLs) to avoid routing large payloads through the application server.
- **Compression:** Client-side compression before upload (target: reasonable quality at reduced file size, ~500KB-1MB per photo).
- **Serving:** CDN-fronted object storage. Responsive image variants for report page (thumbnail, standard, full resolution).
- **Capacity planning:** Assume 10-20 photos per event. At 80 events over 90 days, ~1,600 images. Negligible storage cost.

### 9.6 OpenGraph and Social Sharing

- **Dynamic meta tags** per report page: `og:title`, `og:description`, `og:image`, `og:url`.
- **Dynamic OG image generation:** A pre-rendered image per report containing vehicle info, inspector branding, and a summary line. Generated at sign time or on first access, cached.
- **Testing:** Validate OpenGraph rendering on MercadoLibre, Facebook Marketplace, WhatsApp, and Telegram before launch. Each platform has quirks in preview card rendering.

### 9.7 Analytics and Tracking

Essential for measuring validation metrics:

- **Page view tracking** on all public pages (report, vehicle, profile). Basic analytics (page views, unique visitors, time on page, referrer).
- **Link click tracking** where possible — distinguish direct visits from referrals from marketplace listings.
- **Event tracking** for key inspector actions: inspection created, inspection signed, template modified, report link copied/shared.
- **Review tracking:** submission rate relative to report views.

Implementation: lightweight analytics (self-hosted or third-party). The goal is metric visibility, not sophisticated analysis.

### 9.8 URL Structure

| Page | URL Pattern | Auth Required |
|---|---|---|
| Verified report | `/{slug}` or `/report/{slug}` | No |
| Vehicle page | `/vehicle/{vin}` | No |
| Inspector profile | `/inspector/{node-slug}` | No |
| Inspector dashboard | `/dashboard` | Yes (inspector) |
| New inspection | `/dashboard/inspect` | Yes (inspector) |
| Template editor | `/dashboard/template` | Yes (inspector) |
| Admin panel | `/admin` | Yes (admin) |

### 9.9 Starter Inspection Template

The platform provides a starter template that new inspectors can customize. This template serves as a professional baseline and reduces the "blank page" problem during onboarding.

**Suggested starter template structure:**

1. **Exterior** — body condition, paint, glass, lights, tires, wheels.
2. **Engine Bay** — oil level/condition, coolant, belts, hoses, battery, leaks.
3. **Interior** — seats, dashboard, controls, HVAC, electronics, odometer verification.
4. **Undercarriage** — frame, suspension, exhaust, drivetrain, fluid leaks.
5. **Mechanical Test** — engine start/idle, transmission behavior, brakes, steering, noises.
6. **Road Test** — acceleration, braking, steering response, suspension behavior, alignment.
7. **Electrical / Electronics** — OBD scan results, warning lights, sensor readings.
8. **Documentation** — title verification, service records review, VIN match.

Each section contains 4-8 checklist items. The inspector can rename, reorder, add, or remove any section or item.

---

## 10. Phase 2 Considerations

The following items are explicitly deferred, not rejected. They should be evaluated against Phase 1 data.

### Activated by Inspector Traction (Phase 2A)

- **Application and verification flow** for inspectors who want to join (replacing direct hunting).
- **Finding rate and advanced metrics** on inspector profiles.
- **Tier badges** — objective, metric-based tiers.
- **Multiple templates per inspector** (pre-purchase, periodic, intake-specific).
- **Full visual customization** of reports (colors, fonts, custom layouts).

### Activated by Workshop Bridge (Phase 2B)

- **Execution events** — a second event type for work performed.
- **Workshop-specific onboarding** — distinct pitch and entry flow.
- **Intake inspection as explicit product feature** (currently handled via inspection type selection).

### Activated by Volume (Phase 2C)

- **Verification Coverage tiers** and scoring.
- **Gap and inconsistency detection.**
- **Cross-validation between inspectors** on the same vehicle.
- **VIN search as consumer-facing feature.**
- **Inspector discovery / directory.**

### Activated by Revenue Decision (Phase 3)

- **SaaS subscription** for inspectors.
- **Premium report artifacts** (downloadable, formally formatted).
- **Agency channel** features (bulk inspections, portfolio views).
- **Institutional API access** (insurance, lending, fleet).

---

*Document — Verifier-First MVP PRD v1.0 | Internal Use Only*
*Derived from: work/verifiers/context.md | work/verifiers/decisions.md | one-pager.md v2.0 | 90-day-validation-plan.md v2.0*
