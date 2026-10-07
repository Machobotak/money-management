---
name: Buku Besar
description: A personal finance ledger printed in reverse — black paper, white ink, oxide red out, banker green in.
colors:
  paper: "#0D0C0B"
  block: "#171613"
  raised: "#221F1B"
  ink: "#F3F0E9"
  muted: "#B8B0A1"
  faint: "#8A8175"
  rule-hair: "#2C2823"
  rule-dense: "#5A5348"
  rule-strong: "#8A8175"
  oxide-red: "#D6584A"
  oxide-red-deep: "#B03A2E"
  banker-green: "#5FA97A"
  banker-green-deep: "#3E7F57"
  ultramarine: "#6E86C8"
  ultramarine-deep: "#4F66A8"
  brass: "#C9A227"
typography:
  display:
    fontFamily: "Archivo, Helvetica, sans-serif"
    fontSize: "38px"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo, Helvetica, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, Helvetica, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Archivo, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Spline Sans Mono, monospace"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.14em"
  figure:
    fontFamily: "Spline Sans Mono, monospace"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.01em"
rounded:
  sm: "2px"
  md: "3px"
  lg: "4px"
  xl: "6px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "36px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "36px"
  chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "28px"
  input:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "40px"
---

# Design System: Buku Besar

## Overview

**Creative North Star: "The Night Ledger"**

Buku Besar is a personal ledger printed in reverse: black paper, white ink, read by lamplight. Solemn, exact, nocturnal. Every screen is a ruled leaf of the book — hairline rules separate entries, a dense rule closes each group, and a double rule draws above every total, exactly as a hand-kept ledger closes its column. Money is never decoration: oxide red marks money out, banker green marks money in, ultramarine marks money that only moves, and brass belongs to the binding alone.

Density is high but never cramped: tabular mono figures for every quantity, stamped micro-labels for structure, generous line-length caps for prose. The system rejects the neon fintech dashboard entirely — no gradients, no glow, no filled pills, no rounded SaaS softness. Flat tonal layering on black paper carries all depth.

**Key Characteristics:**
- Ruled and exact: hairline / dense / double rule hierarchy on every leaf.
- Dark archival paper (`#0D0C0B`) with lamp-warm ink (`#F3F0E9`).
- Three money inks with fixed meaning: oxide red out, banker green in, ultramarine moves.
- Mono figures, stamped labels, silent flat surfaces.

## Colors

Black paper carries white ink; three money inks carry meaning; brass binds the book.

