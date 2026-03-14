# Flow: Inspection Creation

*Describes how an inspector creates a new inspection on mobile, fills findings in the field, with offline support and auto-save.*
*Derived from: specs/entities/event.md | specs/entities/vehicle.md | specs/entities/inspection-detail.md | specs/entities/inspection-finding.md | specs/entities/event-photo.md | specs/entities/inspection-template.md | specs/implementation-plan.md (Phase 2)*

---

## Overview

The inspector creates a new inspection from the dashboard. The flow has three steps: (1) vehicle identification via VIN, (2) inspection metadata, and (3) structured findings form in field mode. The entire flow is designed for mobile-first, one-handed use, with offline support via IndexedDB (Dexie.js) and automatic background sync.

---

## Prerequisites

- User is authenticated with role `user` (inspector).
- User belongs to a node via NodeMember.
- The node has an inspection template (created in Phase 1).

---

## Entry Point

- From Dashboard (Shell B), the inspector taps **"Nueva Inspección"** button.
- Navigates to `/dashboard/inspect` (Step 1).

---

## Flow Steps

### Step 1: Vehicle Identification (`/dashboard/inspect`)

The inspector enters the VIN to identify the vehicle.

#### 1.1 VIN Entry

- Single text input field for VIN, `text-lg`, uppercase, monospace styling.
- Label: "Número de VIN".
- Placeholder: "Ingresá el VIN de 17 caracteres".
- Input is auto-uppercased and strips spaces as the user types.
- Character counter below input: "12/17 caracteres".
- Validation runs on every change:
  - Exactly 17 alphanumeric characters.
  - No I, O, Q characters (ISO 3779).
  - Check digit validation (position 9).
- Validation errors shown inline below the input in `error` color.

#### 1.2 VIN Decode

- When VIN reaches 17 valid characters, the system automatically calls the NHTSA vPIC API to decode make/model/year/trim.
- **While decoding:** spinner indicator next to the input, "Decodificando VIN...".
- **On success:** decoded vehicle info displayed in a summary card below:
  - Make, Model, Year, Trim (e.g., "Nissan Sentra 2019 — SR").
  - If the vehicle already exists in the system, a notice: "Este vehículo ya tiene {n} inspección(es) registrada(s)."
- **On failure (API error or no data):** warning notice: "No se pudo decodificar el VIN. Podés ingresar los datos manualmente."
  - Manual entry fields appear: Make, Model, Year, Trim — all optional text inputs.

#### 1.3 Plate (Optional)

- Text input for license plate number.
- Label: "Patente (opcional)".
- No validation beyond VARCHAR(20) length limit.

#### 1.4 Continue

- "Continuar" primary button at the bottom.
- Enabled only when VIN is valid (17 chars, passes check digit).
- On tap:
  - Calls `findOrCreateVehicle(vin)` — creates the vehicle if not found, returns existing if found.
  - Updates vehicle with decoded/manual make, model, year, trim, plate if provided.
  - Navigates to Step 2.

---

### Step 2: Inspection Metadata (`/dashboard/inspect/metadata`)

The inspector selects the type of inspection and basic metadata.

#### 2.1 Inspection Type

- Radio button group with 4 options:
  - `pre_purchase` — "Pre-compra" (default selected).
  - `intake` — "Recepción".
  - `periodic` — "Periódica".
  - `other` — "Otra".
- Large touch targets (full-width rows, 56px tall).

#### 2.2 Requested By

- Radio button group with 4 options:
  - `buyer` — "Comprador" (default selected).
  - `seller` — "Vendedor".
  - `agency` — "Agencia".
  - `other` — "Otro".
- Same styling as inspection type.

#### 2.3 Odometer

- Number input for odometer reading in kilometers.
- Label: "Kilometraje".
- Placeholder: "87500".
- `type="number"`, `inputmode="numeric"` for mobile numeric keyboard.
- Right-aligned, large text. Suffix label: "km".
- Required field.

#### 2.4 Inspection Date

- Date input.
- Label: "Fecha de inspección".
- Default: today's date.
- Native `<input type="date">` on mobile.

#### 2.5 Continue

- "Iniciar Inspección" primary button at the bottom.
- On tap:
  - Creates the Event record: `status: 'draft'`, `event_type: 'inspection'`, generates slug.
  - Creates the InspectionDetail record: snapshots the current template into `template_snapshot`.
  - Creates InspectionFinding records for every item in the template snapshot with defaults (`status: 'not_evaluated'`, `observation: null`).
  - Saves the full draft to Dexie (IndexedDB) for offline persistence.
  - If online, syncs to server via server action.
  - Navigates to Step 3 (Field Mode).

---

