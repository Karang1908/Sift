---
name: SIFT // BLACKFORGE (Arc)
description: Document intelligence as a plasma-arc cutting instrument on cold near-black. ONE LAW — relentless cold-black grayscale broken by a single electric channel (arc blue; blue flame burns hotter than orange). Dark is the default and where the identity lives; light is a cold, equally hard inversion, never a warm-cream retreat.
theme-default: dark
colors:
  primary: "#3B8CFF"
  primary-hover: "#6FB8FF"
  accent-ink: "#04101F"
  neutral-bg: "#05070B"
  panel-bg: "#0B0F16"
  elevated: "#141A23"
  neutral-fg: "#EEF2F7"
  text-secondary: "#8C97A5"
  text-faint: "#7C8794"
  border: "#1C232D"
  border-strong: "#303A47"
  arc-gradient: "linear-gradient(90deg,#DFF4FF,#9BDCFF,#4FB0FF,#3B8CFF,#1E5FE0,#0B2E9E)"
colors-light:
  neutral-bg: "#E9ECF0"
  panel-bg: "#FFFFFF"
  neutral-fg: "#070A0F"
  text-secondary: "#515A64"
  text-faint: "#697380"
  border: "#D3D8DE"
  primary: "#0B57D0"
typography:
  display:
    fontFamily: "Satoshi (900 hero/wordmark, 700 titles + report headings)"
    letterSpacing: "-0.04em hero, -0.005em titles"
    lineHeight: 0.9
    usage: "Wordmark, hero, panel titles, report headings. Office-grade neutral grotesque — drama comes from SIZE and WEIGHT, not a stylized face. Never lighter than 700 for display."
  body:
    fontFamily: "Satoshi, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
    usage: "Body prose, controls. Deliberately quiet so the display weight and the arc do the talking."
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SF Mono, Menlo, monospace"
    letterSpacing: "0.18–0.24em, uppercase"
    usage: "The machine-fact voice — SHORT precise labels only: section indices (01 / INTAKE), table headers, metadata, counts, state words, buttons. tabular-nums. NEVER body prose and never a full sentence — long strings go sentence-case Satoshi."
rounded:
  none: "0px"
  sm: "1px"
  md: "2px"
  max: "2px — anything >=4px is a regression that collapses the aesthetic"
shadows:
  rule: "Soft neutral drop shadows are BANNED. Depth = surface steps (#05070B -> #0B0F16 -> #141A23) + 1px hairlines."
  only-permitted: "0 0 20px rgba(59,140,255,0.34) — arc glow, live elements only"
motion:
  ease: "cubic-bezier(0.2,0,0,1)"
  durations: "120/160/200ms — no spring, no overshoot, no bounce"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    font: "JetBrains Mono 700, uppercase, 0.14em tracking"
  button-secondary:
    backgroundColor: "transparent"
    border: "1px solid {colors.border-strong}"
    textColor: "{colors.text-secondary}"
    hover: "border + text arc-blue, inset 2px 0 0 arc (ignite-on-contact)"
---

# Design System: Sift

## 1. Overview

**Creative North Star: "The Plasma Arc"**

Sift is a document-cutting instrument, not a friendly SaaS app. The system is built on
**one law**: relentless cold-black grayscale, broken by a **single electric channel** —
arc blue. No second saturated colour is permitted to exist anywhere (no status green, no
warning amber, no second accent). Hardness comes from *restriction*, not decoration: the
arc reads as intentional and load-bearing precisely because everything around it is
silent.

Dark is the **default** theme and where the identity lives. Light is a cold, equally hard
inversion — never a warm-cream retreat.

**Key Characteristics:**
*   **One hot channel**: arc blue (`#3B8CFF`) against cold near-black. Colour appears only where the machine is actually working.
*   **Machine-fact typography**: enormous heavy Satoshi whiplashed against tiny wide-tracked uppercase JetBrains Mono.
*   **Spec-sheet structure**: 1px hairlines and surface steps do all the structural work. Soft shadows are banned.

## 2. Colours

See the front-matter for exact tokens. Dark is canonical.

### Accent — the arc
- **Arc Blue** (`#3B8CFF`): the only saturated colour in the system. Primary actions, active/live state, focus, links, error state.
- **Arc Hot** (`#6FB8FF`): hover — *hotter = whiter/cyaner*, mirroring a real arc.
- **Arc ink** (`#04101F`): the dark ink that sits on an arc-blue fill.
- Light theme uses a deeper **`#0B57D0`** with white ink so it stays AA on white.

