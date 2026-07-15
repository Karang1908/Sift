# Sift — Development Log

Chronological record of all modifications to the Sift document parsing and analysis platform. Each entry includes the timestamp, files touched, and a description of what changed and why.

---

## July 14, 2026

### 10:02 PM — Dark Mode Toggle & Initial Theme

**Files:** [style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css), [index.html](file:///Users/karangarg/Desktop/file%20parsing/static/index.html), [admin.html](file:///Users/karangarg/Desktop/file%20parsing/static/admin.html), [script.js](file:///Users/karangarg/Desktop/file%20parsing/static/script.js), [admin.js](file:///Users/karangarg/Desktop/file%20parsing/static/admin.js)

Implemented a full dark mode system across both the main application and admin dashboard.

- Appended the first set of `html.dark` CSS overrides to the end of `style.css`, covering body, panels, tables, buttons, inputs, and status badges with a slate-blue initial palette.
- Added a theme toggle button (`#theme-toggle-btn`) with an inline SVG moon/sun icon to both page headers, wired to a `localStorage`-backed toggle in `script.js` and `admin.js`.
- Injected a synchronous `<script>` block inside the `<head>` of both `index.html` and `admin.html` that reads `localStorage.getItem('theme')` and adds the `.dark` class to `<html>` before the first paint, eliminating the white flash on page load.

---

## July 15, 2026

### 02:06 AM — Admin Header Markup Cleanup

**Files:** [admin.html](file:///Users/karangarg/Desktop/file%20parsing/static/admin.html), [style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css)

Removed all remaining inline `style=""` attributes from the admin header buttons (theme toggle, back-to-app link, logout). Moved sizing, margin, alignment, and hover transition rules into class definitions in `style.css` so the markup is clean and all visual behavior is centralized.

---

### 02:07 AM — Admin Panel Viewport Flexbox Layout

**Files:** [admin.html](file:///Users/karangarg/Desktop/file%20parsing/static/admin.html), [style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css)

Redesigned the admin panel's structural layout to fill the viewport below the header using `height: calc(100vh - 60px)` and a column flexbox. The tab navigation bar and filter controls are pinned to the top (`flex-shrink: 0`), while table panels scroll independently inside `.file-list-container` with `overflow-y: auto`. Table header rows (`<th>`) use `position: sticky; top: 0` so column labels remain visible when scrolling through hundreds of log entries.

---

### 02:09 AM — Repository Cleanup

**Files:** `uploads/`, `parsed_cache/`, `presets/`, `export_presets/`, `audit_uploads/`, `audit_analysis/`, `audit_exports/`, `logs/activity.jsonl`, `__pycache__/`

Wiped all user-generated runtime data from the repository — cached uploads, parsed text, saved presets, audit archives, and the activity log file — while preserving `.gitkeep` placeholder files so the directory structure survives `git clone`. Deleted Python bytecode directories (`__pycache__`) across the project.

---

### 02:11 AM — Initial Dark Theme Styling Pass (Superseded)

**Files:** [style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css)

Styled buttons, progress bars, status badges, and hover states using a cyber-blue and orange accent palette with shadow glow gradients. This pass was later superseded by the Claude.ai warm palette migration at 09:45 AM and fully replaced during the complete rewrite at 10:00 AM.

---

### 02:14 AM — Admin Preset Tracking API

**Files:** [app.py](file:///Users/karangarg/Desktop/file%20parsing/app.py), [admin.js](file:///Users/karangarg/Desktop/file%20parsing/static/admin.js), [style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css)

Extended the `/api/admin/users` endpoint in `app.py` to read each user's saved prompt presets (`presets/<user>.json`) and export presets (`export_presets/<user>.json`) from disk and return them as structured JSON arrays alongside the existing user metadata. Updated `admin.js` to render these inside the user info cards with preset name, prompt/instruction text, format type, and template filename. Added supporting CSS for `.admin-user-presets-section`, `.preset-name`, `.preset-value`, and `.preset-template-tag`.

---

### 02:18 AM — Modal Stacking Z-Index Fix

**Files:** [style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css)

Fixed a bug where the generic save-preset name prompt modal spawned behind the export instructions modal. Both shared the `.modal-overlay` class with `z-index: 2000`. The generic modal (`#modal-overlay`) now explicitly sets `z-index: 2500`, ensuring it always floats above the export workspace overlay.

---

### 09:41 AM — Decoupled Presets Tab & Template Download Endpoint

**Files:** [app.py](file:///Users/karangarg/Desktop/file%20parsing/app.py), [admin.html](file:///Users/karangarg/Desktop/file%20parsing/static/admin.html), [admin.js](file:///Users/karangarg/Desktop/file%20parsing/static/admin.js)

Separated preset/template data from user info cards into a dedicated **Presets & Templates** tab in the admin panel. The user cards under the "Users" tab now show only account metadata (username, role), keeping them compact.

- Added a new `data-tab="presets"` button to the admin tab bar and a corresponding `#tab-presets` section containing a filterable table with columns: User, Type, Preset Name, Details/Instructions, Template File.
- Built `refreshPresets()` in `admin.js`, which fetches all users from `/api/admin/users`, flattens their prompt and export presets into a sortable list, and renders each row with type badges (`Prompt` vs `Export (XLSX)` etc.) and download links for attached template files.
- Added a new secure endpoint `/api/admin/export-templates/{username}/{filename}/download` in `app.py` using `FileResponse`. The handler validates admin status, rejects directory traversal attempts (blocking `/`, `\`, and `..` in filenames), and confirms the file exists before serving.

---

### 09:43 AM — Light Mode Username Contrast Fix

**Files:** [style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css)

The `.header-username` element was rendering in gray (`#cbd5e1`) against the deep navy blue header (`#1e3a8a`), making the logged-in username nearly invisible. Changed the color to `#ffffff` (white) for proper contrast.

---

### 09:45 AM — Claude.ai Warm Dark Theme Migration

**Files:** [style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css)

Replaced the initial slate-blue dark palette with Claude.ai's signature warm dark aesthetic:

| Token | Hex | Usage |
|---|---|---|
| Canvas | `#1a1815` | `body` background, input backgrounds, code block backgrounds |
| Panel | `#22201c` | `.panel`, modal boxes, sidebar, table headers, card backgrounds |
| Elevated | `#2a2723` | `.panel-header`, hover row highlights, elevated surfaces |
| Border | `#33302a` | All border lines, table dividers, separator rules |
| Text Primary | `#e8e6e3` | Body text, table cell text, headings |
| Text Secondary | `#b0aba2` | Timestamps, labels, muted info, username |
| Text Tertiary | `#6d6961` | Placeholders, empty states, metadata captions |
| Accent | `#c15f3c` | Primary buttons, active tab underlines, focus rings |
| Accent Hover | `#d87757` | Button hover states, progress bar glow, link color |
| Accent Light | `#e89b76` | Inline code text, preset name highlights |

Updated buttons, inputs, scrollbars, status badges, markdown rendering elements (headings, blockquotes, code, tables), progress bars, and chat message backgrounds.

---

### 09:49 AM — Admin Table Grid System & Tab Contrast Fix

**Files:** [style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css), [admin.html](file:///Users/karangarg/Desktop/file%20parsing/static/admin.html), [admin.js](file:///Users/karangarg/Desktop/file%20parsing/static/admin.js)

Created a column sizing system for admin dashboard tables to prevent long data (prompts, filenames, activity details) from squishing metadata columns:

| Class | Width | Behavior |
|---|---|---|
| `.col-time` | 180px | `white-space: nowrap`, muted color, 0.8rem font |
| `.col-user` | 100px | `white-space: nowrap` |
| `.col-action-type` | 120px | `white-space: nowrap`, houses status badges |
| `.col-number` | 80px | `text-align: center`, `white-space: nowrap` |
| `.col-btn` | 110px | `text-align: right`, for action buttons |
| `.col-text` | max 400px | `text-overflow: ellipsis`, single line truncation |
| `.col-text-wrap` | max 450px | `word-break: break-all`, multi-line wrapping |

Applied these classes to all `<th>` elements in `admin.html` and all `<td>` cells rendered by `refreshActivity()`, `refreshUploads()`, `refreshAnalysis()`, `refreshExports()`, and `refreshPresets()` in `admin.js`. Also separated the status badge and action button in the Analysis tab into two distinct columns (previously crammed into one cell).

Fixed admin tab text color in dark mode — `.admin-tab` was using `#64748b` (default) and `#1e3a8a` (active/hover), both invisible on the dark header. Added overrides for `#6d6961` default, `#d87757` hover, and `#c15f3c` active with matching `border-bottom-color`.

---

### 09:56 AM — 24-Hour Clock Format & Time Column Width

**Files:** [admin.js](file:///Users/karangarg/Desktop/file%20parsing/static/admin.js), [style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css)

Changed the `formatTime()` helper in `admin.js` from `.toLocaleString()` to `.toLocaleString(undefined, { hour12: false })`, forcing all dashboard timestamps to render in 24-hour format (e.g. `15/7/2026, 14:02:18` instead of `15/7/2026, 2:02:18 PM`). This eliminates the AM/PM suffix that was wrapping onto a second line in narrow viewports. Expanded `.col-time` width from `160px` to `180px` to provide additional clearance.

---

### 10:00 AM — Complete Dark Mode Rewrite

**Files:** [style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css)

Full element-by-element audit and rewrite of the dark mode stylesheet. The previous version was a patchwork of incremental overrides accumulated across multiple sessions, with gaps, wrong selectors, and inconsistencies. Replaced the entire block (lines 1179 onward) with a single, organized, section-by-section dark theme covering every element in both the main app and admin dashboard.

**Structure of the new block:**
1. Base (body)
2. Header & theme toggle
3. Login screen (overlay gradient, box, logo, form labels, error)
4. Panels & panel headers
5. Upload zone (including `.dragover` state)
6. File list container border
7. Tables (th, td, hover rows, col-time, empty rows)
8. Status badges (parsed, pending, error)
9. Buttons (primary, secondary, danger, icon, disabled states)
10. Spinners
11. Form controls (text inputs, password inputs, textareas, selects, placeholders, labels, focus rings)
12. Modal input focus
13. Preset dropdown (toggle, caret, menu, items, active, empty)
14. Progress bars (track, fill, label, status text)
15. Output container & markdown (headings, strong, links, pre, code, th, td, blockquote, hr)
16. Modals (overlay backdrop, box, title, message)
17. Export modal tabs
18. File items (parsed cache)
19. Admin tabs & border
20. Admin filter selects & focus
21. Admin user cards (header, role badge, preset sections, empty state)
22. Admin analysis modal content
23. Admin denied page
24. Activity log viewer
25. Scrollbars (track, thumb, thumb:hover)

**Key gaps that were fixed:**

| Element | Problem | Resolution |
|---|---|---|
| `.login-overlay` | Cool blue gradient persisted | Warm charcoal gradient (`#0e0d0b → #1a1815 → #22201c`) |
| `.file-list-container` | Bright `#cbd5e1` border, no override | `border-color: #33302a` |
| `.preset-dropdown-menu` | Old override targeted `.dropdown-menu` (wrong class) | Now targets `.preset-dropdown-menu` |
| `.preset-dropdown-caret` | Cool slate `#64748b`, no override | `color: #6d6961` |
| `.modal-title` | `#1e293b` text on `#22201c` bg — invisible | `color: #e8e6e3` |
| `textarea:focus` / `input:focus` | Blue `#1e3a8a` focus ring | Orange `#c15f3c` ring |
| `.upload-zone.dragover` | Blue `#1e3a8a` border highlight | Orange `#c15f3c` |
| `.output-body strong` | `#0f172a` — invisible on dark | `#ffffff` |
| `.output-body a` | No override (default blue links) | `#d87757` |
| `.output-body hr` | No override (default gray) | `border-color: #33302a` |
| `.output-body code` bg | Flat `#22201c` (blends with panel) | Subtle `rgba(193, 95, 60, 0.08)` tint |
| `.btn-secondary .spinner` | Blue `#1e3a8a` | Orange `#d87757` |
| `::placeholder` | No override (black on dark bg) | `color: #5b5750` |
| `.admin-tabs` border | Bright `#cbd5e1` | `border-bottom-color: #33302a` |
| `.admin-filters select` | White bg, black text — no override | Full dark bg/text/border/focus styling |
| `.admin-user-presets-empty` | `#94a3b8` (too bright) | `#5b5750` |
| `.modal-overlay` backdrop | Cool `rgba(15, 23, 42, 0.5)` | Warm `rgba(10, 9, 8, 0.7)` |

Removed 550 lines of duplicate old dark mode rules that were left behind during the migration.

**Verification:** `python3 -m py_compile app.py` passes. `python3 test_backend.py` — all tests pass.

---

### 10:10 AM — Full Repository Data Wipe

**Files:** `uploads/`, `parsed_cache/`, `presets/`, `export_presets/`, `export_templates/`, `audit_uploads/`, `audit_analysis/`, `audit_exports/`, `logs/`, `__pycache__/`

Wiped all user-generated runtime data to restore a fresh-start state. User accounts (defined in `app.py`) are preserved — only the data they produced is removed.

- Deleted all files inside `uploads/`, `parsed_cache/`, `presets/`, `export_presets/`, `export_templates/`, `audit_uploads/`, `audit_analysis/`, `audit_exports/` except `.gitkeep` placeholders.
- Truncated `logs/activity.jsonl` to 0 bytes.
- Removed any `__pycache__/` bytecode directories.

**Verification:** All 9 data directories contain only their `.gitkeep` file. `activity.jsonl` is 0 bytes. No `__pycache__` directories exist.

---

### 03:25 PM — Comprehensive Bug Audit & Remediation (Export Multi-Run, Race Conditions, XSS, Template Splicing)

**Files:** [app.py](file:///Users/karangarg/Desktop/file%20parsing/app.py), [static/script.js](file:///Users/karangarg/Desktop/file%20parsing/static/script.js), [static/admin.js](file:///Users/karangarg/Desktop/file%20parsing/static/admin.js), [verify_integration.py](file:///Users/karangarg/Desktop/file%20parsing/verify_integration.py)

Performed an exhaustive line-by-line audit across both frontend and backend modules to fix critical race conditions, security vulnerabilities, and workflow deadlocks:

1. **Multiple Sequential Exports & Button State Deadlocks (`script.js`)**:
   - Fixed `runSkillExport` locking export buttons permanently after the first export due to inflexible `finally` block unlocking. Added `updateExportButtonsState()` execution across all export modal completion paths and added cross-tab `localStorage` event sync (`onstorage`) so state transitions update across open tabs immediately.
   - Refactored `createProgressController` across file upload (`#upload-progress`), AI analysis (`#process-progress`), and exporting (`#export-progress`). Replaced rigid CSS classes with explicit inline styles and added proper `hideTimeoutId` cancellation (`clearTimeout(hideTimeoutId)`) to eliminate progress bar flicker and early hides.
2. **Template Splicing & Normalization (`app.py`)**:
   - Upgraded `_splice_xlsx_template`, `_splice_docx_template`, and `_splice_pdf_form_template` to clean `[ID=...]` wrappers, quotes, `$` signs, and whitespace from `loc_id` before matching against lookup tables. This guarantees exact matches even when the LLM formats location identifiers differently during template mapping.
   - Fixed `delete_file` directory deletion `500` crashes by sanitizing `safe_filename` and verifying `os.path.isfile()` before attempting removal.
   - Resolved SSE `JSONDecodeError` failures inside `_stream_process` by skipping non-JSON keep-alive lines instead of aborting the generator stream.
3. **Security Sanitations (`script.js`, `admin.js`)**:
   - Integrated `DOMPurify.sanitize()` into `renderAccumulatedMarkdown()` before injecting LLM markdown output into `#output-body`.
   - Upgraded `escapeHtml()` in `admin.js` to escape single (`&#39;`) and double (`&quot;`) quotes to prevent DOM attribute injection vulnerabilities.
4. **Integration Verification (`verify_integration.py`)**:
   - Updated `BASE_URL` to default to `http://127.0.0.1:8000` (`SIFT_BASE_URL` env var override) matching the standard uvicorn configuration in `GEMINI.md`.

**Verification:** `python3 -m py_compile app.py verify_integration.py test_backend.py audit_log.py parser_utils.py` passes. `node --check static/script.js static/admin.js` passes. `python3 test_backend.py` unit and connection tests pass cleanly.

