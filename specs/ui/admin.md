# UI Spec: Admin Panel

*Screen specification for the platform admin panel — node management, user management, and basic metrics.*
*Derived from: specs/implementation-plan.md (Phase 5D) | specs/ui/design-system.md | specs/entities/node.md | specs/entities/user.md | specs/entities/node-member.md | specs/entities/event.md | specs/entities/review.md | specs/architecture.md*

---

## Overview

Admin panel at `/admin` using **Shell B** (Dashboard). Accessible only to users with `platform_admin` role. Provides CRUD for nodes and users, and a basic metrics dashboard. This is an internal tool — functionality over polish.

---

## Route & Shell

**Route:** `/admin` (with sub-routes `/admin/nodes`, `/admin/users`)
**Shell:** B (Dashboard)

### Shell B Context (Admin Variant)

- **Top bar (64px):** Logo (left) · "Admin" (center) · User menu (right).
- **Content area:** max-width `1024px`, centered. Background `gray-50`.
- **No sidebar.** Tab-based navigation between admin sections.

### Route Protection

- Only users with `role = 'platform_admin'` can access `/admin/*` routes.
- Non-admin authenticated users are redirected to `/dashboard`.
- Unauthenticated users are redirected to `/login`.

---

## Page Layout

The admin panel uses a tab-based navigation at the top of the content area to switch between sections.

```
┌─────────────────────────────────────────────────────────┐
│  VinDex       Admin                         [User ▾]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Métricas]  [Nodos]  [Usuarios]                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │             (Tab content area)                   │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Tab Navigation

| Element | Style | Behavior |
|---------|-------|----------|
| Tab bar | `border-b` `gray-200`, horizontal | Below top bar, full-width within max-width |
| Active tab | `text-sm`, `font-medium`, `brand-primary` text, `brand-primary` bottom border (2px) | Currently selected section |
| Inactive tab | `text-sm`, `font-medium`, `gray-500` text | Tappable — switches section |
| Tabs | — | "Métricas", "Nodos", "Usuarios" |
| Default | "Métricas" selected | Shows metrics on first load |

---

## Tab 1: Métricas (Metrics)

A simple overview of key platform numbers. Read-only dashboard.

```
┌─────────────────────────────────────────────────────┐
│  Métricas de la plataforma                          │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │    3     │  │    5     │  │    48    │          │
│  │  nodos   │  │ usuarios │  │inspeccio-│          │
│  │          │  │          │  │  nes     │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │    32    │  │    12    │  │   78%    │          │
│  │ firmadas │  │ reseñas  │  │coinciden-│          │
│  │          │  │          │  │  cia     │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Metrics Grid

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-5` padding | Full-width within content area |
| Section title | `text-base`, `font-semibold`, `gray-800` | "Métricas de la plataforma" |
| Grid | 3-column grid (mobile: 2-column), `space-4` gap | Stat tiles |

### Metric Tiles

Same visual pattern as inspector profile stats (compact vertical tiles):

| Element | Style | Behavior |
|---------|-------|----------|
| Tile container | `gray-50` bg, `radius-md`, `space-3` padding, text-center | Fixed within grid |
| Value | `text-2xl`, `font-bold`, `gray-800` | The metric number |
| Label | `text-xs`, `gray-500`, `font-medium` | Description below the number |

### Metric Definitions

| Stat | Value | Label | Computation |
|------|-------|-------|-------------|
| Total nodes | Integer | "nodos" | Count of all nodes (all statuses) |
| Total users | Integer | "usuarios" | Count of all users |
| Total inspections | Integer | "inspecciones" | Count of all events (draft + signed) |
| Signed inspections | Integer | "firmadas" | Count of events with `status = 'signed'` |
| Total reviews | Integer | "reseñas" | Count of all reviews |
| Match rate | Percentage | "coincidencia" | `(count of 'yes' reviews / total reviews) × 100`. Displayed as "{n}%". "—" if zero reviews. |

---

## Tab 2: Nodos (Nodes)

CRUD interface for managing inspector nodes.

### Node List View

```
┌─────────────────────────────────────────────────────┐
│  Nodos (3)                       [+ Crear nodo]     │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ ┌──────┐  Taller Martínez         ACTIVO   │    │
│  │ │ LOGO │  taller-martinez                   │    │
│  │ └──────┘  contacto@tallermartinez.com       │    │
│  │           1 miembro · 24 inspecciones       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ ┌──────┐  AutoCheck Buenos Aires   ACTIVO   │    │
│  │ │ LOGO │  autocheck-buenos-aires            │    │
│  │ └──────┘  info@autocheck.com.ar             │    │
│  │           2 miembros · 15 inspecciones      │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ ┌──┐  Inspector Demo           SUSPENDIDO   │    │
│  │ │ID│  inspector-demo                        │    │
│  │ └──┘  demo@vindex.app                       │    │
│  │       1 miembro · 0 inspecciones            │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Section Header