### Neutral (cold)
- Canvas `#05070B` → Panel `#0B0F16` → Elevated `#141A23`. Depth is these steps plus hairlines, never a shadow.
- Ink `#EEF2F7`, secondary `#8C97A5`, faint `#7C8794`. Borders `#1C232D` / `#303A47`.

### Named Rules
**The One-Channel Rule.** If you are about to introduce a second saturated colour — a green "success", a red "error", a second brand accent — don't. Route it through the arc or through the grey ramp. The moment a second colour appears, the discipline collapses into generic dark-mode SaaS.

## 3. Typography

**One family:** Satoshi (display + body) · **Mono:** JetBrains Mono

- **Display** (Satoshi 900 hero / 700 titles, tracking `-0.04em` hero): wordmark, hero, panel titles, report headings. Office-grade neutral grotesque — the drama is size and weight, not a stylized face. **Never lighter than 700** for display.
- **Body** (Satoshi 400/500/700, 14px, 1.5): prose and controls. Deliberately quiet.
- **Mono** (JetBrains Mono 400/500/700, uppercase, tracking `0.18–0.24em`, `tabular-nums`): the machine-fact voice — **short precise labels only**: section indices (`01 / INTAKE`), table headers, byte sizes, counts, state words, button labels. **Never body prose, never a full sentence** — a sentence in tracked uppercase mono reads as shouting, not precision.

The core typographic move is the whiplash: huge negative-tracked display directly against tiny wide-tracked uppercase mono.

### The one serif exception — the WORDMARK
**The wordmark is always italic Times New Roman (`700`), split `Si` in ink + `ft.` in
arc blue** — on the sign-in hero and in the command bar of both the app and the admin
panel. That consistency is the point: it is a brand mark, not a decoration, so it
looks identical everywhere it appears. It is a true contrast-axis pairing (serif
italic against the Satoshi/mono UI) rather than a clash, and Times is office-native so
it reads as letterhead.