### Step 3: Findings Form — Field Mode (`/dashboard/inspect/[id]`)

This is the core of the app. The inspector uses **Shell C** (Field Mode) to fill out inspection findings one item at a time. Optimized for one-handed mobile use.

#### 3.1 Top Bar (Fixed, 48px)

- Vehicle identity: "{Make} {Model} {Year}" (abbreviated if needed).
- Section progress: "{current}/{total}" (e.g., "3/9").
- Close button (✕): navigates back to dashboard. Draft is auto-saved — no data loss.

#### 3.2 Section Tabs (Fixed, 44px)

- Horizontal scrollable tabs, one per section from the template snapshot.
- Active tab: `brand-accent` text + 2px bottom border.
- Inactive tabs: `gray-500` text.
- Tap to jump to section. Scroll snaps to keep active tab visible.
- Section names truncated with ellipsis if too long.
- Sections with all items evaluated show a subtle check icon.

#### 3.3 Item Cards (Scrollable Content)

Items are displayed as vertically stacked cards within the active section.

**Checklist Item Card:**

- **Item name** at the top (`text-base`, `font-medium`, `gray-800`).
- **Status buttons** — 4 equal-width buttons in a row, 56px tall:
  - "✓ Bien" (`status-good`)
  - "⚠ Att" (`status-attention`)
  - "✕ Crit" (`status-critical`)
  - "— N/E" (`status-not-evaluated`)
  - Unselected: white bg, `gray-200` border, `gray-600` text.
  - Selected: status color bg tint, status color border (2px), status color text, bold.
  - Tap selects. Tapping selected button deselects (returns to `not_evaluated`).
- **Observation textarea** — auto-expanding, `text-base`, placeholder "Agregar observación...".
  - Collapsed to 1 line by default. Expands as the inspector types.
  - Text is debounced (500ms) and auto-saved to Dexie.
- **Photo row** — horizontal row:
  - "📷 Agregar foto" button (48x48, camera icon).
  - Photo thumbnails (64x64, `radius-sm`): show local blob immediately.
  - Tap thumbnail: view full size. Long-press: delete (draft only).
- **Left border** color indicator: matches selected status (green/amber/red/gray).

**Free Text Item Card:**

- **Item name** at the top.
- **Large textarea** — auto-expanding, minimum 3 lines, `text-base`, placeholder "Escribir...".
- **Photo row** — same as checklist item.
- No status buttons.

#### 3.4 Bottom Bar (Fixed, 56px)

- **Previous button** (left): "◀ Anterior". Navigates to previous section. Disabled on first section.
- **Camera button** (center): "📷 Foto". Adds a vehicle photo (`photo_type = 'vehicle'`, not tied to any finding). Auto-expands the vehicle photos section if collapsed. Always enabled.
- **Next button** (right): "Siguiente ▶". Navigates to next section. On last section, label changes to "Revisar ▶" (future: navigates to Review & Sign in Phase 3).

#### 3.5 Sync Indicator

- Positioned in the top bar, right of section progress.
- States:
  - **Saved locally:** `gray-400` text: "Guardado" + check icon.
  - **Syncing:** `gray-400` text: "Sincronizando..." + spinner.
  - **Synced:** `success` text: "Sincronizado" + check icon (fades to gray after 2s).
  - **Offline:** `warning` text: "Sin conexión" + cloud-off icon.

---

## Auto-Save and Offline Behavior

### Local-First Data Flow

```
User action (status change, observation text, photo capture)
  → Write to Dexie (IndexedDB) immediately
  → Status changes: saved immediately
  → Text changes: debounced 500ms
  → Photo captures: saved as blob immediately
  → Queue sync operation
  → If online: sync to server via server action
  → If offline: queue persists, syncs when connectivity returns
```

### Draft Persistence

- Every change is written to Dexie first, then queued for server sync.
- Closing the browser, refreshing, or device shutdown → draft intact in IndexedDB.
- Reopening the app → draft loads from Dexie, not the server.
- Draft list is visible on the dashboard.

### Photo Handling

1. Inspector taps camera → device camera opens (native file input with `capture="environment"`).
2. Photo captured → client-side compression (canvas API, target ~500KB–1MB).
3. Compressed blob saved to Dexie immediately → thumbnail displayed in the form.
4. If online: upload to Cloudinary in background → on success, update the EventPhoto record with the Cloudinary URL.
5. If offline: blob stays in Dexie → queued for upload when connectivity returns.
6. Upload indicator on thumbnail:
   - Uploading: subtle progress overlay.
   - Failed: red border + retry icon.
   - Local only (offline): cloud-off icon overlay.
   - Uploaded: no indicator (clean thumbnail).