| Element | Style | Behavior |
|---------|-------|----------|
| Title | `text-base`, `font-semibold`, `gray-800` | "Nodos ({count})" |
| Create button | Primary button, `text-sm` | "+ Crear nodo" — opens create form |

#### Node Card

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-4` padding | Tappable — opens edit view |
| Logo | 40x40, `radius-md`, `border-default` | Node logo via Cloudinary. Fallback: initial letter avatar |
| Display name | `text-base`, `font-medium`, `gray-800` | Right of logo |
| Status badge | `text-xs`, `font-medium`, `radius-full`, `padding` 2px 10px | Right-aligned |
| Active badge | `status-good` text, `status-good-bg` bg | "ACTIVO" |
| Suspended badge | `status-critical` text, `status-critical-bg` bg | "SUSPENDIDO" |
| Slug | `text-xs`, `gray-500`, `font-mono` | Below display name |
| Email | `text-xs`, `gray-500` | Below slug |
| Stats | `text-xs`, `gray-500` | "{n} miembro(s) · {n} inspecciones" |

#### Node Card Tap Behavior

Tapping a node card opens the edit view (inline or slide-over) for that node.

### Node Create / Edit Form

The form is shown when tapping "+ Crear nodo" or tapping an existing node card. Displayed as a full-width section replacing the list, with a "← Volver a nodos" back link.

```
┌─────────────────────────────────────────────────────┐
│  ← Volver a nodos                                   │
│                                                     │
│  Crear nodo / Editar nodo                           │
│                                                     │
│  Nombre *                                           │
│  ┌─────────────────────────────────────────────┐    │
│  │ Taller Martínez                              │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Tipo                                               │
│  ┌─────────────────────────────────────────────┐    │
│  │ Inspector                              ▾    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Email de contacto *                                │
│  ┌─────────────────────────────────────────────┐    │
│  │ contacto@tallermartinez.com                  │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Teléfono                                           │
│  ┌─────────────────────────────────────────────┐    │
│  │ +54 11 4555-1234                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Dirección                                          │
│  ┌─────────────────────────────────────────────┐    │
│  │ Av. Corrientes 4500, CABA                    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Bio                                                │
│  ┌─────────────────────────────────────────────┐    │
│  │ Mecánico especializado en pre-compra...      │    │
│  │                                              │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Color de marca                                     │
│  ┌───────┐                                          │
│  │#2563EB│                                          │
│  └───────┘                                          │
│                                                     │
│  Logo                                               │
│  ┌─────────────────────────────────────────────┐    │
│  │  [Subir logo]  logo-actual.png              │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Estado (solo edición)                              │
│  ┌─────────────────────────────────────────────┐    │
│  │ Activo                                 ▾    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Slug (solo lectura, generado automáticamente)      │
│  taller-martinez                                    │
│                                                     │
│  [          Guardar          ]                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Form Fields

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| Nombre | Text input | Yes | max 255 chars | `display_name` |
| Tipo | Select | Yes | `inspector` (only option in Phase 1) | `type` |
| Email de contacto | Email input | Yes | valid email, max 255 chars | `contact_email` |
| Teléfono | Text input | No | max 50 chars | `contact_phone` |
| Dirección | Text input | No | max 500 chars | `address` |
| Bio | Textarea | No | max 1000 chars | `bio` |
| Color de marca | Color input | No | hex format `#RRGGBB` | `brand_color` |
| Logo | File upload | No | image (png, jpg, webp), max 2MB | Uploads to Cloudinary → `logo_url` |
| Estado | Select | No | `active` / `suspended` | Only shown in edit mode. Not on create. |

