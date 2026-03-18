# UI Spec: Email Templates

*Design specification for transactional emails sent by VinDex via Resend.*
*Derived from: specs/flows/inspection-signing.md | specs/flows/post-purchase-review.md | specs/ui/design-system.md | specs/entities/review-token.md*

---

## Overview

Transactional emails are sent using Resend with React Email templates (JSX). All emails follow a consistent layout with VinDex branding, clear CTAs, and mobile-first responsive design. Emails are plain and professional — no heavy graphics or complex layouts.

---

## General Email Layout

All emails share a common structure:

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  VinDex                                    (logo, small) │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  {Email body content}                                    │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  VinDex · vindex.app                                     │
│  Este email fue enviado porque un inspector de VinDex    │
│  incluyó tu dirección como cliente de una inspección.    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Email Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Max width | 600px | Email content area |
| Background | `#F9FAFB` (`gray-50`) | Email body background |
| Content background | `#FFFFFF` (`white`) | Content card |
| Text color | `#1F2937` (`gray-800`) | Primary text |
| Secondary text | `#6B7280` (`gray-500`) | Metadata, footer |
| Accent color | `#0EA5E9` (`brand-accent`) | Links |
| Button color | Node `brand_color` if set, otherwise `#1E293B` (`brand-primary`) | Report CTA button |
| Review button color | Node `brand_accent` if set, otherwise `#0EA5E9` (`brand-accent`) | Review CTA button |
| Button text | `#FFFFFF` (`white`) | CTA button text |
| Border | `#E5E7EB` (`gray-200`) | Dividers |
| Font family | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | System font stack |
| Font size (body) | 16px | Body text |
| Font size (small) | 14px | Metadata, footer |
| Line height | 1.5 | All text |
| Padding | 24px | Content area internal padding |
| Border radius | 8px | Content card, buttons |

---

## Email 1: Inspection Signed — Review Notification

**Trigger:** Inspection signed + customer email present on InspectionDetail.
**Recipient:** Customer email from InspectionDetail.
**Sender:** `VinDex <noreply@vindex.app>` (or configured Resend domain).

### Subject Line

```
Inspección de {Make} {Model} {Year} firmada — {Node Display Name}
```

Example: "Inspección de Nissan Sentra 2019 firmada — AutoCheck Buenos Aires"

### Email Body

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  VinDex                                                  │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Inspección firmada                                      │
│                                                          │
│  Se firmó la inspección de tu vehículo.                  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  🚗 Nissan Sentra 2019                            │  │
│  │     Patente: AC123BD                              │  │
│  │     VIN: 3N1AB7AP5KY250312                        │  │
│  │                                                    │  │
│  │     Inspector: AutoCheck Buenos Aires             │  │
│  │     Fecha: 13/03/2026                             │  │
│  │     Resultado: ✓ 12 Bien · ⚠ 3 Att · ✕ 1 Crit  │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [          Ver reporte completo          ]              │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Dejá tu reseña                                          │
│                                                          │
│  ¿El vehículo coincidió con lo que describió el          │
│  informe? Tu opinión ayuda a otros compradores.          │
│                                                          │
│  [            Dejar reseña            ]                  │
│                                                          │
│  Este enlace expira en 90 días.                          │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  VinDex · vindex.app                                     │
│  Este email fue enviado porque un inspector de VinDex    │
│  incluyó tu dirección como cliente de una inspección.    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Sections Detail

#### Header

| Element | Style | Content |
|---------|-------|---------|
| Logo | 24px height, left-aligned | VinDex text logo or small image |
| Separator | 1px `gray-200` line, full-width | Below logo |

#### Heading

| Element | Style | Content |
|---------|-------|---------|
| Title | 24px, `font-bold`, `gray-800` | "Inspección firmada" |
| Intro | 16px, `gray-600` | "Se firmó la inspección de tu vehículo." |

#### Vehicle Card

A bordered card with vehicle and inspection summary.

| Element | Style | Content |
|---------|-------|---------|
| Container | `gray-50` bg, 1px `gray-200` border, 8px radius, 16px padding | Card |
| Vehicle name | 18px, `font-bold`, `gray-800` | "{Make} {Model} {Year}" with car emoji |
| Plate | 14px, `gray-600` | "Patente: {plate}" — hidden if null |
| VIN | 14px, `gray-500`, monospace | "VIN: {vin}" |
| Inspector | 14px, `gray-600` | "Inspector: {node_display_name}" |
| Date | 14px, `gray-600` | "Fecha: {event_date}" DD/MM/YYYY |
| Result | 14px, status colors inline | "Resultado: ✓ {n} Bien · ⚠ {n} Att · ✕ {n} Crit" |

#### Report CTA

| Element | Style | Content |
|---------|-------|---------|
| Button | Node `brand_color` bg (fallback: `brand-primary`), `white` text, 16px font, 600 weight, 48px height, 8px radius, full-width (max 320px), center-aligned | "Ver reporte completo" |
| URL | — | `https://vindex.app/report/{slug}` |

#### Review Section