### Conflict Resolution

- Last-write-wins for all fields.
- The Dexie draft is the primary copy during editing. Server is the backup.
- No multi-device concurrent editing expected (inspector uses one phone).

---

## Resuming a Draft

- From Dashboard, the inspector taps a draft inspection card.
- The app loads the draft from Dexie (or server if Dexie is empty).
- Navigates directly to Step 3 (Field Mode) at the last active section.
- All previously entered findings, observations, and photos are restored.

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Invalid VIN format** | Inline error below input: "El VIN debe tener 17 caracteres alfanuméricos (sin I, O, Q)." Continue button disabled. |
| **VIN decode returns partial data** | Show decoded fields, leave blanks for missing. Inspector can fill manually. |
| **VIN already in system** | Show existing vehicle data. Notice with inspection count. Proceed normally — create a new event for the same vehicle. |
| **NHTSA API timeout** | After 5s timeout, show warning: "No se pudo decodificar el VIN." Enable manual entry. Do not block flow. |
| **Network lost during Step 1–2** | Show offline indicator. Vehicle creation and event creation are queued. Inspector can still proceed to field mode — all data saved locally. |
| **Network lost during Step 3** | Auto-save continues to Dexie. Sync indicator shows "Sin conexión". All status changes, observations, and photos persist locally. Sync resumes when online. |
| **Browser closed mid-inspection** | Draft fully preserved in Dexie. Inspector reopens → resumes from dashboard. |
| **Photo upload fails** | Retry with exponential backoff (3 attempts). After 3 failures, photo stays in local queue with "retry" indicator. Manual retry available. |
| **Very large observation text** | TEXT column — no practical limit. Textarea scrolls. |
| **Empty section (no items)** | Section tab visible but content area shows: "Esta sección no tiene items." |
| **All items evaluated in a section** | Subtle check icon on the section tab. No blocking behavior. |
| **Odometer zero or negative** | Validation error: "Ingresá un kilometraje válido." |
| **Duplicate photo on same finding** | Allowed. Photos are ordered, duplicates are the inspector's choice. |
| **Template modified after inspection created** | No effect. InspectionDetail holds the frozen template_snapshot. |

---

## Data Flow

### Step 1 → Step 2 (Vehicle)

```
Inspector enters VIN
  → Client validates format (17 chars, no I/O/Q, check digit)
  → Auto-decode via NHTSA API (best effort)
  → Inspector taps "Continuar"
  → Server action: findOrCreateVehicle({ vin, make, model, year, trim, plate })
  → Zod validation (validators.ts)
  → Service: vehicle.findOrCreateVehicle(vin, ...)
    → SELECT * FROM vehicles WHERE vin = ?
    → If found: return existing, update optional fields
    → If not found: INSERT INTO vehicles (...)
  → Return { success: true, data: vehicle }
  → Navigate to Step 2
```

### Step 2 → Step 3 (Event + Findings Creation)

```
Inspector selects metadata, taps "Iniciar Inspección"
  → Server action: createInspection({ vehicleId, nodeId, inspectionType, requestedBy, odometerKm, eventDate })
  → Zod validation
  → Service: inspection.createInspection(...)
    → Generate slug (8 chars, alphanumeric, unique)
    → INSERT INTO events (vehicle_id, node_id, event_type, odometer_km, event_date, status='draft', slug)
    → Snapshot template: SELECT sections FROM inspection_templates WHERE node_id = ?
    → INSERT INTO inspection_details (event_id, template_snapshot, inspection_type, requested_by)
    → For each item in template_snapshot:
      → INSERT INTO inspection_findings (event_id, section_id, item_id, status='not_evaluated')
  → Save full draft to Dexie
  → Return { success: true, data: { event, findings } }
  → Navigate to Step 3
```

### Step 3 (Finding Updates — Auto-Save)

```
Inspector changes status / types observation / captures photo
  → Write to Dexie immediately (debounced for text)
  → Queue sync:
    → Server action: updateFinding({ findingId, status?, observation? })
    → Server action: uploadPhoto({ eventId, findingId?, photoType, blob })
  → If online: sync immediately
  → If offline: queue for later
```

---

## Test Plan

Per `specs/architecture.md §5` — coverage target ≥ 80%.

### Unit Tests