#### Slug Generation

- On create: slug is auto-generated from `display_name` (kebab-case, deduplicated with numeric suffix if needed).
- Displayed as read-only text below the form in edit mode.
- Not editable by the admin.

#### Form Behavior

| Action | Behavior |
|--------|----------|
| Submit (create) | Validates fields → calls `createNodeAction` → on success: redirects to node list with success toast → on error: inline validation errors |
| Submit (edit) | Validates fields → calls `updateNodeAction` → on success: stays on edit form with success toast → on error: inline validation errors |
| Cancel / Back | "← Volver a nodos" navigates back to node list |
| Logo upload | Opens file picker → compresses image → uploads to Cloudinary → displays thumbnail preview |

#### Form Validation (Client-Side)

| Field | Validation | Error Message |
|-------|-----------|---------------|
| Nombre | Required, max 255 | "El nombre es obligatorio." / "El nombre no puede superar los 255 caracteres." |
| Email de contacto | Required, valid email | "El email es obligatorio." / "Ingresá un email válido." |
| Teléfono | max 50 | "El teléfono no puede superar los 50 caracteres." |
| Color de marca | hex format | "Ingresá un color hexadecimal válido (ej: #3B82F6)." |
| Logo | image type, max 2MB | "El logo debe ser una imagen (PNG, JPG, WEBP)." / "El logo no puede superar los 2MB." |

---

## Tab 3: Usuarios (Users)

CRUD interface for managing platform users.

### User List View

```
┌─────────────────────────────────────────────────────┐
│  Usuarios (5)                    [+ Crear usuario]  │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Carlos Martínez                      USER   │    │
│  │ carlos@tallermartinez.com                    │    │
│  │ Nodo: Taller Martínez                        │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Admin VinDex                          ADMIN  │    │
│  │ admin@vindex.app                             │    │
│  │ Sin nodo asignado                            │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ María López                           USER   │    │
│  │ maria@autocheck.com.ar                       │    │
│  │ Nodo: AutoCheck Buenos Aires                  │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Section Header

| Element | Style | Behavior |
|---------|-------|----------|
| Title | `text-base`, `font-semibold`, `gray-800` | "Usuarios ({count})" |
| Create button | Primary button, `text-sm` | "+ Crear usuario" — opens create form |

#### User Card

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-3` padding | Tappable — opens edit view |
| Display name | `text-sm`, `font-medium`, `gray-800` | Left-aligned |
| Role badge | `text-xs`, `font-medium`, `radius-full`, `padding` 2px 10px | Right-aligned |
| User badge | `gray-100` bg, `gray-600` text | "USER" |
| Admin badge | `brand-primary` bg (light), `brand-primary` text | "ADMIN" |
| Email | `text-xs`, `gray-500` | Below name |
| Node assignment | `text-xs`, `gray-500` | "Nodo: {node_display_name}" or "Sin nodo asignado" |

### User Create / Edit Form

Displayed as a full-width section replacing the list, with a "← Volver a usuarios" back link.

