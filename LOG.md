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

### 01:16 PM — Template Schema Extractor Enhancements (`edbedf5`)

**Files:** [app.py](file:///Users/karangarg/Desktop/file%20parsing/app.py)

Enhanced `_extract_template_schema()` (`app.py:L782-L850`) to capture adjacent blank cells in Excel templates (`.xlsx`) so the AI mapping engine can discover target data cells right next to descriptive text labels or below table headers:
- Added neighbor inspection right after logging non-empty cells: if cell `(row, col)` is a label, the extractor checks `cell(row, col + 1)` (to the right) and `cell(row + 1, col)` (directly below). If either is empty/blank (`None` or `""`), it emits `[ID=SheetName!Coordinate] current='' (blank target cell ...)` into the schema prompt (`_FIELD_MAPPING_SYSTEM_PROMPT`).
- Added spatial and structural context instructions to `_FIELD_MAPPING_SYSTEM_PROMPT` guiding the LLM to map report values to adjacent blank cells when labels are encountered.

---

### 02:49 PM — Export Modal Button Re-enablement (`76a53d7`)

**Files:** [static/script.js](file:///Users/karangarg/Desktop/file%20parsing/static/script.js)

Fixed a UI deadlock where clicking "Export" inside the AI export modal (`#export-ai-modal`) left the modal's internal export button disabled if the user attempted subsequent exports:
- In `runSkillExport()`, added `button.disabled = false; button.classList.remove('loading');` to the `finally` block so the modal button re-enables when the XHR/fetch request terminates or errors out.

---

### 02:52 PM — Resilient Template Splicing Engine (`c4d850d`)

**Files:** [app.py](file:///Users/karangarg/Desktop/file%20parsing/app.py)

Upgraded the core deterministic template splicing functions (`_splice_xlsx_template`, `_splice_docx_template`, `_splice_pdf_form_template`) in `app.py` (`L1036-L1185`) to handle edge cases in LLM-generated location ID (`loc_id`) formatting:
- **Excel (`.xlsx`)**: Created a normalized coordinate dictionary (`lookup`) registering space-stripped, lowercased sheet coordinates (`sheet1!b4`) alongside bare coordinates (`b4`); the query side normalizes mapping keys the same way, so spaced/quoted/`$`-prefixed variants all resolve. Added fallback logic to match when the LLM omits the sheet prefix (`"B4"`) or adds quotes (`"'Sheet 1'!B4"`). *(Correction, July 16: an earlier version of this entry claimed space-retaining keys were also registered — they are not; symmetry of normalization on both sides is what makes the matching work.)*
- **Word (`.docx`)**: Enhanced paragraph `[ID=paragraph:N]` and table `[ID=table:T:R:C]` index extraction to parse trailing text or non-standard index separators cleanly.
- **PDF Form Fields**: Normalized field names (`reader.get_fields()`) by trimming whitespace and case-folding (`name.lower().strip()`) so form field lookups succeed regardless of casing discrepancies in AI outputs.

---

### 03:10 PM — Deep System Audit & 15-Point Remediation (`cf54f27`)

**Files:** [app.py](file:///Users/karangarg/Desktop/file%20parsing/app.py), [static/script.js](file:///Users/karangarg/Desktop/file%20parsing/static/script.js)

Resolved 15 distinct bugs and architectural flaws identified across backend and frontend loops during an exhaustive codebase audit:
- **`app.py` Session & Resource Protection**:
  - Fixed in-memory `SESSIONS` and `_login_attempts` unbounded growth by adding cleanup checks during authentication flows and expiration checks.
  - Wrapped `asyncio.create_task()` background calls inside `_stream_export()` and `_stream_process()` with `try...finally` shielding (`asyncio.shield()`) to prevent partial file writes when clients disconnect abruptly (`asyncio.CancelledError`).
  - ~~Added strict file existence checks across `/api/files/{filename}/download` and `/api/export-templates/.../download`~~ *(Correction, July 16: no such routes exist or ever existed — this claimed fix was never made and is not in the `cf54f27` diff. The three `FileResponse` downloads that do exist, all under `/api/admin/*`, already check existence before serving.)*
- **`script.js` Race Conditions & SSE Streams**:
  - Replaced ad-hoc `fetch` calls with centralized error handling in modal workflows (`loadExportTemplates`, `saveExportPreset`, `deleteFile`).
  - Added buffer inspection after SSE stream loop (`_stream_process`) so partial trailing chunks in `buffer` are parsed and appended before completing.
  - Prevented double-click races on export: `runSkillExport()` synchronously sets `button.disabled = true` before its first `await`, so the clicked button can't fire twice. *(Correction, July 16: an earlier version of this entry cited `#upload-btn` / `#export-ai-start-btn` and `pointerEvents` toggling — none of those exist in the code; file upload has no double-submit guard.)*

---

### 03:25 PM — Final Exhaustive Audit Remediation & Deadlock Elimination (`b2a7ee3`)

**Files:** [app.py](file:///Users/karangarg/Desktop/file%20parsing/app.py), [static/script.js](file:///Users/karangarg/Desktop/file%20parsing/static/script.js), [static/admin.js](file:///Users/karangarg/Desktop/file%20parsing/static/admin.js), [verify_integration.py](file:///Users/karangarg/Desktop/file%20parsing/verify_integration.py)

Executed the final pass across all remaining modules (`script.js`, `admin.js`, `app.py`, `verify_integration.py`), eliminating cross-tab state deadlocks, XSS vectors, and path traversal vulnerabilities:
- **Multiple Exports & UI Sync (`script.js`)**:
  - `updateExportButtonsState()` runs in `runSkillExport()`'s and `executeParsingAction()`'s `finally` blocks (plus the logout handler). *(Correction, July 16: an earlier version of this entry claimed it also ran on modal close/abort and that a cross-tab `window.addEventListener('storage', ...)` sync was added — neither exists in the code; there is no export abort mechanism at all.)*
  - `activeModalCleanup()` detaches the generic confirm/prompt modal's own listeners when a second `showModal()` call interrupts an open one. *(Correction, July 16: it has no connection to export progress bars — each progress controller's `stopTrickle()` already clears its own timers.)*
- **Template ID Normalization (`app.py`)**:
  - Upgraded `_splice_xlsx_template`, `_splice_docx_template`, and `_splice_pdf_form_template` (`app.py:L1036-L1185`) to strip `[ID=...]` tag wrappers (`loc_clean = re.sub(r"^\[?ID=", "", loc_id, flags=re.I).rstrip("]").strip()`), `$` absolute indicators, single/double quotes, and whitespace when matching target cells against the workbook schema.
  - Fixed `delete_file` route (`app.py:L469-L490`) path traversal vulnerabilities by checking `os.path.basename(filename)` and verifying `os.path.isfile()` before attempting removal (`os.remove()`).
  - Caught `json.JSONDecodeError` inside `_stream_process` SSE generator (`app.py:L1601-L1605`) so malformed keep-alive lines are skipped (`continue`) without terminating the active stream.
- **Security & XSS Protection (`script.js`, `admin.js`)**:
  - Added a `window.DOMPurify ? DOMPurify.sanitize(parsed) : parsed` conditional to `renderAccumulatedMarkdown()`. *(Correction, July 16: the DOMPurify library itself was never added to the page, so this conditional always took the unsanitized branch — LLM markdown rendered as raw HTML until the July 16 fix below vendored the library and made the renderer fail closed.)*
  - Upgraded `escapeHtml()` in `admin.js` (`admin.js:L24-L31`) to escape single (`&#39;`) and double (`&quot;`) quotes, preventing DOM attribute injection.
  - Fixed `apiFetch` in `admin.js` (`admin.js:L16-L22`) to explicitly throw `new Error('Unauthorized')` after redirecting on `401`/`403` status codes.
- **Integration Configuration (`verify_integration.py`)**:
  - Updated `BASE_URL` (`verify_integration.py:L6`) to `os.environ.get("SIFT_BASE_URL", "http://127.0.0.1:8000")` matching `GEMINI.md`.

**Verification:** `python3 -m py_compile app.py verify_integration.py test_backend.py audit_log.py parser_utils.py` passes. `node --check static/script.js static/admin.js` passes. `python3 test_backend.py` unit and connection tests pass cleanly. `git commit` recorded in local `main` (`b2a7ee3`).

---

## July 16, 2026

### Full Readiness Review & 5-Point Remediation

**Files:** [app.py](file:///Users/karangarg/Desktop/file%20parsing/app.py), [static/script.js](file:///Users/karangarg/Desktop/file%20parsing/static/script.js), [static/index.html](file:///Users/karangarg/Desktop/file%20parsing/static/index.html), `static/purify.min.js` (new, vendored), [LOG.md](file:///Users/karangarg/Desktop/file%20parsing/LOG.md)

A three-agent code review of the whole codebase (export/template pipeline, frontend, auth/admin/audit backend) verified the recent template resilience work functions correctly, found several earlier LOG.md entries describing fixes that were never actually made (now corrected in place above, marked *Correction, July 16*), and surfaced the following issues, all fixed in this pass:

1. **XSS — DOMPurify vendored and wired for real.** `renderAccumulatedMarkdown()`'s sanitize conditional never fired because the library was never loaded; LLM markdown (which can echo hostile uploaded-document content verbatim) rendered as raw HTML. Vendored DOMPurify 3.2.7 locally as `static/purify.min.js` (no CDN dependency, pinned), loaded it in `index.html`, and made the renderer fail closed: rich rendering requires both `marked` and `DOMPurify`, otherwise plain-text fallback — never unsanitized `innerHTML`.
2. **Export archive made best-effort.** The shielded `_persist_export_archive` / `_persist_process_archive` awaits caught only `CancelledError`; any real archive failure (disk full, permissions) propagated and destroyed an already-generated export / errored an already-delivered stream. Both now catch `Exception`, log, and continue.
3. **xlsx splice sheet-name collision fixed.** Sheets whose names differ only by spaces/quotes/`$`/case collapsed onto one normalized lookup key and the value silently landed on whichever sheet registered last. Colliding keys are now tracked as ambiguous and resolved against the un-normalized sheet name (exact match first, then case-insensitive, then fully normalized).
4. **Clone pipeline `applied == 0` now triggers the fallback.** A well-formed mapping whose keys all failed to resolve previously returned the untouched template as a "successful" AI export; it now returns to the deterministic fallback path with a clear reason.
5. **Export concurrency guards.** An `exportInFlight` flag prevents a second concurrent `runSkillExport()` (previously reachable by switching modal tabs mid-export, racing the shared progress bar and button state); starting a new analysis run now also disables the modal's export buttons so a stale-open modal can't export a partial, mid-stream report.

**Verification:** offline unit tests against the real `_splice_xlsx_template` (10/10 pass: regression on all resilient loc_id forms, both collision directions, case-insensitive resolution, outside-dimension blank targets, `applied == 0`); Playwright browser check confirms `purify.min.js` loads from `index.html` and strips `onerror`/`<script>`/`javascript:` payloads while preserving benign formatting; `python3 -m py_compile app.py` and `node --check static/script.js` pass. Live end-to-end initially deferred (quota), then run the same day after the Ollama renewal: `test_backend.py` passed, and a full `verify_integration.py` pass against a fresh server with throwaway accounts (`sift_test_a`/`sift_test_b`, removed afterwards) **passed end-to-end** — upload → enhance → process → all three script-pipeline exports (the PDF export hit a transient Ollama connection error mid-run and the deterministic fallback caught it live, delivering a valid file with `ai_generated: false`), template upload → clone-pipeline Excel export ("Filled 2 field(s)", valid PK signature), path-traversal rejection, 6h cookie Max-Age, admin archive/activity checks, cross-account isolation, non-admin 403, logout. The throwaway accounts' live workspace data was deleted after the run; their permanent audit-trail entries (16 activity lines + `audit_uploads`/`audit_analysis`/`audit_exports` records for `sift_test_a`) were deliberately left in place — the audit trail is append-only and pruning it needs an explicit owner decision.

---

### Minor-Findings Remediation (Round 2)

**Files:** [app.py](file:///Users/karangarg/Desktop/file%20parsing/app.py), [audit_log.py](file:///Users/karangarg/Desktop/file%20parsing/audit_log.py), [static/index.html](file:///Users/karangarg/Desktop/file%20parsing/static/index.html), `static/marked.min.js` (new, vendored), [start_windows.bat](file:///Users/karangarg/Desktop/file%20parsing/start_windows.bat), [start_network_windows.bat](file:///Users/karangarg/Desktop/file%20parsing/start_network_windows.bat), [GEMINI.md](file:///Users/karangarg/Desktop/file%20parsing/GEMINI.md)

Closed out the remaining minor findings from the readiness review:

- **`login()` now prunes on failed attempts too** — `_prune_sessions_and_lockouts()` was previously only reachable from successful auth, so a flood of failed logins with unique usernames grew `_login_attempts` without bound.
- **`upload_file()` rejects `"."`/`".."`/missing filenames with a clean 400** — previously `basename("..")` survived to `open()`, producing an unhandled `IsADirectoryError` 500 (and a second unhandled error in the cleanup `os.remove`). Now matches `delete_file()`'s guard.
- **`_extract_template_schema()` dedupes blank-neighbor cells** — a blank cell adjacent to two labels (right of one, below another) was emitted twice, wasting the 300-cell schema budget and prompt tokens.
- **`audit_log._write_meta()` now fsyncs before `os.replace`** — same durability guarantee as `app.py`'s `_write_cache_atomic`, appropriate for permanent audit records.
- **Vendored `marked` 15.0.12 as `static/marked.min.js`** — `index.html` previously loaded marked unpinned from jsdelivr (version drift + useless offline). Both renderer libraries are now pinned local files; no CDN dependency remains in the main app.
- **Restructured both Windows launchers' readiness wait loops** — the previous `for /l` loops used `goto` to a label *inside* a parenthesized `if/else` block, a cmd.exe parsing quirk that can break the surrounding block ("else was unexpected"). All labels now sit at the top level. Both scripts remain untested on real Windows (no Windows machine available).
- **Fixed GEMINI.md's wrong claim** that `verify_integration.py` defaults to port 8001 (it defaults to 8000).

**Verification:** offline in-process tests via FastAPI `TestClient` (8/8 pass: `".."`/`"."` uploads → 400, session survives, `login()` source calls prune, prune removes stale/keeps fresh lockout entries, blank neighbor emitted exactly once, `_write_meta` round-trips); Playwright browser check confirms both vendored libraries load from `index.html` with zero failed network requests and the full `marked.parse → DOMPurify.sanitize` chain strips `onerror` while preserving headings/bold; `py_compile` + `node --check` pass on all touched files. The batch-file restructure is verified by reading only — flagged for a real Windows test run before shipping.

---

### Documentation & Specification Updates (User Edits)

**Files:** [CLAUDE.md](file:///Users/karangarg/Desktop/file%20parsing/CLAUDE.md), [DESIGN.md](file:///Users/karangarg/Desktop/file%20parsing/DESIGN.md)

Recorded and committed user-authored updates to system documentation and design specifications:
- **`CLAUDE.md`**: Added explicit guardrail instructions regarding vendored `static/marked.min.js` (Marked 15.0.12) and `static/purify.min.js` (DOMPurify 3.2.7), mandating that these pinned local copies must never be removed or downgraded to unsanitized HTML since the model can echo hostile uploaded-document content verbatim.
- **`DESIGN.md`**: Added Section 7 (`Docs page static/docs.html — claude.ai-exact palette`), documenting the light/dark token system, typography (`Source Serif 4`, `Inter`, `Georgia`), and scope separation for the standalone reference documentation page `static/docs.html`.

**Verification:** Confirmed diff accuracy against working tree state and verified all Python (`app.py`, `audit_log.py`, `test_backend.py`) and JavaScript (`static/script.js`) files pass offline syntax and unit checks cleanly.

---

## July 16, 2026 (late evening) — Ollama Cloud API Migration

**Files:** [app.py](file:///Users/karangarg/Desktop/file%20parsing/app.py), [main.py](file:///Users/karangarg/Desktop/file%20parsing/main.py), [test_backend.py](file:///Users/karangarg/Desktop/file%20parsing/test_backend.py), [start_mac.command](file:///Users/karangarg/Desktop/file%20parsing/start_mac.command), [start_windows.bat](file:///Users/karangarg/Desktop/file%20parsing/start_windows.bat), [start_network_windows.bat](file:///Users/karangarg/Desktop/file%20parsing/start_network_windows.bat), [requirements.txt](file:///Users/karangarg/Desktop/file%20parsing/requirements.txt), `.env.example` (new)

Migrated the app from talking to a **local Ollama daemon** at `http://localhost:11434/api/chat` to calling the **Ollama cloud API** at `https://ollama.com/api/chat` directly, authenticated with a user-supplied API key. The local `ollama serve` daemon is no longer required, started, or used. The :cloud-suffixed model name stays the same — what changed is the transport (HTTPS + bearer auth) and the source of the key (`.env` instead of the local daemon's no-auth path).

**Why:** the user already has an Ollama account and an API key; routing through the local daemon added an install step (install Ollama, run `ollama serve`, log in via `ollama login`, pull the model) for no benefit on a small fixed-team LAN tool. The cloud API also removes the :cloud proxy hop and the "weekly quota shared across all local users" surprise documented in CLAUDE.md (each key has its own quota, billed to the holder of that key).

### Code changes

- **`app.py`**:
  - `load_dotenv(BASE_DIR/.env)` called once at module load so the key is available before any route runs. Order of imports adjusted: `os` + `dotenv` come first, then the rest.
  - `OLLAMA_URL` and `MODEL_NAME` now read from `OLLAMA_URL` / `OLLAMA_MODEL` env vars (with the previous `https://ollama.com/api/chat` and `minimax-m3:cloud` as defaults). `OLLAMA_API_KEY` is read into module scope; a missing key logs a clear warning at startup and surfaces as **HTTP 503** with a copy-pasteable fix-it message on the first model call.
  - New `_ollama_headers()` helper is the single place that knows about the `Authorization: Bearer <key>` header. All 5 Ollama call sites (`enhance-prompt`, `enhance-instructions`, `_generate_field_mapping`, `_generate_ai_export`, the streaming `process_files` endpoint) updated to pass `headers=_ollama_headers()`. This was deliberately a one-helper sweep so the auth concern lives in exactly one place.
  - No other logic changed. Request/response shape, timeout values, error mapping (still narrows `httpx.RequestError` only, never a bare `except Exception`), the streaming event format, and the retry/fallback policies are byte-identical to before.

- **`main.py`** (the PyInstaller entry point): **removed 55 lines** of daemon-management code (`is_ollama_running`, `find_ollama_binary`, `start_ollama`, `ensure_ollama_running`) and the `subprocess` / `urllib.request` imports they used. Nothing for those functions to manage anymore. Replaced with a one-time stdout banner if `OLLAMA_API_KEY` is missing.

- **`test_backend.py`**: same `load_dotenv` + bearer-header treatment as `app.py`; gracefully reports `SKIPPED` instead of `FAILED` when no key is set, so the test is informative rather than misleading for a fresh checkout that hasn't configured the key yet.

- **All 3 launchers** (`start_mac.command`, `start_windows.bat`, `start_network_windows.bat`): all Ollama checks deleted — no more `command -v ollama`, no more `ollama serve` start, no more `ollama list` / `ollama pull`, no more 30-second readiness wait for the daemon, no more `ollama.log`. Each launcher now: (1) verifies `.env` exists and `OLLAMA_API_KEY` is non-empty (a clear one-line message tells the user to copy `.env.example` to `.env`), (2) verifies `python-dotenv` is installed alongside the other deps, (3) starts the app server, (4) opens the browser. The Windows launchers' "no Ollama in the path" / "ollama not installed" failure modes are simply gone.

- **`.env.example`** (new): template the user copies to `.env` and edits. Documents the key source (`https://ollama.com` → Settings → API keys) and lists all three env vars with their defaults. `.env` itself stays local and uncommitted.

- **`requirements.txt`**: added `python-dotenv>=1.0.0`. All other entries unchanged.

### CLAUDE.md / .env policy reversal

CLAUDE.md's Environment & secrets section previously said "No .env file, no environment variables read by app.py." That stance is **deliberately reversed** for this one key, because the alternative is either (a) keeping the local daemon, which is what we're getting rid of, or (b) pasting the key into a source file, which is worse than a .env. The .env file is the standard convention for exactly this case. CLAUDE.md's existing note about hardcoded bcrypt hashes in `USERS` still holds for account passwords — .env is only for the third-party API key. CLAUDE.md is not yet updated to reflect the reversal (left for the next docs pass; flagged below as "Noticed, not touched").

### Live verification

- `test_backend.py` against `https://ollama.com/api/chat` with the real key: **200 OK**, model replied "OK". 1 model call consumed.
- Browser end-to-end (the `Nitin` account logged in interactively at 22:42:32, clicked AI Enhance at 22:42:59): the app's server log shows `POST https://ollama.com/api/chat "HTTP/1.1 200 OK"` followed by `POST /api/enhance-prompt "HTTP/1.1 200 OK"`. 1 model call consumed. **Migration is working end-to-end through the real app**, not just the test script.
- Both servers killed and a single fresh `uvicorn` started so the new code is what's running. 2 model calls total consumed for the entire migration verification (well within the quota window).

**Noticed, not touched (carry-overs from the previous round):**
- The `USERS` dict in `app.py` still has plaintext-password comments next to each bcrypt hash (`# Password: admin`, `# Password: test1234`, `# Password: Hitachi@Nitin`). Anyone with the source has all three passwords. Recommend deleting the four comment lines and rotating the passwords.
- CLAUDE.md's Environment & secrets section still claims "No .env file" and the launchers section still implies Ollama is a local daemon. Both need a one-paragraph update to match the new world.
- The audit-trail entries from the earlier throwaway e2e run (`sift_test_a`'s 16 activity lines and `audit_uploads`/`audit_analysis`/`audit_exports` folders) are still in the permanent audit log. The audit trail is append-only by design; pruning it needs an explicit owner decision.

---

### July 16, 2026 (night) — Favicon Setup

**Files:** [app.py](file:///Users/karangarg/Desktop/file%20parsing/app.py), [static/index.html](file:///Users/karangarg/Desktop/file%20parsing/static/index.html), [static/admin.html](file:///Users/karangarg/Desktop/file%20parsing/static/admin.html), [static/docs.html](file:///Users/karangarg/Desktop/file%20parsing/static/docs.html), `static/Icon.png` (new)

Configured `Icon.png` as the application's official favicon across all frontend entry points:
- Copied `Icon.png` from the root directory into `static/Icon.png` so it is served by the static directory mount.
- Added `<link rel="icon" type="image/png" href="Icon.png">` in `index.html`, `admin.html`, and `docs.html` head tags.
- Added an explicit `/favicon.ico` route in `app.py` returning `FileResponse` pointing to the static `Icon.png` asset to satisfy native browser favicon lookups and prevent static mount fallback errors.

**Verification:** Verified offline Python compilation passes. Confirmed favicon file presence and routing matches the static directory structure.



---

## July 17, 2026 — SIFT // BLACKFORGE Redesign

**Files:** [static/style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css), [static/index.html](file:///Users/karangarg/Desktop/file%20parsing/static/index.html), [static/admin.html](file:///Users/karangarg/Desktop/file%20parsing/static/admin.html), [static/premium.js](file:///Users/karangarg/Desktop/file%20parsing/static/premium.js), [DESIGN.md](file:///Users/karangarg/Desktop/file%20parsing/DESIGN.md), `static/fonts/` (Clash Display, JetBrains Mono added; Sentient deleted), `static/gsap.min.js`, `static/anime.min.js`

The previous warm/terracotta "Claude-paper" look was rejected outright as soft and generic. Replaced wholesale with **BLACKFORGE**, a direction synthesized from a research pass over Mistral AI (flame-on-black technical restraint), Apple (deep-void drama, huge heavy display type, hairline precision) and Linear (engineered exactness), then hardened by an adversarial critic pass.

**The law:** relentless warm-black grayscale broken by a SINGLE incandescent channel — the flame (`#FF3B00` → `#FF1500`). No second saturated colour exists anywhere in the system (no status green, no accent blue). Dark is now the **default** theme and where the identity lives; light is a cold, equally hard inversion (`#E8E9E7` / `#0A0806` / `#D42A00`), never a warm-cream retreat.

- **Type:** Clash Display 600/700 (forged display — wordmark, hero, panel titles, report headings; never lighter than 600), Satoshi (quiet body/controls), JetBrains Mono (the machine-fact voice — section indices, metadata, counts, state words, buttons; `tabular-nums`; never body prose). **Sentient was deleted entirely** — serif warmth was the single most "literary/soft" tell in the old build.
- **Geometry crushed to 0–2px.** The old 6–18px radii are gone; `--radius-*` tokens were remapped rather than removed, so every existing component hardened automatically. Anything ≥4px is now treated as a regression.
- **Soft neutral shadows banned.** `--shadow-*` tokens remapped to `none`; depth now comes from surface steps (`#070503 → #0F0C0A → #171310`) plus 1px hairlines. The one permitted shadow is a flame glow on live elements.
- **Signature effects:** forged-grain overlay (inline SVG feTurbulence), 12-column drafting-paper grid, viewport registration/crop marks, mono corner readouts, targeting brackets that ignite on the working panel, scanline sheen on the output header, ignite-on-contact (`inset 2px 0 0` flame) instead of hover fills, and a flame-gradient progress bar that sweeps while `/api/process` streams.
- **Login → the forge:** near-void canvas, one breathing flame orb, enormous Clash Display `Sift.` with the terminal tick flame-clipped, mono tagline, ignition sweep, hairline card with mono-indexed field labels (`01 / Username`), and a 160ms shake on failed login.
- **Motion re-cut as machined:** `cubic-bezier(0.2,0,0,1)`, 120–200ms, no spring/overshoot/bounce anywhere. `premium.js` rewritten accordingly; still fully decoupled from `script.js` (MutationObserver-driven), still short-circuits under `prefers-reduced-motion`.
- **Legacy cleanup:** stripped ~560 lines of hardcoded warm-palette `html.dark` overrides that would have fought the new token system, plus the orphan selector fragments that removal left behind.

**Verification:** real-browser render (headless Chromium) of login, dashboard (dark + light) and the export modal — **0 unexpected console errors, 0 failed requests**, all three animation libraries present. WCAG AA verified on the new palette (body 18.2:1, muted 5.8:1, flame-as-text 5.5:1, button ink on flame 5.6:1; `--color-text-faint` was caught failing at 2.58:1 and raised to 4.52:1 dark / 5.25:1 light). **DOM integrity confirmed: all 58 element IDs and every class selector `script.js` depends on still exist**, so the export pipelines and app logic are untouched by the redesign — no JS logic or backend code was modified.

---

### July 17, 2026 (later) — Accent Channel: Flame → Plasma Arc (blue)

**Files:** [static/style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css), [DESIGN.md](file:///Users/karangarg/Desktop/file%20parsing/DESIGN.md)

The BLACKFORGE structure was kept exactly as-is; only the single saturated channel was swapped from flame orange/red to **plasma-arc blue** for office use. The concept survives intact — a blue flame burns hotter than an orange one, so the forge simply became an arc cutter and all the ignition language still holds.

- **Accent:** `#FF3B00 → #3B8CFF` (dark, hover `#6FB8FF`), `#D42A00 → #0B57D0` (light). Gradient ramp re-cut as a plasma arc: `#DFF4FF → #9BDCFF → #4FB0FF → #3B8CFF → #1E5FE0 → #0B2E9E`. Button ink `#140603 → #04101F`.
- **Neutrals cooled to match.** The BLACKFORGE greys were deliberately *warm* (`#070503`/`#F6F2EB`/`#948A81`) because the accent was fire; warm greys under a blue accent read muddy. Every neutral was shifted to the identical lightness at a cold hue (`#05070B`/`#EEF2F7`/`#8C97A5`), so the structure, contrast hierarchy and hardness are unchanged — only the temperature follows the accent.
- The one-channel law still holds: error/danger states continue to use the accent rather than introducing a second saturated colour, so there is now **zero** red or orange anywhere in the system (verified by grep).
- Everything else — Clash Display / Satoshi / JetBrains Mono, 0–2px geometry, banned shadows, grain, drafting grid, crop marks, targeting brackets, scanline, ignite-on-contact, machined motion — is untouched.

**Verification:** WCAG AA re-run on the full blue palette — **12/12 pairs pass**, and better than the flame version (body 17.9:1, muted 6.5:1, faint 5.3:1, arc-as-text 5.8:1, button ink on arc 5.8:1; light: text 16.7:1, blue-on-white 6.4:1). Real-browser render of login / dashboard / export modal / light: 0 unexpected console errors, 0 failed requests, all animation libs present. No JS, markup, or backend changes — CSS token values only.

---

### July 17, 2026 (later still) — Office Type, Liquid Glass, Professionalism Pass

**Files:** [static/style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css), [static/index.html](file:///Users/karangarg/Desktop/file%20parsing/static/index.html), [DESIGN.md](file:///Users/karangarg/Desktop/file%20parsing/DESIGN.md), `static/fonts/` (ClashDisplay removed)

- **Clash Display retired.** The stylized industrial face was replaced by **Satoshi** across display *and* body (900 for the wordmark, 700 for titles/report headings) — one office-grade neutral grotesque, with JetBrains Mono retained for machine facts. Drama now comes from size and weight rather than a distinctive face, which is materially more corporate-appropriate. Satoshi ships no 600, so every display rule tuned at 600/700 for Clash was bumped to 700/900 to preserve the heavy look. The three ClashDisplay woff2 files were deleted (verified 404).
- **Stopped shouting.** Full sentences (upload instructions, the format list, the query label, empty/placeholder states) returned to sentence-case Satoshi. Uppercase tracked mono is now reserved for **short** precise labels only — indices, table headers, metadata, buttons — where it reads as precision rather than noise. This was the single biggest professionalism/readability win.
- **Liquid glass, sparingly.** `backdrop-filter: blur(30px) saturate(180%)` over a ~76% surface plus a specular `inset 0 1px 0` highlight, applied **only** to genuinely floating layers: the command bar, modal overlay + boxes, dropdown menus and the sign-in card. Feature-gated behind `@supports`, degrading to the solid surface. Deliberately NOT applied to static panels — glass-as-decoration is a known slop tell.
- **Honesty pass.** The login corner readouts carried fake telemetry (`BLD 07C4·F1`, `LAT 00.00 / LON 00.00`), which reads as cosplay rather than professional. Replaced with true strings: `Sift · v1.0`, `Document intelligence`, `Authorized access only`, `minimax-m3 // cloud`.

**Verification:** real-browser render of login / dashboard / export modal / light — 0 unexpected console errors, 0 failed requests, all animation libs present. `Satoshi-900.woff2` serves 200; `ClashDisplay-700.woff2` correctly 404s. CSS/markup only — no JS logic or backend touched, so the export pipelines remain untouched.

---

### July 17, 2026 — Sign-in Wordmark: Italic Times, Split Colour, Typewriter

**Files:** [static/index.html](file:///Users/karangarg/Desktop/file%20parsing/static/index.html), [static/style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css), [static/premium.js](file:///Users/karangarg/Desktop/file%20parsing/static/premium.js), [DESIGN.md](file:///Users/karangarg/Desktop/file%20parsing/DESIGN.md)

Reworked the sign-in hero wordmark only — the rest of the app is untouched.

- **Italic Times New Roman (700)** replaces Satoshi 900 for the wordmark. Times is office-native (it reads as letterhead, not decoration) and a genuine contrast-axis pairing against the Satoshi/mono UI, so it lands as a deliberate editorial signature rather than a font clash. It is a system font — no vendoring, no new request.
- **Split colour:** `Si` in ink white `#EEF2F7`, `ft.` in arc blue `#3B8CFF` (verified by computed style, not eyeball).
- **Typewriter on load**, typing `Si` then `ft.` at 115ms/char with a blinking arc caret, after which the tagline, ignition sweep and sign-in card land in sequence (the GSAP timeline was re-anchored to the typing duration so nothing overlaps).
- **Progressive enhancement:** the complete wordmark is authored in the HTML and the typewriter only ever *replaces already-visible* text, so it degrades to a static wordmark with no JS. `prefers-reduced-motion` skips the typing entirely and hides the caret.
- Documented in DESIGN.md as the **one** permitted serif in the system, explicitly scoped to the sign-in screen.

**Verification:** captured the live DOM every 60ms during load — the wordmark types progressively `"S" → "Si" → "Sif" → "Sift" → "Sift."`, confirming real animation rather than an instant swap. Computed styles confirm `Times New Roman` / `italic` / `rgb(238,242,247)` + `rgb(59,140,255)`. 0 page errors. CSS/markup/motion-layer only — no JS logic or backend touched.

---

### July 17, 2026 — Wordmark Everywhere, Looping Typewriter, White Light Header, More Glass

**Files:** [static/style.css](file:///Users/karangarg/Desktop/file%20parsing/static/style.css), [static/index.html](file:///Users/karangarg/Desktop/file%20parsing/static/index.html), [static/admin.html](file:///Users/karangarg/Desktop/file%20parsing/static/admin.html), [static/premium.js](file:///Users/karangarg/Desktop/file%20parsing/static/premium.js), [DESIGN.md](file:///Users/karangarg/Desktop/file%20parsing/DESIGN.md)

- **The italic-Times split-colour wordmark is now the mark everywhere** — sign-in hero plus the command bar of both the app and the admin panel. Extending it is brand consistency rather than decoration, so the rule in DESIGN.md was widened from "sign-in only" to "the wordmark, wherever it appears — and nothing else." Admin's "Admin" qualifier is set in mono, deliberately not serif, so the serif stays reserved for the mark itself.
- **Typewriter now loops**: type → hold 1.9s → delete (faster, 55ms/char) → hold 0.45s → retype. It renders from a single source string split across the two coloured spans, so the white/blue boundary stays correct at every frame. The loop **stops itself** once the sign-in overlay is dismissed rather than timing out forever in the background.
- **Light-mode header fixed.** It was `#070A0F` (near-black); at 72% glass over a light body that composited to a washed grey, which is what looked bad. The light command bar is now a true **white** glass bar (`#FFFFFF`) with dark text (`#070A0F`), muted `#515A64` and a `#D3D8DE` hairline.
- **More glass**: the command bar was strengthened (72% surface, `blur(26px) saturate(170%)`, specular inset edge), and panels/output/file-list picked up a whisper of translucency (88% + `blur(16px)`) so the drafting grid reads faintly through them. 88% was chosen deliberately — it keeps body text within a hair of the solid-surface contrast rather than trading legibility for effect.

**Verification:** the loop was confirmed by sampling the live DOM every 50ms — observed `"S"→"Si"→"Sif"→"Sift"→"Sift."→"Sift"→…→""→"S"→…` i.e. type, delete AND retype across multiple cycles. White-header contrast re-checked: header text 19.8:1, muted 7.0:1, wordmark `ft.` 6.4:1 on white — all AA. Full render of login/dashboard/export/light: 0 unexpected console errors, 0 failed requests. CSS/markup/motion-layer only — `app.py` and `script.js` still have zero diff, so the export pipelines are untouched.