| Element | Style | Content |
|---------|-------|---------|
| Separator | 1px `gray-200` line | Above section |
| Title | 20px, `font-bold`, `gray-800` | "Dejá tu reseña" |
| Description | 16px, `gray-600` | "¿El vehículo coincidió con lo que describió el informe? Tu opinión ayuda a otros compradores." |
| Button | Node `brand_accent` bg (fallback: `brand-accent`), `white` text, 16px font, 600 weight, 48px height, 8px radius, full-width (max 320px), center-aligned | "Dejar reseña" |
| URL | — | `https://vindex.app/review/{token}` |
| Expiry note | 12px, `gray-400`, center-aligned | "Este enlace expira en 90 días." |

#### Footer

| Element | Style | Content |
|---------|-------|---------|
| Separator | 1px `gray-200` line | Above footer |
| Platform | 12px, `gray-400` | "VinDex · vindex.app" |
| Explanation | 12px, `gray-400` | "Este email fue enviado porque un inspector de VinDex incluyó tu dirección como cliente de una inspección." |

---

## React Email Implementation

Templates are built with React Email components (`@react-email/components`) for maximum email client compatibility.

**Location:** `src/lib/emails/`

### Template File

```
src/lib/emails/inspection-signed.tsx
```

### Key React Email Components

| Component | Usage |
|-----------|-------|
| `Html`, `Head`, `Body` | Email wrapper |
| `Container` | Max-width 600px centered |
| `Section` | Content sections |
| `Text` | All text elements |
| `Button` | CTA buttons (renders as `<a>` with table-based styling) |
| `Hr` | Dividers |
| `Img` | Logo |
| `Preview` | Email preview text (shown in inbox before opening) |

### Preview Text

```
Inspección de {Make} {Model} {Year} firmada por {Node Display Name}. Podés ver el reporte y dejar tu reseña.
```

---

## Email Client Compatibility

- **Gmail (web + mobile):** Full support. Buttons render correctly.
- **Outlook (web + desktop):** Table-based button fallback. VML for rounded corners.
- **Apple Mail:** Full support.
- **Yahoo Mail:** Full support.
- **Dark mode:** Colors should be legible. Use `color-scheme: light dark` meta tag. Test that status colors remain distinguishable.

React Email handles most cross-client rendering issues. Avoid:
- CSS Grid or Flexbox in email body (use tables via React Email components).
- Custom fonts (use system font stack).
- Images as primary content (use text with emoji fallback).

---

## Resend Integration

**Provider:** Resend (`resend.com`)
**SDK:** `resend` npm package

### Configuration

```
RESEND_API_KEY=re_xxxxx       # Environment variable
FROM_EMAIL=noreply@vindex.app  # Verified domain
```

### Send Pattern

```typescript
// src/lib/services/email.ts
import { Resend } from "resend";
import { InspectionSignedEmail } from "@/lib/emails/inspection-signed";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendInspectionSignedEmail(params: {
  to: string;
  vehicleName: string;
  plate: string | null;
  vin: string;
  inspectorName: string;
  eventDate: string;
  findingsSummary: { good: number; attention: number; critical: number };
  reportUrl: string;
  reviewUrl: string;
  brandColor: string | null;  // Node brand_color for report CTA
  brandAccent: string | null; // Node brand_accent for review CTA
}): Promise<void> {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: params.to,
    subject: `Inspección de ${params.vehicleName} firmada — ${params.inspectorName}`,
    react: InspectionSignedEmail(params),
  });
}
```

### Error Handling

- Email sending is **best-effort**. Failures are logged but do not affect the signing flow.
- Resend provides webhook callbacks for delivery events (bounces, complaints) — not implemented in MVP but available for future monitoring.
- Rate limits: Resend free tier allows 100 emails/day, 3,000/month. Sufficient for MVP.

---

## Test Plan

### Visual Testing

- Use React Email's preview server (`email dev`) to render and verify templates during development.
- Test across email clients using Resend's built-in preview or a tool like Litmus/Email on Acid.

### Unit Tests

| Target | Cases |
|--------|-------|
| Email template rendering | Template renders without errors · All dynamic fields populated correctly · Missing optional fields (plate = null) handled gracefully · Subject line includes vehicle name and inspector |
| Email service | Calls Resend with correct params · Handles Resend errors gracefully (logs, does not throw) · Skips sending when no customer email |

---

## Acceptance Criteria

- [ ] Email sent to customer after inspection is signed (when customer email present)
- [ ] Email includes vehicle summary, report link, and review link
- [ ] Review link uses the generated token: `/review/{token}`
- [ ] Report link points to `/report/{slug}`
- [ ] Email renders correctly in Gmail, Outlook, Apple Mail (visual verification)
- [ ] Subject line includes vehicle name and inspector name
- [ ] Footer explains why the email was sent
- [ ] Review link expiry noted in email (90 days)
- [ ] Email failure does not block or affect the signing flow
- [ ] React Email template in `src/lib/emails/`
- [ ] Resend integration in `src/lib/services/email.ts`