```
┌─────────────────────────────────────────────────────┐
│  ← Volver a usuarios                                │
│                                                     │
│  Crear usuario / Editar usuario                     │
│                                                     │
│  Nombre *                                           │
│  ┌─────────────────────────────────────────────┐    │
│  │ Carlos Martínez                              │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Email *                                            │
│  ┌─────────────────────────────────────────────┐    │
│  │ carlos@tallermartinez.com                    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Contraseña * (solo creación)                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ ••••••••                                     │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Rol *                                              │
│  ┌─────────────────────────────────────────────┐    │
│  │ Usuario                                ▾    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Nodo asignado                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ Taller Martínez                        ▾    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [          Guardar          ]                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Form Fields

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| Nombre | Text input | Yes | max 255 chars | `display_name` |
| Email | Email input | Yes | valid email, unique, max 255 chars | `email` |
| Contraseña | Password input | Yes (create only) | min 8 chars | Only on create. Hashed with bcrypt before storage. Not shown on edit. |
| Rol | Select | Yes | `user` / `platform_admin` | `role` |
| Nodo asignado | Select | No | Dropdown of all active nodes | Creates/updates a NodeMember record. "Sin nodo" option clears assignment. |

#### Node Assignment Behavior

- When a node is selected, a NodeMember record is created (or updated) linking the user to that node with `role = 'member'` and `status = 'active'`.
- When "Sin nodo" is selected, any existing active NodeMember for this user is set to `status = 'inactive'`.
- On create: if a node is selected, the NodeMember is created in the same transaction.
- On edit: changing the node assignment deactivates the old membership and creates a new one.
- A user can only be assigned to one node via this admin UI (Phase 1 simplification). The data model supports multiple, but the UI shows a single dropdown.

#### Form Behavior

| Action | Behavior |
|--------|----------|
| Submit (create) | Validates fields → calls `createUserAction` → on success: redirects to user list with success toast → on error: inline validation errors |
| Submit (edit) | Validates fields → calls `updateUserAction` → on success: stays on edit form with success toast → on error: inline validation errors |
| Cancel / Back | "← Volver a usuarios" navigates back to user list |

#### Form Validation (Client-Side)

| Field | Validation | Error Message |
|-------|-----------|---------------|
| Nombre | Required, max 255 | "El nombre es obligatorio." / "El nombre no puede superar los 255 caracteres." |
| Email | Required, valid email | "El email es obligatorio." / "Ingresá un email válido." |
| Contraseña | Required (create), min 8 | "La contraseña es obligatoria." / "La contraseña debe tener al menos 8 caracteres." |
| Rol | Required | "El rol es obligatorio." |
| Email uniqueness | Server-side | "Ya existe un usuario con este email." |

---

## Mobile Layout (< 640px)

1. **Content:** full-width, no horizontal page padding. Cards have internal `space-4` padding.
2. **Tab bar:** horizontal scroll if tabs overflow. Active tab underline visible.
3. **Metrics grid:** 2-column grid. Third tile wraps to second row.
4. **Node cards:** full-width. Logo (32x32) + name stacked or side-by-side.
5. **User cards:** full-width.
6. **Create/edit forms:** full-width, single column. All fields full-width.
7. **Back link:** sticky at top or inline above form.

### Mobile Layout

```
┌─────────────────────────────────────────┐
│  VinDex       Admin           [User ▾]  │
├─────────────────────────────────────────┤
│  [Métricas] [Nodos] [Usuarios]          │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Métricas de la plataforma     │    │
│  │  ┌──────────┐ ┌──────────┐     │    │
│  │  │    3     │ │    5     │     │    │
│  │  │  nodos   │ │ usuarios │     │    │
│  │  └──────────┘ └──────────┘     │    │
│  │  ┌──────────┐ ┌──────────┐     │    │
│  │  │    48    │ │    32    │     │    │
│  │  │inspeccio-│ │ firmadas │     │    │
│  │  │  nes     │ │          │     │    │
│  │  └──────────┘ └──────────┘     │    │
│  │  ┌──────────┐ ┌──────────┐     │    │
│  │  │    12    │ │   78%    │     │    │
│  │  │ reseñas  │ │coinciden-│     │    │
│  │  │          │ │  cia     │     │    │
│  │  └──────────┘ └──────────┘     │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

---

## Desktop Layout (> 1024px)

- Content centered, max-width `1024px`.
- Metrics grid: 3-column first row, 3-column second row.
- Node cards: full-width within content area, `space-4` gap.
- User cards: full-width within content area, `space-3` gap.
- Forms: max-width `640px`, centered.
- Cards have `space-5` internal padding.

---

## States

### 1. Loading

- Shell B with tab bar visible (tabs disabled during loading).
- Skeleton placeholders per active tab:
  - Metrics: 6 tile skeletons (100px × 80px) in grid.
  - Nodes: 3 card skeletons with pulse animation.
  - Users: 3 card skeletons with pulse animation.

### 2. Metrics — Default

- All 6 metrics displayed with current values.
- No interactivity beyond viewing.

### 3. Node List — With Nodes

- Node cards listed, sorted by `display_name` alphabetically.
- Create button visible.

### 4. Node List — Empty

- "No hay nodos registrados." message with "+ Crear nodo" CTA below.

### 5. User List — With Users

- User cards listed, sorted by `display_name` alphabetically.
- Create button visible.

### 6. User List — Empty

- "No hay usuarios registrados." message with "+ Crear usuario" CTA below.

### 7. Form — Validation Errors