**The serif is permitted for the wordmark and nothing else.** No serif headings, no
serif body, no serif labels — a qualifier next to the mark (e.g. admin's "Admin") is
set in mono, not serif.

On the sign-in hero the mark is typed on a loop — type → hold → delete → retype —
with a blinking arc caret. The full wordmark is authored in the HTML and the
typewriter only replaces already-visible text, so it degrades to a static wordmark
without JS; `prefers-reduced-motion` skips the loop entirely and hides the caret. The
loop stops itself once the sign-in overlay is dismissed.

### Command bar
The bar is **white in light mode** and near-black in dark — it is a floating glass
layer (`~72%` surface + `blur(26px)`), so a dark bar in light mode composites to a
washed grey and must not be used.

## 4. Elevation

**Soft neutral drop shadows are BANNED.** Depth is conveyed by surface steps
(`#05070B → #0B0F16 → #141A23`) and 1px hairlines.

### The only permitted shadow
- **Arc glow** (`0 0 20px rgba(59,140,255,0.34)`): live elements only — the streaming progress bar, a primary button on hover, a live status dot.
- **Specular edge** (`inset 0 1px 0 rgba(255,255,255,.07)`): the glass highlight on floating layers. An inset hairline, not a drop shadow.

### Liquid glass
Translucency (`backdrop-filter: blur(30px) saturate(180%)` over a ~76% surface) is applied to **floating layers ONLY** — command bar, modals, dropdown menus, the sign-in card — where it communicates depth. It is feature-gated with `@supports` and degrades to the solid surface. **Never** applied decoratively to static panels; glass-as-default is the failure mode.

### Named Rules
**The No-Shadow Rule.** A soft blurred neutral shadow is the single most recognisable generic-AI tell. It is banned by rule, not by taste.

## 5. Components

### Geometry
The entire radius vocabulary is **0–2px**. `0` for structure (panels, dividers, table cells, hero), `1px` for inputs/dropdowns/secondary buttons, `2px` maximum for the primary button and modals. Status dots are the sole round elements. **Any radius ≥4px is a regression.**

### Buttons
- **Primary**: arc-blue fill, arc-ink text, JetBrains Mono 700 uppercase `0.14em`, 2px radius, arc glow on hover.
- **Secondary**: transparent, 1px hairline border, mono uppercase. Hover *ignites*: border + text go arc blue with an `inset 2px 0 0` arc left-edge. No fill, no scale-pop.
- **Focus**: a hard `1px solid` arc outline at `2px` offset — never a soft rounded halo.

### Panels
Square, 1px hairline, no shadow. Header carries a mono index (`01 / INTAKE`) above a Satoshi 700 uppercase title. The **live** panel ignites: its index turns arc blue and 1px targeting brackets appear at its corners.

### Inputs
Square (1px radius), canvas-coloured fill, hairline border, hard arc focus outline. Labels are uppercase mono.

## 6. Do's and Don'ts

### Do:
- **Do** keep the arc to genuinely live surfaces — streaming output and progress.
- **Do** set all metadata, counts and indices in uppercase mono with `tabular-nums`.
- **Do** build structure from 1px hairlines and surface steps.

### Don't:
- **Don't** introduce a second saturated colour, ever.
- **Don't** use a radius ≥4px, a soft drop shadow, or a display weight under 600.
- **Don't** let the neutrals drift warm — warm greys under a blue accent read muddy.
- **Don't** use spring/bounce/elastic motion. Machined decel (`cubic-bezier(0.2,0,0,1)`, 120–200ms) only.

## 7. Docs page (`static/docs.html`) — claude.ai-exact palette

The docs page is a standalone, self-contained reference (architecture, request flows,
API surface) with its own light/dark theme toggle (system-preference default,
persisted to `localStorage` under `sift-docs-theme`). It is visually independent from
the rest of the app: **sections 1–6 above describe the main app's BLACKFORGE (Arc)
system — dark by default** — and are unaffected by anything below;
`static/index.html`, `static/style.css`, and `static/admin.html` use those tokens
exactly as documented. The docs page alone carries a second, separate token set,
mapped to claude.ai's visual language rather than Sift's. **It has not been migrated
to the Arc system** and is the one surface still on the old warm palette.

### Tokens

Light (`:root`):

| Role | Value |
| --- | --- |
| Page background | `#FAF9F5` |
| Raised surface (cards, sidebar) | `#F0EEE6` |
| Subtle surface (hover states) | `#F5F4EF` |
| Border (hairline) | `rgba(20,20,19,0.12)` |
| Border (strong) | `rgba(20,20,19,0.22)` |
| Text | `#141413` |
| Text secondary | `#6E6E6C` |
| Text faded | `#91918D` |
| Accent (terracotta) | `#D97757` |
| Accent hover | `#C6613F` |
| Danger | `#BF4D43` |
| Accent-on (text on accent) | `#FFFFFF` |

Dark (`html[data-theme="dark"]`):

| Role | Value |
| --- | --- |
| Page background | `#262624` |
| Raised surface | `#30302E` |
| Subtle/elevated surface | `#3D3D3B` |
| Border (hairline) | `rgba(255,255,255,0.12)` |
| Border (strong) | `rgba(255,255,255,0.22)` |
| Text | `#F5F4EF` |
| Text secondary | `#A6A39A` |
| Text faded | `#7C7A72` |
| Accent (terracotta, same as light) | `#D97757` |
| Accent hover (lighter, for dark) | `#E08B6F` |
| Danger | `#E5766A` |
| Accent-on | `#FFFFFF` |

Both `:root` and the dark override set `color-scheme` (`light` / `dark`) so native
scrollbars and form controls follow. `@media print` re-declares the light values on
both roots so a printed page is always light regardless of the active toggle state.
Accent usage follows claude.ai's own restraint (roughly a ≤10% rule): links, the
sidebar brand's italic initial, hero highlights, callout accents, sequence-diagram
numbers, and the theme-toggle hover — not large fills or backgrounds. Radii: 12px for
cards/containers, 8px for buttons/controls/nav links, fully rounded for pills/badges.
Shadows are flat by default; only true floating elements (the fullscreen diagram
overlay, the scroll-to-top button, a hovered feature card) get
`0 4px 16px rgba(0,0,0,0.08)` (light) / `0 4px 16px rgba(0,0,0,0.4)` (dark).

### Typography

claude.ai's own display/UI faces (Copernicus and Styrene B) are proprietary and not
available to ship here — the docs page uses the closest free equivalents instead:
**Source Serif 4** (a variable serif with an optical-size axis, weights 400/600 plus a
400 italic cut) for display headings, paired with **Inter** (400/500/600) for body and
UI text, `Georgia` as the declared serif fallback (claude.ai's own fallback choice) and
a system `ui-monospace` stack for code. Headings use the serif at weight 600 with
normal letter-spacing — calm, not tightly tracked.

### Scope

This theme system exists **only** in `static/docs.html` — its own token block, its own
toggle button, its own Mermaid theme-variable pair. It does not touch, and is not
touched by, the main app's palette in sections 1–6, which remains light-only.
