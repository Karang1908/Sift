---
name: Sift Design System
description: An editorial, high-contrast visual system inspired by Claude.ai and "The Slate Workdesk" philosophy.
colors:
  primary: "#cc6a4f"
  primary-hover: "#b35338"
  neutral-bg: "#f9f8f6"
  neutral-fg: "#191919"
  border: "#e1dfd5"
  panel-bg: "#ffffff"
  text-secondary: "#706f6a"
typography:
  display:
    fontFamily: "Lora, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.5rem, 4vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.panel-bg}"
    textColor: "{colors.neutral-fg}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1rem"
---

# Design System: Sift

## 1. Overview

**Creative North Star: "The Slate Workdesk"**

Sift uses a clean, minimal, editorial design system modeled on the aesthetic of Claude.ai. It rejects the over-saturated, generic gradient-heavy trends of typical AI SaaS templates in favor of a warm, paper-like palette, generous typography scaling, and high-utility structure. The feel is akin to an organized physical workdesk: flat, clean grids, clear borders, and high legibility. 

**Key Characteristics:**
*   **Monochromatic Restraint**: Solid, near-black ink on warm off-white paper, with one accent color (terracotta orange) used intentionally for primary actions.
*   **Typographic Balance**: Warm, literary serif headings paired with clean, readable sans-serif body text and interface controls.
*   **Structured Borders**: Layout divisions are marked by solid, thin lines rather than ambient shadows.

## 2. Colors

A warm neutral paper base paired with high-contrast text and a single rust-orange brand accent.

### Primary
- **Terracotta Orange** (`#cc6a4f`): Used sparingly (≤10% of any view) for primary action call-to-actions (CTAs) and success pathways.
- **Terracotta Hover** (`#b35338`): Used for primary button hover state.

### Neutral
- **Claude Paper Background** (`#f9f8f6`): The default page background, a warm off-white paper texture.
- **App Panel Background** (`#ffffff`): Pure white, used to separate main interactive panels and tables from the paper background.
- **Ink Dark Text** (`#191919`): Main text color, providing high-contrast readability.
- **Slate Border** (`#e1dfd5`): Subtle warm-gray border color for panel separators, table lines, and form boundaries.
- **Muted Text** (`#706f6a`): Muted secondary text color for helpers, meta tags, and inactive headers.

### Named Rules
**The 10% Accent Rule.** The terracotta accent color is reserved exclusively for the most critical actions (e.g. "Continue & Run Action" or "Save Preset"). Its rarity ensures maximum visual guidance.

## 3. Typography

**Display Font:** Lora, Georgia, serif
**Body Font:** Inter, -apple-system, sans-serif

**Character:** Warm, literary serif headings pair with a highly legible geometric sans-serif for UI controls to create a clean, editorial atmosphere.

### Hierarchy
- **Display** (Semi-Bold (600), `clamp(1.5rem, 4vw, 2.5rem)`, 1.25): Used for main page headers, login titles, and document titles.
- **Headline** (Semi-Bold (600), `1.2rem`, 1.3): Used for panel titles and section divisions.
- **Body** (Regular (400), `14px`, 1.5): Standard UI text, log trails, and parsed cache content. Line length capped at `75ch` for reading comfort.
- **Label** (Semi-Bold (600), `12px`, 1.2): Used for form fields, column headers, and small buttons.

## 4. Elevation

Depth is conveyed through solid flat borders (`1px solid #e1dfd5`) and structural grid divisions, not drop shadows. The system is flat by default.

### Shadow Vocabulary
- **Ambient Modal** (`box-shadow: 0 4px 12px rgba(25, 25, 25, 0.08)`): Reserved exclusively for floating components like dropdown menus or settings dialog overlays.

### Named Rules
**The Flat-By-Default Rule.** All main workspace containers and panels are flat on the background. Shadows appear only to elevate temporary overlays (menus, dropdowns) above the base canvas.

## 5. Components

### Buttons
- **Shape**: Soft sharp corner (`4px` radius).
- **Primary**: Background `{colors.primary}`, color `{colors.neutral-bg}`, padding (`0.5rem 1rem`).
- **Hover**: Background `{colors.primary-hover}`.
- **Secondary**: Background `{colors.panel-bg}`, border (`1px solid {colors.border}`), color `{colors.neutral-fg}`.

### Cards / Containers
- **Corner Style**: Soft sharp (`4px` or `8px` radius).
- **Background**: `{colors.panel-bg}`.
- **Border**: `1px solid {colors.border}`.
- **Internal Padding**: Spacing scale (`1rem` to `1.5rem`).

### Inputs / Fields
- **Style**: Background `{colors.panel-bg}`, border (`1px solid {colors.border}`), soft corner (`4px`).
- **Focus**: Border color `{colors.primary}`, box-shadow (`0 0 0 2px rgba(204, 106, 79, 0.15)`).

## 6. Do's and Don'ts

### Do:
- **Do** keep lines of text under `75ch` in document viewer panels.
- **Do** use `1px solid #e1dfd5` borders for panel boundaries to keep the "Slate Workdesk" structure sharp.
- **Do** use Lora or Georgia serif for display elements.

### Don't:
- **Don't** use drop shadows on primary workspace panels.
- **Don't** use raw unstyled terminal designs for dashboard logs.
- **Don't** use generic SaaS purple-to-blue gradients or heavily nested cards.

## 7. Docs page (`static/docs.html`) — claude.ai-exact palette

The docs page is a standalone, self-contained reference (architecture, request flows,
API surface) with its own light/dark theme toggle (system-preference default,
persisted to `localStorage` under `sift-docs-theme`). It is visually independent from
the rest of the app: **sections 1–6 above describe the main app's fixed, light-only
palette** (Sift's own "Slate Workdesk" system) and are unaffected by anything below —
`static/index.html`, `static/style.css`, and `static/admin.html` still use those tokens
exactly as documented. The docs page alone carries a second, separate token set,
mapped as closely as possible to claude.ai's own visual language rather than Sift's.

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
