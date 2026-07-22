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
**one primary channel**: relentless cold-black grayscale, broken by arc blue. Arc blue
is the only channel used for *identity and action* — primary buttons, active/live state,
focus, links, the wordmark's `ft.`. On top of that sits a **narrow semantic layer**:
pastel **red** = destructive / error, pastel **amber** = caution. That layer is
deliberately restrained — muted, AA-verified, and used *only* where a signal is genuinely
semantic (a Delete button, an error badge, the context gauge crossing a threshold), never
as decoration. Green is still avoided: "done" states stay neutral grey. Hardness still
comes from *restriction* — the arc reads as load-bearing because everything non-semantic
around it is silent.

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
- The channel extends to the OS chrome: **text selection**, the **text caret**, and the native `accent-color` are all the arc — the browser's default selection blue never appears. `color-scheme` is set per theme so scrollbars and native controls follow, and there is no white first-paint flash.

### Neutral (cold)
- Canvas `#05070B` → Panel `#0B0F16` → Elevated `#141A23`. Depth is these steps plus hairlines, never a shadow.
- Ink `#EEF2F7`, secondary `#8C97A5`, faint `#7C8794`. Borders `#1C232D` / `#303A47`.

### The semantic layer (red / amber)
Arc blue stays the **primary** channel (identity + action). A small, disciplined
semantic set is layered on top:

| Role | Light | Dark | Where |
| --- | --- | --- | --- |
| `--color-danger` (red) | `#B23B30` | `#F0857A` | Delete/Remove buttons, error badge, error status notes |
| `--color-warn` (amber) | `#8C6510` | `#E8B45C` | Cancel button, "parsing" badge, gauge caution zone |
| `--color-warn-fill` (bar) | `#E0A83C` | `#E8B45C` | the gauge fill in the caution zone (fill, not text) |

Each ships a matching `-bg` tint and (danger) a `-hover`. All AA-verified on their
surfaces (danger 5.9:1 / amber 5.3:1 on light panel; higher on dark). **The rule that
survives:** no *decorative* second colour, no green, no third brand accent. Colour that
isn't the arc must earn its place by being genuinely semantic (destructive / caution /
error). The moment red or amber shows up as decoration, the discipline is broken.

### Context-window gauge & phase seams
- **Context gauge** (file panel): an estimate (~4 chars/token) of how full the model's
  **1M-token** window is. Bar + token count + percent, updated on every file add/remove.
  Zones follow the semantic layer: **arc** (<75%) → **amber** (75–89%) → **red** (≥90%),
  with 1px notches marking the thresholds on the track. It's an awareness signal, not a
  billing meter — labelled as an estimate.
- **Phase seams**: a thin **arc** line marks the border between each phase — under the
  Intake panel (a `box-shadow` line, so it never bleeds through the translucent glass)
  and down the gap between the input column and the Export column (a 1px pseudo-element).

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

### Empty & idle states
An empty surface is composed, never a void. The idle report panel centres a grayscale **reticle "instrument face"** — a bordered square with edge crop-ticks and a centre dot, echoing the panel targeting brackets and the viewport crop marks — above the awaiting-text. It is grayscale by the one-channel law (idle ≠ live; only a working surface earns the arc) and CSS-only (`:has(> .output-placeholder)`), so it disappears the instant real output streams in.

## 6. Do's and Don'ts

### Do:
- **Do** keep the arc to genuinely live surfaces — streaming output and progress.
- **Do** set all metadata, counts and indices in uppercase mono with `tabular-nums`.
- **Do** build structure from 1px hairlines and surface steps.

### Don't:
- **Don't** introduce colour as *decoration*. Arc = primary; red/amber only where a signal is genuinely destructive/caution/error. No green, no third accent.
- **Don't** use a radius ≥4px, a soft drop shadow, or a display weight under 600.
- **Don't** let the neutrals drift warm — warm greys under a blue accent read muddy.
- **Don't** use spring/bounce/elastic motion. Machined decel (`cubic-bezier(0.2,0,0,1)`, 120–200ms) only.

## 7. Docs page (`static/docs.html`)

The docs page is a standalone technical reference (architecture, request flows, API
surface, security model) served at `/static/docs.html` and linked from the sign-in
screen as a corner readout.

**It is on the Arc system** — same tokens, type and geometry as the app, so it reads as
the same product. It carries its own copy of the tokens rather than importing
`style.css`, because it needs none of the app's component CSS (panels, modals, ledger)
and everything it does need (prose, sidebar, tables, diagrams) the app doesn't have.
Dark is the default, and the theme toggle writes the **same `localStorage` key
(`theme`) as the app**, so a preference set in one carries to the other.

### Fully offline — no CDN
The page loads the **vendored** `fonts/Satoshi-*.woff2` and `fonts/JetBrainsMono-*.woff2`
and nothing else off-origin. It previously pulled Google Fonts and Mermaid from CDNs,
contradicting the offline-by-design stance the rest of the app holds (vendored
`marked`/`purify`/fonts); both were removed. **Verified: zero external requests.**

### Diagrams are inline SVG, not Mermaid
The eight figures are hand-authored inline `<svg>` using the Arc vocabulary — 1px
hairlines, square corners, mono indices in arc blue, semantic fills (`.box.acc` arc,
`.box.wrn` amber, `.box.dgr` red) and a dashed `.zone` for trust boundaries. Inline SVG
is chosen over Mermaid for three reasons: it themes from the same CSS variables (so it
flips with light/dark for free), it can be **animated** (each `.draw` path is measured
with `getTotalLength()` and drawn in on scroll), and it costs no dependency. A shared
`<defs>` block at the top of the body holds the arrowhead markers.

### Motion layer
Vanilla JS, no library. Four behaviours, all driven by one rAF-throttled passive scroll
listener:

1. **Chapter rail** — a fixed left-edge line with one circle per `h2` chapter, generated
   from the document itself. The fill is a 1px div scaled with `transform: scaleY(p)`;
   each circle sits at the scroll fraction where its chapter reaches the top, and gains
   `.passed` (filled) / `.current` (filled + ring). The circles are real links, so the
   rail doubles as navigation. Built in **HTML/CSS, not SVG** — a stretched
   `preserveAspectRatio="none"` viewBox turns circles into ellipses, which is exactly
   what made the first attempt look wrong. Chapter positions are measured with
   `getBoundingClientRect().top + pageYOffset`, never `offsetTop`, because `.wrap` is
   positioned and would otherwise skew every circle.
2. **Section reveals** — opacity + 14px rise on intersect.
3. **Diagram choreography** — shapes fade, text follows, connectors draw via
   `stroke-dashoffset`, then the "live" connectors hand off to a marching-dash loop.
   The handoff **must clear the inline dasharray** the draw-on wrote, or the CSS dash
   pattern is outranked and nothing marches (the original bug).
4. **Nav scroll-spy.**

**Progressive enhancement is the rule.** The pre-hidden state lives behind `html.js-anim`,
added by a pre-paint script in `<head>` (so revealed elements never flash in at full
opacity first). That script also arms a **2.5s safety timeout**: if the motion script
never sets `data-motion-ready`, the class is removed and everything becomes visible — so a
script error can never leave the page blank. `prefers-reduced-motion` sets `html.reduce`
instead, which skips reveals and draw-on entirely and hides the rail.

### Semantic colour
The page uses the same semantic layer as the app: **arc** for guidance callouts and
`GET` badges, **amber** for caution (`POST`, quota/limit warnings), **red** for genuine
danger (`DELETE`, the "runs generated code" and no-TLS warnings). Nothing else.
