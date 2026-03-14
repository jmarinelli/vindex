# UI Spec: Landing Page

*Screen specification for the public landing page — value proposition and inspector lead capture.*
*Derived from: specs/implementation-plan.md (Phase 5C) | specs/ui/design-system.md*

---

## Overview

Single page at `/` using **Shell A** (Public) with modifications for the landing context: no minimal top bar — instead, a custom navigation header with logo, anchor links, and login CTA. The page communicates VinDex's vision and value proposition to two audiences (buyers and inspectors) and captures inspector leads via a contact form.

The landing page is structured around the platform's core narrative: the secondary vehicle market suffers from an information asymmetry problem, and VinDex solves it by building documented vehicle identity from the source — the professionals who see the vehicle directly. The page leads with the problem, introduces the solution conceptually, shows how it works, and then presents value propositions to each audience.

---

## Route & Shell

**Route:** `/`
**Shell:** A (Public) — modified header

### Shell A Context (Modified)

- **Header:** Full-width, sticky. VinDex logo (left, links to top of page via `#`), anchor links (center: "Cómo funciona", "Para compradores", "Para inspectores"), Login button (right, secondary style). Background transitions from transparent to `white` with `shadow-sm` on scroll (> 56px).
- **Content area:** full-width (no max-width constraint — hero and sections span the viewport). Inner content areas use max-width `1024px`, centered.
- **Footer:** Full-width, `brand-primary` bg, `white` text.

---

## Page Layout