### Primary
- **Ledger Ink** (#F3F0E9): primary text, primary-button fill, active interval keys, double rules before totals.

### Secondary
- **Oxide Red** (#D6584A, deep #B03A2E): money out — expenses, deficits, destructive actions, the today-marker ribbon.
- **Banker Green** (#5FA97A, deep #3E7F57): money in — income, surpluses, safe budget states.
- **Ultramarine** (#6E86C8, deep #4F66A8): money that only moves — transfers, neutral-informative states.

### Tertiary
- **Binding Brass** (#C9A227): the fore-edge binding strip, focus caret, warning states, selected-chart accents. Never body text.

### Neutral
- **Black Paper** (#0D0C0B): page ground.
- **Leaf Block** (#171613): sheet surfaces (`.sheet`).
- **Raised Leaf** (#221F1B): elevated surfaces, input fills, hover washes.
- **Muted Felt** (#B8B0A1): secondary text, descriptions.
- **Faint Pencil** (#8A8175): stamps, placeholders, table headers.
- **Hairline Rule** (#2C2823): inner dividers, sheet borders.
- **Dense Rule** (#5A5348): group closings, control borders.

### Named Rules
**The Three Inks Rule.** Oxide red means out, banker green means in, ultramarine means moved. No ink ever means anything else, and status is never carried by color alone — every tone chip also prints its label.
**The Brass Binding Rule.** Brass appears on the binding, the caret, warnings, and chart selection. It never sets body text and never fills a surface.

## Typography

**Display Font:** Archivo (with Helvetica fallback)
**Body Font:** Archivo (with Helvetica fallback)
**Label/Mono Font:** Spline Sans Mono (monospace fallback)

**Character:** Archivo sets structure with tight, confident headlines; Spline Sans Mono sets every figure and stamp with tabular exactness. Sans never sets a number that is read as a quantity; mono never sets prose.

### Hierarchy
- **Mast** (700, 38px/1.02, −0.03em): login wordmark only.
- **Title** (700, 30px/1.12, −0.02em): page headings (`PageHeader`).
- **Head** (700, 22px/1.25, −0.01em): section headings inside leaves.
- **Lead** (400, 18px/1.45): empty-state titles, chart-frame values.
- **Body** (400, 14px/1.55): prose, table cells; descriptions cap at ~52–65ch.
- **Figure** (mono, 20px/1.2, tabular): row amounts, card values. **Total** (mono, 24px/1.15) under a double rule.
- **Stamp** (mono 600, 10–11px, +0.10–0.14em, uppercase): labels, buttons, chips, table headers, nav. Never a heading kicker — no stamp sits above a heading.

### Named Rules
**The Figures-Are-Mono Rule.** Any number read as a quantity uses `.fig` (Spline Sans Mono, tabular-nums). Sans figures are a defect.
**The No-Kicker Rule.** Headings stand alone; supporting context follows below in body copy, never above in a stamp.

## Layout

One book, two readings. Phone-dominant (390px): single column, index-tab rail becomes a bottom bar, tables scroll horizontally inside their leaf (`min-width: 820px` guarded by `.sheet overflow-x-auto`), charts stack full-width. Desktop (1440px, max container ~1120px): sidebar rail (240px, name-then-stamp, active entry marked by the ribbon) beside a single ruled column; dashboard grids break to two columns above 1024px (summary + cash-flow, breakdown + trend).

Rhythm is ruled, not airy: 12–20px leaf padding (`px-5` mobile, wider desktop), 12px section gaps (`space-y-3`), 12px row rhythm on ruled rows (`py-3`), page opens with 24–40px headroom. Spacing scale: 8 / 16 / 24 / 40.

## Elevation & Depth

Flat tonal layering on black paper. No shadows anywhere — depth is conveyed by three paper tones (paper → block → raised) plus the rule hierarchy and a faint desk-lamp radial fixed to the viewport. Modals and toasts are raised leaves (`.sheet-raised`) with dense-rule borders, entering once via `animate-slip` (170ms, 6px rise). `prefers-reduced-motion` disables the entrance.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest and stay flat. Nothing floats, glows, or casts.

## Shapes

Sharp archival geometry: 2px radius on leaves, controls, chips, bars, and modal slips; 6px only on chart dots and toast slips. Borders are always hairline rules (`#2C2823` on sheets, `#5A5348` on controls), never colored edges above 1px — tone is carried by a 2px top rule on toasts and the overshooting ribbon marker, never by a thick side border. Tables use `border-collapse` with hairline row rules; totals close under a 3px double top rule (`.rule-total`).

## Components

### Buttons
- **Shape:** 2px radius, stamped mono micro-label, uppercase.
- **Primary:** ink fill, paper text, 36px height; hover falls back to muted. The commit action only.
- **Secondary / Ghost:** transparent, hairline or borderless, ink or muted text; hover washes raised. **Destructive:** oxide-red text with 60% red border, 12% red hover wash. **Quiet:** borderless muted text turning red on hover (row actions only).
- **Sizes:** sm 28px, md 36px, lg 44px. Loading swaps a 12px arc spinner inline.

### Chips
- **Style:** never a filled pill — a ruled stamp: transparent ground, 1px tone-tinted border, tone-tinted mono micro text.
- **State:** `FilterChip` active prints solid (ink fill, paper text); inactive is hairline-bordered muted text. `StatusChip` tones: success green, warning brass, error red, info ultramarine, neutral muted.

### Cards / Containers
- **Corner Style:** 2px (`.sheet`, `.sheet-raised`).
- **Background:** block `#171613`; raised `#221F1B` for emphasis leaves.
- **Shadow Strategy:** none — flat tonal layering only.
- **Border:** 1px hairline; dense rule closes header rows; double rule before totals.
- **Internal Padding:** `p-5` standard; rows `px-5 py-3`; empty leaves `py-10`.

### Inputs / Fields
- **Style:** raised fill, 1px dense-rule border, 2px radius, 40px height, ink text, faint placeholders; labels are micro stamps above.
- **Focus:** 2px oxide-red outline at 2px offset (global `:focus-visible`).
- **Error:** red 12% wash panel with red body text under a 2px red top rule; disabled at 40% opacity, pointer-events off.

### Navigation
Sidebar rail: name-then-stamp entries (never stamp-above-name), muted micro stamps, active entry ink text with the overshooting ribbon marker; brass fore-edge binding strip along the spine. Mobile: bottom tab bar with drawn SVG glyphs + micro stamps, safe-area padded; top bar carries wordmark and primary action.

### Charts (Recharts)
Ledger-drawn ink: hairline gridlines, faint mono ticks, 2px tabular strokes — oxide red expenses, banker green income, ultramarine transfers/neutral. Bars radius 2px; dots radius 6px; tooltips are raised leaves with dense borders. Legends print as stamped swatches, never default glyphs.

### Marker Ribbon
`.ribbon` draws a 2px oxide-red marker overshooting its column (`top/bottom: -1px`) via `::before`. Reserved for today-rows (anchored to the date cell, never the row) and the active nav entry. Empty states are blank leaves — no ribbon.

## Do's and Don'ts

### Do:
- **Do** set every quantity in `.fig` mono with tabular figures.
- **Do** close every total under `.rule-total` (3px double ink top rule).
- **Do** reserve the ribbon for today and the active entry.
- **Do** pair every tone chip with its printed label.
- **Do** keep prose lines at 52–65ch and tables scrollable inside their leaf on phones.

### Don't:
- **Don't** put a stamp, kicker, or eyebrow above any heading.
- **Don't** use colored `border-left/right` above 1px on any card or alert — tone travels on the top rule.
- **Don't** use gradient text, glows, shadows, or filled pill badges.
- **Don't** use brass for body text or surface fills.
- **Don't** let sans-serif figures, gray `#E5E7EB` borders, or horizontal page overflow ship.