- Invalid fields highlighted with `error` border color.
- Error message below each invalid field in `text-xs`, `error` color.

### 8. Form — Saving

- Submit button shows loading state: spinner + "Guardando..." text, button disabled.
- All form fields disabled during save.

### 9. Form — Success

- Toast notification: "Nodo creado exitosamente." / "Usuario creado exitosamente." / "Cambios guardados."
- On create: redirect to list view.
- On edit: stay on form.

### 10. Error State

- Full-tab error within Shell B.
- Icon: warning triangle, 48x48, `error` color.
- Message: `text-base`, `gray-700` — "Error al cargar datos."
- Retry button: Secondary button — "Reintentar".

---

## Server Actions

### Node Actions

**Location:** `src/lib/actions/node.ts` (new file)

#### `createNodeAction`

```typescript
// Input
{
  displayName: string,
  type: 'inspector',
  contactEmail: string,
  contactPhone?: string,
  address?: string,
  bio?: string,
  brandColor?: string,
  logoUrl?: string
}

// Return
{ success: true, data: { node: Node } }
{ success: false, error: string }
```

#### `updateNodeAction`

```typescript
// Input
{
  nodeId: string,
  displayName?: string,
  contactEmail?: string,
  contactPhone?: string,
  address?: string,
  bio?: string,
  brandColor?: string,
  logoUrl?: string,
  status?: 'active' | 'suspended'
}

// Return
{ success: true, data: { node: Node } }
{ success: false, error: string }
```

### User Actions

**Location:** `src/lib/actions/user.ts` (new file)

#### `createUserAction`

```typescript
// Input
{
  displayName: string,
  email: string,
  password: string,
  role: 'user' | 'platform_admin',
  nodeId?: string  // optional — creates NodeMember if provided
}

// Return
{ success: true, data: { user: User } }
{ success: false, error: string }
```

#### `updateUserAction`

```typescript
// Input
{
  userId: string,
  displayName?: string,
  email?: string,
  role?: 'user' | 'platform_admin',
  nodeId?: string | null  // null to clear assignment
}

// Return
{ success: true, data: { user: User } }
{ success: false, error: string }
```

### Metrics

No dedicated action. Metrics are fetched server-side in the page component via service functions.

---

## Service Functions

### Node Service Extensions

**Location:** `src/lib/services/node.ts`

```typescript
async function createNode(data: CreateNodeInput): Promise<Node>
async function updateNode(nodeId: string, data: UpdateNodeInput): Promise<Node>
async function listNodes(): Promise<NodeWithStats[]>
```

`NodeWithStats` includes `memberCount` and `inspectionCount` computed at query time.

### User Service

**Location:** `src/lib/services/user.ts` (new file or extend existing)

```typescript
async function createUser(data: CreateUserInput): Promise<User>
async function updateUser(userId: string, data: UpdateUserInput): Promise<User>
async function listUsers(): Promise<UserWithNode[]>
```

`UserWithNode` includes `nodeName` joined from NodeMember + Node.

### Metrics Service

**Location:** `src/lib/services/admin.ts` (new file)

```typescript
async function getPlatformMetrics(): Promise<{
  totalNodes: number;
  totalUsers: number;
  totalInspections: number;
  signedInspections: number;
  totalReviews: number;
  matchRate: number | null;  // null if zero reviews
}>
```

---

## Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| Button (Primary) | shadcn/ui `Button` | Create buttons, submit buttons |
| Button (Ghost) | shadcn/ui `Button variant="ghost"` | Back links |
| Card | shadcn/ui `Card` | Metric cards, node cards, user cards |
| Input | shadcn/ui `Input` | Text inputs, email inputs |
| Textarea | shadcn/ui `Textarea` | Bio field |
| Select | shadcn/ui `Select` | Type, role, status, node assignment dropdowns |
| Badge | shadcn/ui `Badge` | Status badges, role badges |
| Tabs | shadcn/ui `Tabs` | Admin section navigation |
| Skeleton | shadcn/ui `Skeleton` | Loading states |
| Toast | shadcn/ui `Sonner` / toast | Success/error feedback |
| Avatar | shadcn/ui `Avatar` | Node logo with fallback |

---

## Design Tokens Reference

From `specs/ui/design-system.md`:

- **Colors:** `brand-primary`, `brand-accent`, `gray-50` through `gray-800`, `status-good`, `status-good-bg`, `status-critical`, `status-critical-bg`, `error`, `success`
- **Typography:** `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px)
- **Spacing:** `space-1` (4px) through `space-12` (48px)
- **Borders:** `border-default` (1px solid gray-200)
- **Radius:** `radius-sm` (6px), `radius-md` (8px), `radius-full` (9999px)
- **Shadows:** `shadow-sm` (cards)
- **Touch targets:** 48x48px minimum interactive

---

## Interaction Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Switch tab | Tap tab label | Content area switches to selected section |
| Create node | Tap "+ Crear nodo" | Shows node create form |
| Edit node | Tap node card | Shows node edit form |
| Save node | Tap "Guardar" on node form | Validates + saves + toast |
| Back to nodes | Tap "← Volver a nodos" | Returns to node list |
| Create user | Tap "+ Crear usuario" | Shows user create form |
| Edit user | Tap user card | Shows user edit form |
| Save user | Tap "Guardar" on user form | Validates + saves + toast |
| Back to users | Tap "← Volver a usuarios" | Returns to user list |
| Upload logo | Tap "Subir logo" on node form | Opens file picker → uploads → shows preview |

---

## Test Plan

Per `specs/architecture.md §5` — all component tests use React Testing Library.

| Component / State | Test Cases |
|-------------------|------------|
| **Route protection** | Non-admin user redirected to `/dashboard` · Unauthenticated user redirected to `/login` · Admin user can access `/admin` |
| **Tab navigation** | Three tabs render ("Métricas", "Nodos", "Usuarios") · Clicking tab switches content · Default tab is "Métricas" · Active tab has visual indicator |
| **Metrics tab** | All 6 metrics render with correct values · Match rate shows "—" when zero reviews · Loading skeletons render during fetch |
| **Node list** | Renders all nodes with name, slug, email, status badge, member count, inspection count · Sorted alphabetically · "Crear nodo" button navigates to form · Tapping card opens edit form · Empty state shown when no nodes |
| **Node create form** | All fields render · Required field validation (name, email) · Submit creates node and shows success toast · Slug generated and displayed after creation · Logo upload works |
| **Node edit form** | Pre-populates with node data · Status field visible (not on create) · Submit updates node · Back link returns to list |
| **Node status** | Active badge renders green · Suspended badge renders red |
| **User list** | Renders all users with name, email, role badge, node assignment · Sorted alphabetically · "Crear usuario" button navigates to form · Tapping card opens edit form · Empty state shown when no users |
| **User create form** | All fields render · Required field validation (name, email, password, role) · Password field visible on create only · Node dropdown lists active nodes · Submit creates user and NodeMember · Success toast |
| **User edit form** | Pre-populates with user data · Password field hidden · Node dropdown shows current assignment · Changing node updates NodeMember · Back link returns to list |
| **User role badges** | USER badge renders gray · ADMIN badge renders brand-primary |
| **Form validation** | Required fields show error on empty submit · Email format validated · Password min length enforced · Inline error messages displayed |
| **Form saving state** | Submit button shows loading spinner · Fields disabled during save · On error: fields re-enabled, error shown |
| **Error state** | Error message shown with retry button · Retry triggers data reload |
| **Mobile layout** | Metrics grid 2-column · Cards full-width · Forms full-width |

---

## Accessibility

- All form inputs have associated `<label>` elements.
- Required fields marked with `aria-required="true"` and visual asterisk.
- Validation errors linked to inputs via `aria-describedby`.
- Tab navigation uses `role="tablist"` with individual `role="tab"` and `aria-selected`.
- Tab panels use `role="tabpanel"` with `aria-labelledby`.
- Status badges have `aria-label` (e.g., "Estado: Activo").
- Role badges have `aria-label` (e.g., "Rol: Administrador").
- Node assignment "Sin nodo" option has `aria-label`: "Sin nodo asignado".
- Create/edit forms have `aria-label` on the form element (e.g., "Formulario de creación de nodo").
- Toast notifications use `role="status"` for screen reader announcement.
- All interactive elements meet 48x48px minimum touch targets on mobile.
- Keyboard navigation: Tab through form fields, Enter to submit, Escape to cancel/close.