```
┌──────────────────────────────────────────────────────────┐
│  VinDex    Cómo funciona · Compradores · Inspectores  Login │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              HERO SECTION                                │
│                                                          │
│   El historial que cada auto debería tener.             │
│                                                          │
│   VinDex construye identidad vehicular documentada      │
│   — un servicio profesional a la vez.                   │
│                                                          │
│   [ Cómo funciona ]  [ ¿Sos inspector? Contactanos ]   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              LA IDEA                                     │
│                                                          │
│   Hoy, comprar un usado es un acto de fe                │
│                                                          │
│   No hay forma confiable de saber qué le hicieron       │
│   al auto que estás viendo. VinDex cambia eso:          │
│   documenta desde la fuente, con quienes lo ven         │
│   y trabajan en él directamente.                        │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              CÓMO FUNCIONA                               │
│                                                          │
│   ①                 ②                ③                ④  │
│   Un profesional    El resultado     El cliente       El vehículo │
│   evalúa el         queda sellado    recibe un        acumula su  │
│   vehículo          al VIN           informe          historia    │
│                                      profesional                  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              PARA COMPRADORES                            │
│                                                          │
│   Confianza con evidencia                                │
│                                                          │
│   🔍 Consultá el     🔒 Inmutable      🔎 Transparencia │
│      historial          por diseño        total          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              PARA INSPECTORES                            │
│                                                          │
│   Tu herramienta, tu marca, tu historial                │
│                                                          │
│   📱 Una herramienta 📋 Tu marca,     ⭐ Reputación    │
│      superior           no la nuestra     que se acumula │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              UN VIN, TODA SU VIDA DOCUMENTADA            │
│                                                          │
│   Inspecciones, servicios y reparaciones se anclan      │
│   al VIN. Con el tiempo, se construye un registro       │
│   profesional que habla por sí solo.                    │
│                                                          │
│   ┌────────────────────────────────────────────┐        │
│   │  Mar 2026  Inspección pre-compra  78.400km │        │
│   │  Sep 2026  Cambio de aceite       87.000km │        │
│   │  Dic 2026  Alineación y balanceo  93.200km │        │
│   │  Mar 2027  Inspección periódica  104.800km │        │
│   └────────────────────────────────────────────┘        │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              ¿SOS INSPECTOR?                             │
│                                                          │
│   Contactanos para empezar                               │
│                                                          │
│   ┌────────────────────────────────────────────┐        │
│   │  Nombre                                    │        │
│   │  Email                                     │        │
│   │  Teléfono (opcional)                       │        │
│   │  Mensaje                                   │        │
│   │                                            │        │
│   │          [ Enviar mensaje ]                │        │
│   └────────────────────────────────────────────┘        │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  VinDex · Privacidad · Términos · contacto@vindex.app    │
│  © 2026 VinDex. Todos los derechos reservados.           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Navigation Header

Sticky header at the top of the page. Transitions from transparent (overlaying hero) to solid white with shadow on scroll.

| Element | Style | Behavior |
|---------|-------|----------|
| Container | Full-width, 64px height, `padding` 0 24px, fixed top, z-50 | Transparent initially. After scrolling 56px: `white` bg, `shadow-sm`, transition 200ms. |
| Logo | `Logo/Principal` component, links to `#` (scroll to top) | Left-aligned |
| Nav links | `text-sm`, `font-medium`, `gray-700` (on transparent: `white`), `space-6` gap | Center. Hidden on mobile (< 640px). Smooth-scroll to section anchors. |
| Nav items | — | "Cómo funciona" (#como-funciona), "Para compradores" (#compradores), "Para inspectores" (#inspectores) |
| Login button | `Button/Secondary` variant, `text-sm` | Right-aligned. Navigates to `/login`. |
| Mobile menu | Hamburger icon (24x24), `gray-700` | Visible < 640px. Opens full-screen overlay with nav links + login button stacked vertically. |

### Mobile Menu Overlay

| Element | Style | Behavior |
|---------|-------|----------|
| Overlay | Full-screen, `white` bg, z-50, padding `space-8` top | Covers page |
| Close button | ✕ icon, 24x24, top-right, 48px touch target | Closes overlay |
| Nav links | `text-xl`, `font-medium`, `gray-800`, `space-6` vertical gap | Stacked vertically. Tap scrolls to section and closes overlay. |
| Login button | Full-width primary button | Bottom of link list |

---

## Hero Section

The first fold. Leads with the market problem, then positions VinDex as the solution. The tone is direct and confident — no buzzwords, no "revolutionary."

| Element | Style | Behavior |
|---------|-------|----------|
| Container | Full-width, min-height `80vh` (mobile: `70vh`), `brand-primary` bg, centered content | Background: gradient from `brand-primary` to `#0F172A` (darker shade) |
| Inner container | max-width `768px`, centered, text-center, `space-12` vertical padding | Content constraint |
| Tagline | `text-3xl` (mobile) / 48px (desktop), `font-bold`, `white`, max-width `600px` | "El historial que cada auto debería tener." |
| Subheading | `text-lg`, `gray-300` (on dark bg), max-width `500px`, `space-4` below tagline | "VinDex construye identidad vehicular documentada — un servicio profesional a la vez." |
| CTA row | Horizontal, `space-4` gap, `space-8` below subheading | Two buttons side by side (stacked on mobile) |
| Primary CTA | `Button/Primary` with `brand-accent` bg, `white` text, lg size (48px), `radius-sm` | "Cómo funciona" → smooth-scroll to `#como-funciona` |
| Secondary CTA | White outline button, `white` text, lg size (48px), `radius-sm`, 1px `white` border | "¿Sos inspector? Contactanos" → smooth-scroll to `#contacto` |
| Trust indicator | `text-xs`, `gray-400`, `space-10` below CTAs | "Identidad vehicular documentada · Inmutable · Profesional" |

---

## The Idea Section (NEW)

A brief editorial section that explains the core insight — why vehicle information is broken and how VinDex approaches the problem. This section sets up the "how it works" section by establishing the problem first.

| Element | Style | Behavior |
|---------|-------|----------|
| Section container | `white` bg, `space-16` vertical padding, id="la-idea" | No anchor in nav — this section flows naturally from the hero |
| Inner container | max-width `640px`, centered, text-center | Narrower than other sections for editorial feel |
| Statement | `text-2xl` (mobile) / `text-3xl` (desktop), `font-bold`, `gray-800`, `leading-snug` | "Hoy, comprar un usado es un acto de fe" |
| Body text | `text-base`, `gray-500`, `leading-relaxed`, `space-6` below statement | "No hay forma confiable de saber qué le hicieron al auto que estás viendo. VinDex cambia eso: documenta desde la fuente, con quienes lo ven y trabajan en él directamente." |

**Design note:** This section is intentionally brief — two lines that set up the problem and the approach. The narrower max-width creates a reading column that feels more like a statement than a marketing section.

---

## How It Works Section

Four-step visual explanation of the platform flow. The fourth step introduces the vehicle identity accumulation concept — bridging the functional tool to the bigger vision.

| Element | Style | Behavior |
|---------|-------|----------|
| Section container | `gray-50` bg, `space-12` vertical padding, id="como-funciona" | Anchor target |
| Inner container | max-width `1024px`, centered |  |
| Section title | `text-2xl`, `font-bold`, `gray-800`, text-center | "Cómo funciona" |
| Steps row | 4-column grid (desktop), stacked vertically (mobile), `space-8` gap, `space-10` below title | Each step is a card-like element |

### Step Card

| Element | Style | Behavior |
|---------|-------|----------|
| Container | text-center, `space-6` padding | No border — clean, airy |
| Step number | 48x48, `brand-accent` bg, `white` text, `font-bold`, `text-xl`, `radius-full` | Circle with number (1, 2, 3, 4) |
| Icon | 40x40, `gray-600`, Lucide icon, `space-3` below number | See Step Content below |
| Title | `text-lg`, `font-medium`, `gray-800`, `space-2` below icon | Step title |
| Description | `text-sm`, `gray-500`, max-width `240px`, centered | Step description |

### Step Content

| Step | Icon | Title | Description |
|------|------|-------|-------------|
| 1 | `clipboard-check` | "Un profesional evalúa el vehículo" | "Un inspector o taller registrado evalúa el vehículo y documenta su estado real, punto por punto." |
| 2 | `stamp` | "El resultado queda sellado al VIN" | "Firmado digitalmente, inmutable, anclado a la identidad del vehículo para siempre." |
| 3 | `file-check` | "El cliente recibe un informe profesional" | "Un link con preview visual, listo para compartir en publicaciones o por WhatsApp." |
| 4 | `layers` | "El vehículo acumula su historia" | "Cada servicio profesional se ancla al VIN. Cuando alguien quiera saber qué pasó con ese auto, la información va a estar." |

### Connecting Line (Desktop Only)

Between step cards, a thin dashed line (`1px`, `gray-200`) connects the step circles horizontally, visually indicating progression. Hidden on mobile.

---

## Buyers Section

Value proposition for buyers — the primary audience for public reports.

| Element | Style | Behavior |
|---------|-------|----------|
| Section container | `white` bg, `space-12` vertical padding, id="compradores" | Anchor target |
| Inner container | max-width `1024px`, centered |  |
| Section title | `text-2xl`, `font-bold`, `gray-800`, text-center | "Confianza con evidencia" |
| Subtitle | `text-base`, `gray-500`, text-center, `space-2` below title | "Consultá el historial documentado de un vehículo antes de tomar una decisión." |
| Features grid | 3-column grid (desktop), stacked (mobile), `space-6` gap, `space-10` below subtitle | Feature cards |

### Buyer Feature Card

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `gray-50` bg, `radius-md`, `space-5` padding, text-center | Subtle, flat style |
| Icon | 40x40, `brand-accent` color, Lucide icon | Visual identifier |
| Title | `text-base`, `font-medium`, `gray-800`, `space-3` below icon | Feature title |
| Description | `text-sm`, `gray-500` | Feature description |

### Buyer Features

| Icon | Title | Description |
|------|-------|-------------|
| `search` | "Consultá el historial" | "Accedé a todo lo documentado sobre un vehículo por su VIN. Cada inspección y servicio registrado, en un solo lugar." |
| `shield-check` | "Inmutable por diseño" | "Una vez firmado, nadie puede alterar lo que el profesional encontró. Lo que ves es lo que se documentó." |
| `eye` | "Transparencia total" | "Sabé quién pidió la inspección, quién la hizo, cuándo, y a qué kilometraje. Sin zonas grises." |

---

## Inspectors Section

Value proposition for inspectors — the users who will register.

| Element | Style | Behavior |
|---------|-------|----------|
| Section container | `gray-50` bg, `space-12` vertical padding, id="inspectores" | Anchor target |
| Inner container | max-width `1024px`, centered |  |
| Section title | `text-2xl`, `font-bold`, `gray-800`, text-center | "Tu herramienta, tu marca, tu historial" |
| Subtitle | `text-base`, `gray-500`, text-center, `space-2` below title | "Todo lo que necesitás para ofrecer inspecciones profesionales." |
| Features grid | 3-column grid (desktop), stacked (mobile), `space-6` gap, `space-10` below subtitle | Feature cards |

### Inspector Feature Card

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `white` bg, `radius-md`, `shadow-sm`, `space-5` padding, text-center | Elevated style |
| Icon | 40x40, `brand-accent` color, Lucide icon | Visual identifier |
| Title | `text-base`, `font-medium`, `gray-800`, `space-3` below icon | Feature title |
| Description | `text-sm`, `gray-500` | Feature description |

### Inspector Features

| Icon | Title | Description |
|------|-------|-------------|
| `smartphone` | "Una herramienta superior" | "Formularios estructurados, fotos integradas, funciona offline. Más rápido y profesional que tu método actual." |
| `palette` | "Tu marca, no la nuestra" | "Reportes white-label con tu identidad prominente. La plataforma es infraestructura invisible." |
| `trending-up` | "Reputación que se acumula" | "Cada inspección construye tu perfil profesional: cantidad de inspecciones, nivel de detalle, reseñas de compradores." |

---

## Vehicle Timeline Section (NEW)

A vision section that plants the seed of vehicle identity as an accumulating asset. Uses a visual timeline to show how a VIN builds documented history over time — mixing inspection events with workshop services to hint at the broader platform direction.

| Element | Style | Behavior |
|---------|-------|----------|
| Section container | `brand-primary` bg, `space-16` vertical padding, id="historial" | Dark section for visual contrast and gravitas |
| Inner container | max-width `768px`, centered, text-center | Narrower, focused |
| Section title | `text-2xl` (mobile) / `text-3xl` (desktop), `font-bold`, `white` | "Un VIN, toda su vida documentada" |
| Body text | `text-base`, `gray-400` (on dark bg), `leading-relaxed`, `space-4` below title, max-width `560px`, centered | "Inspecciones, servicios y reparaciones se anclan al VIN. Con el tiempo, se construye un registro profesional que habla por sí solo." |
| Timeline container | `space-10` below body text, left-aligned within centered container, max-width `520px` | Visual timeline |

### Timeline Design

The timeline is a vertical list of events with a continuous left-edge line connecting them. Each event shows date, description, odometer, and professional name.

| Element | Style |
|---------|-------|
| Timeline line | 2px solid, `white/20` opacity, positioned on the left edge |
| Event dot | 10px circle, `brand-accent` fill, centered on the timeline line |
| Event row | Horizontal layout: dot + content, `space-8` vertical gap between events |
| Event date | `text-sm`, `gray-400`, `font-medium` |
| Event description | `text-base`, `white`, `font-medium` |
| Event meta | `text-sm`, `gray-400` — odometer + professional name, separated by `·` |

### Timeline Events

| Date | Description | Odometer | Professional |
|------|-------------|----------|-------------|
| Mar 2026 | Inspección pre-compra | 78.400 km | Insp. Martínez |
| Sep 2026 | Cambio de aceite y filtros | 87.000 km | Taller López |
| Dic 2026 | Alineación y balanceo | 93.200 km | Taller López |
| Mar 2027 | Inspección periódica | 104.800 km | Insp. Martínez |

**Design note:** The mix of inspection events and workshop services is intentional — it hints at the broader platform direction without explicitly promising workshop features. The ascending odometer readings subtly communicate continuity and coherence. The dark background differentiates this section from the functional sections above and gives it a more aspirational, vision-oriented feel.

---

## Contact Section (Inspector CTA)

Lead capture form for inspectors interested in using VinDex.

| Element | Style | Behavior |
|---------|-------|----------|
| Section container | `gray-50` bg, `space-12` vertical padding, id="contacto" | Anchor target |
| Inner container | max-width `560px`, centered |  |
| Section title | `text-2xl`, `font-bold`, `gray-800`, text-center | "¿Sos inspector?" |
| Subtitle | `text-base`, `gray-500`, text-center, `space-2` below title | "Contactanos para empezar a usar VinDex." |
| Form container | `white` bg, `radius-md`, `shadow-sm`, `space-6` padding, `space-8` below subtitle | Centered form |

### Form Fields

| Field | Type | Validation | Placeholder |
|-------|------|------------|-------------|
| Nombre | Text input | Required, min 2 chars | "Tu nombre" |
| Email | Email input | Required, valid email format | "tu@email.com" |
| Teléfono | Tel input | Optional | "+54 11 1234-5678" |
| Mensaje | Textarea (3 rows, auto-expanding) | Required, min 10 chars, max 500 chars | "Contanos sobre tu taller o servicio de inspección..." |

### Form Inputs Style

All inputs use the `FormInput` component from the design system:

| Element | Style | Behavior |
|---------|-------|----------|
| Label | `text-sm`, `font-medium`, `gray-700` | Above input, `space-1` gap |
| Input | 40px height, `text-base` (16px — prevents iOS zoom), `radius-sm`, `border-default`, `border-focus` on focus | Standard form input style |
| Textarea | Auto-expanding, min 3 rows, same border/focus style | For message field |
| Error text | `text-xs`, `error` color, `space-1` below input | Shown on validation failure |
| Field spacing | `space-4` gap between fields | Consistent vertical rhythm |

### Submit Button

| Element | Style | Behavior |
|---------|-------|----------|
| Button | Full-width `Button/Primary`, lg size (48px) | "Enviar mensaje" |
| Loading state | Button disabled, spinner icon replaces text | "Enviando..." |
| Success state | Button turns `success` bg, check icon | "¡Mensaje enviado!" — persists 3s, then form resets |
| Error state | Toast notification, `error` variant | "Error al enviar. Intentá de nuevo." |

### Form Submission

The form submits via a server action. In MVP, the action sends an email to a configured address (e.g., `contacto@vindex.app`) using a transactional email service or stores the lead in the database for later review.

---

## Footer

Full-width footer with platform information and legal links.

| Element | Style | Behavior |
|---------|-------|----------|
| Container | Full-width, `brand-primary` bg, `space-8` vertical padding | Bottom of page |
| Inner container | max-width `1024px`, centered, horizontal layout (desktop), stacked (mobile) |  |
| Logo | `Logo/OnDark` variant or white text logo | Left (desktop), centered (mobile) |
| Links | `text-sm`, `gray-300`, `space-4` gap | "Privacidad" · "Términos" · "contacto@vindex.app" |
| Copyright | `text-xs`, `gray-400` | "© 2026 VinDex. Todos los derechos reservados." |

### Footer Layout

**Desktop:** Logo left, links center, copyright right — single row.
**Mobile:** Logo centered, links centered below, copyright centered below — stacked.

---

## Mobile Layout (< 640px)

1. **Header:** Hamburger menu replaces nav links. Login button hidden (inside menu).
2. **Hero:** Text `text-2xl` instead of 48px. CTAs stacked vertically, full-width.
3. **The Idea:** Statement `text-xl`. Body and closing text slightly smaller. max-width 100%.
4. **Steps:** Stacked vertically, each step full-width. 4 steps instead of 3.
5. **Feature cards (buyers/inspectors):** Stacked vertically, full-width.
6. **Vehicle timeline:** Full-width, same vertical layout. Narrower event rows.
7. **Contact form:** Full-width, `space-4` horizontal padding.
8. **Footer:** All elements centered, stacked vertically.

### Mobile Layout

```
┌─────────────────────────────────────────┐
│  VinDex                          [≡]    │
├─────────────────────────────────────────┤
│                                         │
│     El historial que cada auto         │
│     debería tener.                      │
│                                         │
│     VinDex construye identidad         │
│     vehicular documentada...           │
│                                         │
│     [ Cómo funciona             ]      │
│     [ ¿Sos inspector? Contactanos ]    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│     Hoy, comprar un usado es un       │
│     acto de fe                          │
│                                         │
│     No hay forma confiable de saber   │
│     qué le hicieron al auto...        │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│     Cómo funciona                       │
│                                         │
│     ①  Un profesional evalúa            │
│        el vehículo                      │
│                                         │
│     ②  El resultado queda              │
│        sellado al VIN                   │
│                                         │
│     ③  El cliente recibe un            │
│        informe profesional              │
│                                         │
│     ④  El vehículo acumula             │
│        su historia                      │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│     Confianza con evidencia             │
│                                         │
│     ┌──────────────────────────┐       │
│     │ 🔍 Consultá el historial │       │
│     │    Accedé a todo lo...   │       │
│     └──────────────────────────┘       │
│     ┌──────────────────────────┐       │
│     │ 🔒 Inmutable por diseño  │       │
│     │    Una vez firmado...    │       │
│     └──────────────────────────┘       │
│     ┌──────────────────────────┐       │
│     │ 🔎 Transparencia total   │       │
│     │    Sabé quién pidió...   │       │
│     └──────────────────────────┘       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│     Tu herramienta, tu marca,          │
│     tu historial                        │
│                                         │
│     ┌──────────────────────────┐       │
│     │ 📱 Una herramienta       │       │
│     │    superior              │       │
│     └──────────────────────────┘       │
│     ┌──────────────────────────┐       │
│     │ 📋 Tu marca, no la      │       │
│     │    nuestra               │       │
│     └──────────────────────────┘       │
│     ┌──────────────────────────┐       │
│     │ ⭐ Reputación que        │       │
│     │    se acumula            │       │
│     └──────────────────────────┘       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│     ░░░░░░░░░░░░░░░░░░░░░░░░░░░       │
│     Un VIN, toda su vida documentada   │
│                                         │
│     Inspecciones, servicios y          │
│     reparaciones se anclan al VIN...   │
│                                         │
│     ● Mar 2026                          │
│     │ Inspección pre-compra             │
│     │ 78.400 km · Insp. Martínez       │
│     │                                   │
│     ● Sep 2026                          │
│     │ Cambio de aceite y filtros        │
│     │ 87.000 km · Taller López         │
│     │                                   │
│     ● Dic 2026                          │
│     │ Alineación y balanceo             │
│     │ 93.200 km · Taller López         │
│     │                                   │
│     ● Mar 2027                          │
│     │ Inspección periódica              │
│     │ 104.800 km · Insp. Martínez      │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│     ¿Sos inspector?                     │
│     Contactanos para empezar            │
│                                         │
│     ┌──────────────────────────┐       │
│     │ Nombre [            ]    │       │
│     │ Email  [            ]    │       │
│     │ Tel    [            ]    │       │
│     │ Mensaje                  │       │
│     │ [                   ]    │       │
│     │                          │       │
│     │ [ Enviar mensaje    ]    │       │
│     └──────────────────────────┘       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│            VinDex                        │
│   Privacidad · Términos · Contacto      │
│   © 2026 VinDex.                        │
│                                         │
└─────────────────────────────────────────┘
```

---

## Desktop Layout (> 1024px)

- Header: full-width, nav links visible, login button visible.
- Hero: larger text (48px tagline), CTAs side by side.
- The Idea: centered editorial block, narrower max-width.
- Steps: 4-column grid with connecting dashed lines between circles.
- Feature cards: 3-column grid.
- Vehicle timeline: centered, narrower max-width, dark background full-width.
- Contact form: max-width `560px`, centered.
- Footer: horizontal layout, logo left, links center, copyright right.

---

## States

### 1. Default (Page Loaded)

- All sections visible, scrollable.
- Header starts transparent over hero, transitions to white on scroll.
- Contact form empty, ready for input.

### 2. Header Scrolled

- Header transitions to `white` bg with `shadow-sm` (200ms ease).
- Nav link text color changes from `white` to `gray-700`.
- Logo transitions from light variant to standard.

### 3. Contact Form — Validation Errors

- Red border on invalid fields (`error` color, 1px).
- Error text below each invalid field.
- Submit button remains enabled (user can re-attempt).
- Errors clear when user starts typing in the field.

### 4. Contact Form — Submitting

- Submit button disabled, shows spinner + "Enviando..."
- Form fields disabled during submission.

### 5. Contact Form — Success

- Submit button changes to `success` bg with checkmark + "¡Mensaje enviado!"
- Success state persists for 3 seconds, then form resets to empty.
- Toast notification (optional): "Nos pondremos en contacto pronto."

### 6. Contact Form — Error

- Toast notification with error message.
- Form fields remain filled (user doesn't lose input).
- Submit button returns to enabled state.

---

## Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| Button (Primary) | shadcn/ui `Button` | Hero CTA, form submit |
| Button (Secondary) | shadcn/ui `Button variant="outline"` | Header login, hero secondary CTA |
| Input | shadcn/ui `Input` | Contact form text inputs |
| Textarea | shadcn/ui `Textarea` | Contact form message |
| Label | shadcn/ui `Label` | Form field labels |
| Toast | shadcn/ui `Sonner` / toast | Form feedback |
| Logo/Principal | Design system | Header (desktop) |
| Logo/OnDark | Design system | Footer |
| FormInput | Design system | Contact form fields |

---

## Design Tokens Reference

From `specs/ui/design-system.md`:

- **Colors:** `brand-primary` (#1E293B), `brand-primary-hover` (#0F172A), `brand-accent` (#0EA5E9), `gray-50` through `gray-900`, `success`, `error`, `white`
- **Typography:** `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px), `text-3xl` (30px)
- **Spacing:** `space-1` (4px) through `space-12` (48px)
- **Borders:** `border-default` (1px solid gray-200)
- **Radius:** `radius-sm` (6px), `radius-md` (8px), `radius-full` (9999px)
- **Shadows:** `shadow-sm` (cards), `shadow-md` (floating elements)
- **Touch targets:** 48x48px minimum interactive

---

## Interaction Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Scroll to section | Tap nav link | Smooth-scroll to anchor (#como-funciona, #compradores, #inspectores, #contacto) |
| Open mobile menu | Tap hamburger icon | Full-screen overlay with nav links |
| Close mobile menu | Tap ✕ or nav link | Overlay closes, scroll to section if link tapped |
| Login | Tap "Login" button | Navigate to `/login` |
| How it works | Tap hero primary CTA | Smooth-scroll to `#como-funciona` |
| Contact | Tap hero secondary CTA | Smooth-scroll to `#contacto` |
| Submit form | Tap "Enviar mensaje" | Validate → submit → show success/error |
| Header transition | Scroll past 56px | Header bg transparent → white, text color changes |

---

## Test Plan

Per `specs/architecture.md §5` — all component tests use React Testing Library.

| Component / State | Test Cases |
|-------------------|------------|
| **Page renders** | Hero section, the-idea section, how-it-works, buyers section, inspectors section, vehicle timeline, contact form, footer all render |
| **Navigation header** | Logo renders and links to top · Nav links visible on desktop, hidden on mobile · Login button navigates to `/login` |
| **Mobile menu** | Hamburger visible < 640px · Opens overlay on tap · Close button works · Nav links scroll to sections |
| **Hero section** | Tagline and subheading render with new copy · Primary CTA scrolls to how-it-works · Secondary CTA scrolls to contact section |
| **The Idea section** | Statement, body text, and closing line render with correct copy |
| **How it works** | All 4 steps render with correct title and description |
| **Buyers section** | All 3 feature cards render with icons, titles, descriptions |
| **Inspectors section** | All 3 feature cards render with icons, titles, descriptions |
| **Vehicle timeline** | Section title renders · All 4 timeline events render with date, description, odometer, and professional name |
| **Contact form — empty submit** | Required fields show validation errors (name, email, message) |
| **Contact form — invalid email** | Email field shows validation error for invalid format |
| **Contact form — valid submit** | Form submits, shows loading state, shows success state on success, form resets after 3s |
| **Contact form — server error** | Error toast shown, form retains input, submit button re-enabled |
| **Footer** | Logo, privacy link, terms link, email, copyright render |
| **Smooth scroll** | Nav links trigger smooth scroll to correct sections (verify anchor IDs match) |
| **Responsive** | Mobile: stacked layout, hamburger menu. Desktop: grid layouts, inline nav. |

---

## Accessibility

- Navigation header uses `<nav>` with `aria-label="Navegación principal"`.
- Mobile menu button has `aria-label="Abrir menú"` and `aria-expanded` state.
- Anchor links use `href` with fragment identifiers for native scroll behavior.
- All form inputs have associated `<label>` elements.
- Form validation errors are announced via `aria-describedby` linking input to error message.
- Submit button has clear text label; loading state announced via `aria-busy="true"`.
- Hero CTAs meet AA contrast on dark background.
- Feature cards are not interactive — decorative containers. Content is accessible as plain text.
- Vehicle timeline uses semantic list markup (`<ol>`) for event sequence.
- Footer links have descriptive text.
- All text meets WCAG AA contrast ratios.
- Page is fully navigable via keyboard: Tab through nav → hero CTAs → form fields → submit → footer links.
- Skip-to-content link for keyboard users (hidden, visible on focus): "Ir al contenido" → `#como-funciona`.