| Target | File | Cases |
|--------|------|-------|
| VIN validation | `lib/vin.ts` | Valid 17-char VIN passes · Invalid length fails · Contains I/O/Q fails · Check digit validation · Non-alphanumeric chars fail · Empty string fails |
| NHTSA decode parsing | `lib/vin.ts` | Successful response extracts make/model/year/trim · Partial response returns available fields · Error response returns null · Timeout handled |
| Vehicle Zod schemas | `validators.ts` | Valid vehicle entry passes · Missing VIN fails · VIN wrong length fails · Invalid plate length fails · Odometer negative fails |
| Inspection metadata Zod schemas | `validators.ts` | Valid metadata passes · Invalid inspection_type fails · Invalid requested_by fails · Missing odometer fails · Invalid date fails |
| Findings Zod schemas | `validators.ts` | Valid finding update passes · Invalid status value fails · Valid status values (good, attention, critical, not_evaluated) pass |

### Integration Tests

| Target | File | Cases |
|--------|------|-------|
| `findOrCreateVehicle` service | `services/vehicle.ts` | Creates new vehicle for unknown VIN · Returns existing vehicle for known VIN · Updates optional fields on existing vehicle · Decode via NHTSA (MSW mocked) success · Decode failure does not block creation |
| `createInspection` service | `services/inspection.ts` | Creates event + detail + findings for valid input · Snapshots current template · Generates unique slug · Sets status to draft · Creates findings for all template items · Rejects if user is not node member |
| `updateDraft` service | `services/inspection.ts` | Updates finding status · Updates finding observation · Rejects update on signed event · Rejects update from non-member |
| `getDraft` service | `services/inspection.ts` | Returns draft with all findings · Returns null for unknown ID · Only returns draft for user's node |
| Server actions | `actions/inspection.ts` | `createInspection` validates input, calls service, returns shape · `updateFinding` validates, returns shape · Authorization failures return error |

### Component Tests

| Component | Cases |
|-----------|-------|
| **VIN entry (Step 1)** | Input renders · Auto-uppercase · Character counter updates · Valid VIN enables Continue · Invalid VIN shows error · Decode success shows vehicle card · Decode failure shows manual fields |
| **Metadata form (Step 2)** | Radio buttons render for type and requestedBy · Default selections (pre_purchase, buyer) · Odometer input accepts numbers · Date defaults to today · Continue creates inspection |
| **Section tabs** | Tabs render from template snapshot · Active tab highlighted · Tap switches section · Scroll behavior · Completed section shows check |
| **Status buttons** | 4 buttons render · Tap selects · Tap selected deselects · Visual state changes (bg, border, text color) · Only one selected at a time |
| **Item card (checklist)** | Renders name + status buttons + textarea + photo row · Status change auto-saves · Observation debounces 500ms · Left border matches status |
| **Item card (free_text)** | Renders name + textarea + photo row · No status buttons · Textarea auto-expands |
| **Photo capture** | Camera button triggers file input · Thumbnail appears after capture · Upload indicator states · Long-press to delete |
| **Bottom bar** | Previous/Next navigate sections · Disabled at boundaries · Camera adds vehicle photo and expands vehicle photos section |
| **Sync indicator** | Shows correct state (saved/syncing/synced/offline) · Transitions between states |
| **Auto-save hooks** | `useAutoSave` debounces text at 500ms · `useDraft` loads from Dexie · `useOfflineStatus` reflects connectivity |

### Offline Tests

| Scenario | Cases |
|----------|-------|
| **Dexie persistence** | Draft saved to IndexedDB · Draft loads on page refresh · Finding updates persist locally · Photo blobs persist |
| **Photo queue** | Photo queued when offline · Upload resumes on reconnect · Failed upload retries with backoff · Queue cleared after successful upload |
| **Sync queue** | Changes queued when offline · Queue processed on reconnect · Order preserved · Failed syncs retried |

---

## Acceptance Criteria

- [ ] Inspector can enter a VIN and decode vehicle info via NHTSA API
- [ ] Invalid VINs are rejected with clear error messages
- [ ] VIN decode failure allows manual vehicle data entry
- [ ] Inspector can select inspection type, requested by, odometer, and date
- [ ] Inspection creation snapshots the current template
- [ ] Findings are pre-created for all template items with default status
- [ ] Field mode renders items grouped by section with scrollable tabs
- [ ] Checklist items show status buttons (good/attention/critical/not_evaluated)
- [ ] Free text items show textarea without status buttons
- [ ] Status button taps save immediately to Dexie
- [ ] Observation text is debounced (500ms) and auto-saved
- [ ] Photos are captured, compressed, and saved locally immediately
- [ ] Photos upload to Cloudinary in background when online
- [ ] Closing browser mid-inspection preserves draft in IndexedDB
- [ ] Reopening the app restores draft from Dexie
- [ ] Offline mode: all interactions work, sync resumes on reconnect
- [ ] Sync indicator reflects current state accurately
- [ ] Navigation: section tabs, bottom bar prev/next, close to dashboard
- [ ] Template changes after inspection creation do not affect the inspection
