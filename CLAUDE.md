<!--
PLACEMENT: <repo-root>/CLAUDE.md — loaded whenever Claude works anywhere in this repo.
Layers on top of ~/.claude/CLAUDE.md (the method). Repeat nothing from there.

WHAT THIS FILE IS FOR: a project file exists to do exactly two things —
  (1) save the search: facts a fresh session would otherwise spend ten minutes
      rediscovering (commands, entry points, where things live);
  (2) prevent the mistake: facts a fresh session could NOT discover by reading code —
      the intentional weirdness, the landmines, the things that bite.
Everything else — anything derivable from ten minutes with the code — is bloat that
costs context every session. When in doubt, leave it out; the code is the documentation
of the code.
-->

# Sift

A single-screen FastAPI dashboard that uploads documents (PDF/DOCX/DOC/XLSX/XLS/PPTX/
images/text/RTF/ODT), parses them (OCR for images), refines user prompts and streams AI
analysis via a **local** Ollama instance (`minimax-m3:cloud`). Video files are explicitly
rejected.

**Local/LAN tool, meant to be shipped to and run by someone else on their own machine,
shared with a small fixed team over the network behind login** — no cloud deployment,
no signup/registration, no database. Every account is hardcoded in `app.py`'s `USERS`
dict (see Authentication below); each account gets fully isolated per-user storage, so
this is now explicitly multi-tenant among a *small, known, pre-approved* set of people
— not open to the internet, not open registration. `start_mac.command` /
`start_windows.bat` are double-click launchers that start Ollama + the app server and
open the browser, so the recipient doesn't need to touch a terminal. Actively developed,
no CI — functional end-to-end (verified 2026-07-07: unit smoke test, full live
integration test, and both cold-start and already-running paths of the macOS launcher
all pass against real Ollama calls; auth + per-user isolation verified live 2026-07-14;
6h session TTL + permanent audit trail + admin panel verified live 2026-07-14 — offline
unit tests, a full live HTTP pass exercising every `/api/admin/*` endpoint plus 403/404/
path-traversal edge cases, and a Playwright browser pass of `admin.html`, all against
real Ollama calls, see Flows and Authentication).

## Commands

| Task            | Command                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Easiest start    | Double-click `start_mac.command` (macOS) or `start_windows.bat` (Windows) — starts Ollama + the server and opens the browser. Safe to run again; detects what's already up. |
| Install          | `python3 -m pip install -r requirements.txt --break-system-packages` (use `python3 -m pip`, not bare `pip` — see Gotchas) |
| Dev server       | `python3 -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload` (port 8000; needs Ollama running locally with `minimax-m3:cloud` pulled) |
| Unit/smoke tests | `python3 test_backend.py` — checks Ollama connectivity + parser round-trip, no server needed, ~2s |
| Full e2e test    | `python3 verify_integration.py` — **requires the dev server already running** on 127.0.0.1:8000; logs in first (every endpoint requires it now), then exercises upload → enhance → process → export for real, plus a second-account isolation check. |
| Compile Mac      | `sips -s format icns Icon.png --out Icon.icns && pyinstaller --onefile --add-data "static:static" --icon Icon.icns main.py` — full walkthrough + Gatekeeper note in `COMPILE_MAC.md` |
| Compile Windows  | `python -c "from PIL import Image; Image.open('Icon.png').save('Icon.ico', format='ICO')"` then `pyinstaller --onefile --add-data "static;static" --icon Icon.ico main.py` — full walkthrough + SmartScreen note in `COMPILE_WINDOWS.md` |

No lint/typecheck/build/DB-migration tooling exists in this repo — don't invent one.

## Definition of done

1. `python3 test_backend.py` passes.
2. If an API endpoint or the upload/parse/process flow changed: start the dev server
   and run `python3 verify_integration.py` against it — must pass end-to-end (real
   Ollama call, not mocked).
3. If the frontend changed: load `http://127.0.0.1:8000` in a browser and exercise the
   upload → enhance → run → export flow for real.
4. If either launcher script changed: actually run it (don't just read it) — for
   `start_mac.command`, test both the cold-start path (Ollama and the server both
   stopped first) and the already-running path.

## Map

- Entry: `app.py` — FastAPI app: every `/api/*` route except `/api/login`/`/api/logout`
  requires a valid session (`Depends(get_current_user)`), Ollama HTTP calls (local),
  SSE streaming. Paths are relative to
  `BASE_DIR = os.path.dirname(os.path.abspath(__file__))`, not hardcoded — so the app
  still works if this folder is moved or copied to someone else's machine.
- `parser_utils.py` — single function `extract_text_from_file()`, dispatches by
  extension; add new format support as another `elif` branch here, not a new module.
- `static/index.html`, `static/style.css`, `static/script.js` — the whole frontend,
  including the login screen. Vanilla JS, no build step, no bundler.
  `static/marked.min.js` (Marked 15.0.12) and `static/purify.min.js`
  (DOMPurify 3.2.7) are vendored, pinned local copies — no CDN dependency, so
  the app renders markdown fully offline. DOMPurify sanitizes LLM markdown
  before `innerHTML` injection in `renderAccumulatedMarkdown()`, which fails
  closed to plain text if either library is missing. Don't remove them or
  downgrade the renderer to unsanitized HTML: the model can echo hostile
  uploaded-document content verbatim, and this app is multi-tenant behind
  login.
- `start_mac.command` / `start_windows.bat` — double-click launchers (see Flows).
- `test_backend.py` — offline-ish smoke test (Ollama ping + parser round-trip). Doesn't
  touch auth - unaffected by login being required now.
- `verify_integration.py` — live e2e test, hits a running server on port 8000; logs in
  first (every endpoint now requires it) and includes a second-account isolation check.
- `uploads/<user>/`, `parsed_cache/<user>/`, `presets/<user>.json`,
  `export_templates/<user>/`, `export_presets/<user>.json` — **per-user** server-side
  runtime data (see Do not touch and Authentication). Every one of these used to be a
  single shared file/directory for the whole app; each is now namespaced by the
  logged-in username, so cross-account access is structurally impossible (no shared
  path exists to even guess at), not just permission-checked after the fact.
- `audit_log.py` — single module owning the **permanent, admin-only audit trail**:
  `logs/activity.jsonl` (append-only, one JSON line per login/upload/delete/process/
  export/preset event) and `audit_uploads/<user>/`, `audit_analysis/<user>/`,
  `audit_exports/<user>/` (permanent per-user copies of uploaded files, generated
  analysis text, and exported documents — kept even after the user deletes/discards
  them in their own live workspace). See Flows and Do not touch.
- `static/admin.html` + `static/admin.js` — the admin panel, a standalone page at
  `/static/admin.html` sharing no JS/DOM state with `script.js`. Gated by
  `is_admin` on the logged-in account (see Authentication); reads only from
  `audit_log.py`'s archive/log, never a user's live workspace.
- `main.py` — **only** used as the PyInstaller entry point (see Compile Mac/Windows
  above and `COMPILE_MAC.md`/`COMPILE_WINDOWS.md`); imports `app` from `app.py` and
  runs it via `uvicorn.run()` plus an Ollama auto-start + browser-open. Not part of the
  normal dev flow (`uvicorn app:app` / the launcher scripts don't touch it) — nobody is
  actively compiling with it right now, but keep it working since the compile docs
  depend on it.
- `ARCHITECTURE.md` — deep-dive technical docs (network flow, request-flow diagrams for
  upload/process/export, the two export pipelines, audit-trail data flow) generated for
  a broader technical audience than this file. Update it alongside this file when a
  flow it diagrams changes shape, but don't duplicate its content here.

Flows worth tracing before touching them:

- Login: `POST /api/login` checks `{username, password}` against `USERS` (bcrypt,
  constant-time even for unknown usernames via `_DUMMY_PASSWORD_HASH`), on success
  creates an in-memory session (`_create_session()`) and sets an `HttpOnly`/
  `SameSite=Lax` cookie (`SESSION_COOKIE_NAME`). `GET /api/me` (used by the frontend's
  `checkAuth()` on every page load) and every other `/api/*` route depend on
  `get_current_user()`, which reads that cookie and looks up the session table
  (`_get_session_user()`) — a 401 anywhere means "not logged in or session expired,"
  and the frontend's `apiFetch()` wrapper centrally re-shows the login screen on any
  401 from an already-loaded page. `POST /api/logout` clears the session server-side
  and deletes the cookie; it does NOT require a valid session itself (an
  already-expired cookie should still successfully log out client-side).
- Upload: `POST /api/upload` (session required) → saves to `user_upload_dir(user)` →
  `extract_text_from_file()` → writes `<file>.txt` under `user_cache_dir(user)` (atomic
  write via `_write_cache_atomic()`).
- Process: `POST /api/process` reads **every** `.txt` file currently in the
  **current user's own** `user_cache_dir(user)` only (sorted by name), concatenates
  them as citation-tagged context, then streams from `http://localhost:11434/api/chat`.
  This is the flow where cross-user leakage would matter most if the per-user scoping
  were ever accidentally reverted to a shared directory — it used to read one global
  `parsed_cache/` before the multi-account rework.
- Presets (analysis-query prompts): `GET/POST/DELETE /api/presets[/{name}]`
  read-modify-write **that user's own** `presets/<username>.json` dict keyed by name
  (`_load_presets_sync(presets_file)` + `_write_cache_atomic()`) — saving under an
  existing name overwrites it.
- Export instructions: the panel-3 "Export PDF/Excel/Word" buttons **are** the entry
  point into the instructions modal (`#export-instructions-overlay` in
  `static/index.html`) — there is no separate header button anymore (removed when the
  two were merged; `openExportModal(fmt)` takes the clicked format and lands directly
  on that tab, e.g. clicking "Export Excel" opens the modal already on the Excel tab).
  The modal has a PDF/Excel/Word sub-tab each, mirroring the analysis-query preset UX
  (textarea, AI Enhance, preset dropdown) plus an optional template-file upload and its
  own "Export as <format>" button inside each tab — that in-modal button is the only
  thing that actually triggers the export; clicking the panel-3 button just opens/
  switches the modal. Leaving instructions empty and no template attached and clicking
  "Export as <format>" reproduces the old one-click behavior exactly (same script
  pipeline, same prompt) — nothing about the export logic changed, only how you reach
  it. `POST /api/export-templates` (multipart) stashes an uploaded `.xlsx`/`.docx`/
  `.pdf` under **that user's own** `export_templates/<username>/<uuid>.<ext>` and
  returns that server-side filename — the client never sends back a path, only that
  opaque filename, and it only ever resolves inside the uploading user's own directory
  (`_template_path(username, filename)`).
  `GET/POST/DELETE /api/export-presets[/{name}]` read-modify-write **that user's own**
  `export_presets/<username>.json` (**a separate file from `presets/<username>.json`**
  — different schema, different semantics, deliberately not merged), each entry storing
  `{format, instructions, template_filename,
  template_original_name, updated_at}`. Deleting a preset unlinks its template file only
  if no other preset still references it (`_delete_template_if_orphaned()`).
  `POST /api/enhance-instructions` is the export-instructions analogue of
  `/api/enhance-prompt` (format-specific system prompt, same narrow-`httpx.RequestError`
  pattern).
- Audit trail & admin panel: `upload_file()`, `delete_file()`, `process_files()`,
  `_stream_export()`, and the preset/template endpoints each call into `audit_log.py`
  at the point they already have the relevant data, in addition to their normal
  behavior — none of their existing behavior changes for the logged-in user. Uploads
  are archived (permanent copy, independent of later deletion) at upload time, not
  delete time; `process_files()`'s SSE `event_generator()` accumulates the streamed
  content and archives it in a `finally` block (so a client disconnect mid-stream still
  saves whatever was generated, flagged `complete: false`) since the generated analysis
  text was never persisted server-side before this; `_stream_export()` archives
  `file_bytes` right where it's finalized, since exported documents were previously
  only base64'd into the SSE response and never written to disk. `GET/POST /api/admin/*`
  (all gated by `get_current_admin`, 403 for a non-admin account) read that archive/log
  back out for `static/admin.html` — `users`, `activity` (filterable by
  `username`/`action`), `uploads`/`analysis`/`exports` list+detail+download. Deleting a
  file via the normal UI only ever touches the live `uploads/<user>/`/
  `parsed_cache/<user>/` dirs — the admin panel's copy is untouched and still
  downloadable.
- Launcher scripts: check if Ollama/the server are already up (skip if so), otherwise
  start them backgrounded and poll until ready, then open the browser. Both scripts are
  idempotent — safe to double-click again even if everything's already running.

## Conventions

- New file-type support extends the `if/elif` chain in `extract_text_from_file()`
  (`parser_utils.py:62`) — each branch wraps its own `try/except`, logs a
  `logger.warning(...)`, and appends a `[Error parsing ...]` string on failure rather
  than raising, so one bad file never kills the whole extraction.
- Legacy binary formats without a good pure-Python reader use existing platform/library
  fallbacks rather than a new heavy dependency: `.doc`/`.rtf`/`.odt`/`.wordml`/
  `.webarchive` go through macOS's built-in `textutil` CLI (`_convert_with_textutil()`) —
  **this does not work on Windows/Linux** (no `textutil` equivalent); it degrades to the
  existing `[Error converting document: ...]` placeholder, not a crash. `.xls` tries
  `openpyxl` first (handles xlsx-renamed-to-xls) then falls back to `xlrd` for true
  legacy BIFF files — this part is cross-platform. `.ppt` has no fallback at all, on any
  platform, and returns an explicit "not supported, re-save as .pptx" message.
- The catch-all fallback branch sniffs for binary content (`_looks_binary()`) before
  attempting a UTF-8 decode — an unrecognized-but-genuinely-textual extension still
  reads as text, but arbitrary binary (zip, exe, audio) reports as unsupported instead
  of being decoded into garbage text that would silently pollute the LLM context.
- Every failure/unsupported branch's bracketed sentinel string (e.g. `[Error parsing
  PDF: ...]`) is checked by `parser_utils.is_error_content()`, which `app.py`'s
  `upload_file()`/`list_files()` use to report `status: "error"` (not `"parsed"`) when a
  file's extracted text is only a placeholder — adding a new sentinel message means
  adding its prefix to `_ERROR_SENTINEL_PREFIXES` too, or it'll silently show as "parsed".
- Message-building for Ollama (`_build_enhance_messages()`... actually inlined directly
  in `enhance_prompt()`/`process_files()` in `app.py`) stays factored the same way in
  both endpoints so they construct byte-identical prompts if either changes.
- Errors surfaced to the client are always `HTTPException(status_code=..., detail=f"<action>: {str(e)}")` — never a bare re-raise.
- Ollama-calling code only catches `httpx.RequestError` around the
  `client.post()`/`client.stream()` call itself, never a bare `except Exception`
  wrapping the whole block — a bare except also catches deliberately-raised
  `HTTPException`s for non-200 responses and flattens their real status code to a
  generic 500 (this exact bug existed here once; fixed by narrowing the except and
  moving the status check outside the `try`).
- `POST /api/export-{excel,pdf,word}` (`_stream_export()` in `app.py`) route to **one of
  two pipelines** depending on whether a template was uploaded:
  1. **No template, or a fixed-layout PDF template** — the "script pipeline". The model
     writes a whole per-format Python script tailored to the specific report
     (`_generate_ai_export()`, dispatched via the `ExportFormat` registry /
     `_excel_format()`/`_pdf_format()`/`_word_format()`), validated with an AST allowlist
     (`_validate_generated_code()`) and run in a subprocess (`_run_generated_export_script()`).
  2. **A template was uploaded for xlsx, docx, or a PDF with real AcroForm fields** —
     the "clone pipeline". The model does NOT write or run any code. Instead:
     `_extract_template_schema()` reads the template's real structure (cell coordinates
     for xlsx, paragraph/table locations for docx, form field names for pdf) tagged with
     stable `[ID=...]` locators; `_generate_field_mapping()` sends that schema + the report
     to Ollama and asks for **only** a JSON object `{location_id: value}` — a bounded
     mapping task, not code generation; then a trusted, backend-authored (never
     AST-validated, never model-generated) splice function —
     `_splice_xlsx_template()` / `_splice_docx_template()` / `_splice_pdf_form_template()`
     — applies that mapping directly to a copy of the template. This is the actual fix for
     "the template isn't preserved": two separate bugs made template-mode exports silently
     fall back to a template-blind fallback every time before this — an unreadable
     `TEMPLATE_PATH` env var (`os`/`sys` are banned names, so any script reading it always
     failed validation) and the model having zero visibility into the template's real
     structure. See `.agents/skills/excel_export/SKILL.md` section 3 for the full mechanism,
     including a real bug caught in live testing: for docx, a label and its placeholder
     often share one text run (e.g. `"Solar Conversion Rate: [VALUE]"`), so the model must
     return the *complete* replacement text, not just the bare value, or the splice
     function's whole-run overwrite silently destroys the label.
  Both endpoints/pipelines stream real per-stage progress over Server-Sent Events (the
  clone pipeline's stages are `template`/`schema`/`mapping`/`splice`/`done`; the script
  pipeline's are `prompt`/`generate`/`validate`/`execute`/`fallback`/`done`) so the
  frontend progress bar moves with the real pipeline instead of one static message. The
  terminal SSE event carries the file as base64 + a filename + a mime type. Full design
  lives in `.agents/skills/excel_export/SKILL.md` — read that before touching any of the
  `_EXCEL_*`/`_PDF_*`/`_WORD_*`/`_generate_ai_export`/`_run_generated_export_script`/
  `_run_template_clone_pipeline`/`_splice_*_template` code. The deterministic
  `_generate_excel_bytes()`/`_generate_pdf_bytes()`/`_generate_word_bytes()` fallbacks
  (one per format, all driven by the shared `_parse_markdown_blocks()` parser, plus the
  shared `smart_value()` helper also reused by `_splice_xlsx_template()`) are the safety
  net for BOTH pipelines when either one fails twice — don't delete any of them. The old
  `exportToPDF` browser-print path is gone; PDF export is now the same pipeline structure
  as Excel/Word.
- The three export endpoints all accept optional `instructions` (str) and
  `template_filename` (str) request fields on top of `markdown` — both default to
  empty/None, in which case the request always takes the script pipeline with a prompt
  byte-identical to before this feature existed. Non-empty `instructions` are appended
  to the skill prompt verbatim (script pipeline) or forwarded into the field-mapping
  prompt (clone pipeline). `template_filename` alone (no instructions) is a fully
  supported "just fill in my template" case for both pipelines.

## Gotchas

- **Two Python installs exist on the original dev machine (macOS) and a bare `pip`
  picks the wrong one.** `python3` on PATH resolves to `/opt/homebrew/bin/python3`
  (3.14) — the interpreter that actually runs the app locally — but a bare `pip`/`pip3`
  resolves to a separate `/Library/Frameworks/Python.framework/Versions/3.13` install.
  Always install with `python3 -m pip install ...`, never bare `pip`. This may not apply
  on whatever machine this gets shipped to — check with `python3 -m pip --version` vs
  `pip --version` if installs seem to silently not take effect.
- **`start_mac.command` must stay executable and macOS Gatekeeper will warn on first
  run.** Since it's an unsigned script (possibly downloaded/copied from elsewhere), the
  recipient's first double-click may show "cannot be opened because it is from an
  unidentified developer" — they need to right-click → Open once (or approve it in
  System Settings → Privacy & Security) instead of double-clicking. If the executable
  bit was lost in transit (e.g. some zip tools strip it), `chmod +x start_mac.command`
  fixes it.
- **`start_windows.bat` was written carefully but not executed on a real Windows
  machine** (no Windows available in the dev environment) — the macOS launcher was
  fully tested (cold-start and already-running paths, both for real), the Windows one
  rests on standard, well-known batch idioms only. Worth an actual test run before
  trusting it blindly. It also assumes `curl.exe` is present (bundled by default on
  Windows 10 1803+ and all Windows 11) and that `python` is on PATH.
- **`minimax-m3:cloud` requires an Ollama account even though it runs via local
  `ollama serve`.** The `:cloud` suffix means Ollama's local daemon proxies the request
  to Ollama's own cloud infrastructure — the recipient still needs `ollama login` (or
  the Ollama desktop app signed in) for the model to work at all, even though nothing
  about this app itself needs an API key. Both launcher scripts attempt `ollama pull
  minimax-m3:cloud` and print this requirement clearly if it fails.
- **`UPLOAD_ROOT`, `CACHE_ROOT`, `PRESETS_ROOT`, `EXPORT_TEMPLATES_ROOT`,
  `EXPORT_PRESETS_ROOT`, `STATIC_DIR` in `app.py` are relative to the script's own
  location** (`BASE_DIR = os.path.dirname(os.path.abspath(__file__))`), not hardcoded
  to any one machine — this was a deliberate portability fix so the folder can be
  copied/shipped anywhere and still work. These are the per-account ROOTS, not paths
  to use directly — always go through `user_upload_dir(username)` /
  `user_cache_dir(username)` / `user_presets_file(username)` /
  `user_export_templates_dir(username)` / `user_export_presets_file(username)` to get
  the actual per-user path; the old bare `UPLOAD_DIR`/`CACHE_DIR`/`PRESETS_FILE`/
  `EXPORT_TEMPLATES_DIR`/`EXPORT_PRESETS_FILE` globals from before the auth rework no
  longer exist.
- **This directory is not its own git repo** (on the original dev machine). `.git` lives
  at `~/Desktop` — the entire Desktop is one repository, and `git status`/`git add` run
  from here operates over thousands of unrelated files from other projects. Never run a
  bare `git add -A` / `git commit` from this directory — always scope paths explicitly
  and confirm with the user first. (Not relevant once shipped elsewhere as its own copy.)
- `/api/process` includes every `.txt` in **the current user's own**
  `user_cache_dir(user)`, not just files still listed by `/api/files` — deleting a file
  via the UI removes both its upload and its cache entry together, but any cache file
  created outside that path stays in every future query's context for that same user.
  This is still per-user scoped, not shared — the "every .txt" is a within-account
  behavior, not a leak.
- The model name is `minimax-m3:cloud` — cloud-hosted regardless of the fact it's
  reached via a local Ollama daemon. Each account's free tier is quota-limited (~5M
  tokens/week, resets every 5h/7d per Ollama's pricing page) — with multiple Sift
  accounts now sharing one Ollama login, this quota IS a shared concern across all 3
  people using the app, unlike the single-recipient assumption from before the
  multi-account rework. **Confirmed the hard way 2026-07-14**: a single session's worth
  of live verification (repeated process+export runs against the auth and then the
  audit-trail features) was enough to exhaust the dev machine's weekly quota outright —
  `test_backend.py`'s Ollama check and any real `/api/process`/export call started
  returning a `429` (`"you have reached your weekly usage limit"`) mid-session, not from
  any code regression. If `test_backend.py` fails with a 429, that's this quota, not a
  bug - check the response body before assuming something broke, and don't burn more
  quota re-running live checks to "confirm" it; wait for the reset window instead.
- **CORS no longer sets `allow_credentials=True`** (it did before auth existed, and was
  genuinely safe then per the old reasoning about Starlette reflecting `Origin` instead
  of a literal `*`) — once there's a session cookie worth stealing, wildcard-origin +
  credentials becomes a real cross-origin credential-theft surface, so it was
  deliberately dropped. `allow_origins=["*"]` alone (no credentials) is still fine to
  leave wide open since the actual frontend is same-origin and never relied on CORS to
  function in the first place.
- **The script pipeline (no-template exports, and fixed-layout PDF templates) runs
  LLM-generated Python code on this machine, on purpose.** Each is guarded by an AST
  import/name allowlist (per-format, e.g. openpyxl for Excel, reportlab+pypdf for PDF,
  python-docx for Word) and a subprocess with a CPU-time rlimit + wall-clock timeout,
  but that's defense-in-depth, not a real sandbox (no seccomp, no chroot, no network
  namespace) — acceptable because this is a local single-user tool, same trust boundary
  as the app itself. Don't port this pattern to a multi-tenant or externally-reachable
  deployment without adding real sandboxing first. `RLIMIT_AS` was tried as a memory cap
  and rejected — on macOS the dynamic linker/ASLR reserves virtual address space past
  1GB before any real allocation, so even `python3 -c "print(1)"` fails to start under
  a 1GB `RLIMIT_AS`; only `RLIMIT_CPU` + the wall-clock timeout are used. **The clone
  pipeline (xlsx/docx/pdf-form template exports) does not run model-generated code at
  all** — the model only returns a JSON field-mapping, applied by trusted application
  code (`_splice_*_template()`), which is a meaningfully smaller attack surface; keep
  new template-format support on that pattern rather than reverting to code-generation
  if a new format is added. See `.agents/skills/excel_export/SKILL.md` for the full flow.
- **`reportlab` is a new `requirements.txt` entry** (added alongside the AI-driven PDF
  export) — a machine that installed dependencies before that feature landed needs to
  re-run `python3 -m pip install -r requirements.txt --break-system-packages` or PDF
  export will fail with an `ImportError` inside the sandbox subprocess (surfaces as a
  script failure, not a startup crash, since the import happens lazily inside
  `_generate_pdf_bytes()`/generated scripts). PDF template-fill mode uses `pypdf`
  (already a dependency, used elsewhere by `parser_utils.py`) rather than a new library —
  `pikepdf` was briefly added for this and then removed since it was never actually
  wired into anything.
- **Export-instructions presets (`export_presets/<user>.json`) and analysis-query
  presets (`presets/<user>.json`) are two unrelated systems that happen to sit next to
  each other.** Don't assume a change to one's schema or endpoints affects the other —
  they were kept deliberately separate (different shape: analysis-query presets are
  just `{name: {prompt}}`, export presets carry `{format, instructions,
  template_filename, template_original_name, updated_at}`).
- **`bcrypt` is a new `requirements.txt` entry** (added for password hashing) — a
  machine that installed dependencies before auth landed needs to re-run
  `python3 -m pip install -r requirements.txt --break-system-packages` or the server
  will fail to start at all (`import bcrypt` at module load, not lazy).
- **Sessions are in-memory only (`_sessions` dict in `app.py`) and are wiped on every
  server restart, including a `uvicorn --reload` restart triggered by editing any
  watched file while the dev server is running.** Every logged-in user gets kicked back
  to the login screen the next time they touch the app after that happens - not a bug,
  a deliberate simplicity tradeoff (documented in the plan this was built from), but
  worth remembering if you're mid-edit on a shared/running instance: saving `app.py`
  logs everyone out.
- **There is no TLS/HTTPS anywhere in this app.** Login credentials and the session
  cookie travel in plaintext over whatever network the server is bound to
  (`127.0.0.1` = safe, `0.0.0.0` on a LAN = sniffable by anyone else on that network).
  This was a deliberate, disclosed scope decision (see README's Authentication section)
  — don't silently claim "secure" about this app's auth without that caveat attached.
  If real transport security is ever needed, the fix is a reverse proxy with a TLS
  cert in front of this app, not anything inside `app.py` itself.
- **The three hardcoded accounts in `USERS` store bcrypt HASHES, never plaintext
  passwords** — this is the correct, intended way to keep credentials in source for a
  small hardcoded-account tool like this one (a bcrypt hash is designed to be safe to
  store, unlike a raw password) and doesn't violate the "no secrets in code" principle
  the same way a plaintext password or API key would. Still don't paste real passwords
  into commit messages, chat, or anywhere else while generating a new hash - only the
  hash itself belongs in the file.
- **The audit archive (`audit_uploads/`, `audit_analysis/`, `audit_exports/`) and
  `logs/activity.jsonl` are permanent and have no retention/pruning policy — they only
  ever grow.** Uploads are double-stored by design (once in the live `uploads/<user>/`,
  once in the permanent archive), and analysis/export archives add storage that never
  existed on disk before this feature. This was a deliberate tradeoff (see the plan this
  was built from): "never lose an actual artifact" was prioritized over disk efficiency
  for a small local/LAN team. If disk space ever becomes a real concern, that's a
  conscious follow-up (e.g. a manual archive-pruning script), not something to silently
  start deleting from `audit_log.py` without the user's say-so.
- **`get_current_admin` (in `app.py`) just wraps `get_current_user` and checks
  `USERS[username]["is_admin"]`** — it does NOT create a separate account system.
  Any account can be made an admin by adding `"is_admin": True` to its `USERS` entry;
  that account keeps using the normal app exactly as before, plus it now also sees an
  "Admin Panel" link in the header pointing at `/static/admin.html`. `GET /api/me` and
  `POST /api/login` both now return an `is_admin` boolean alongside `username` - the
  frontend uses that to decide whether to show the link, not any separate lookup.
- **Admin-panel routes take `username` from the request (query string or URL path),
  unlike every other per-user helper in this file** where `username` always already
  came out of `get_current_user()`. `_validate_admin_target_username()` restricts it to
  a real `USERS` key before it's ever joined into an `audit_log` path - any new
  `/api/admin/*` route that takes a `username` param must call it first.

## Do not touch

- `uploads/<user>/`, `parsed_cache/<user>/` — per-user runtime data, not source. Safe
  to delete (both just get recreated for that user on next upload); don't hand-edit
  while the server is running, go through normal upload/delete flows so writes stay
  atomic. Deleting the whole `uploads/`/`parsed_cache/` root wipes every account's
  uploads, not just one.
- `presets/<user>.json` — per-user data (saved analysis-query prompt presets), not
  source. Don't hand-edit while the server is running — writes go through
  `_write_cache_atomic()`.
- `export_presets/<user>.json` — per-user data (saved export-instructions presets, a
  **separate** file/schema from `presets/<user>.json`, see Flows). Same atomic-write
  caveat.
- `export_templates/<user>/` — that user's uploaded template files referenced by their
  own `export_presets/<user>.json` entries. Safe to delete a user's whole subdirectory
  (orphans that user's presets' `template_filename`, which just means those presets
  fall back to no-template behavior next time they're used) but don't hand-delete
  individual files while the server is running — a preset might still reference one,
  and it's cleaner to delete via the preset instead (`_delete_template_if_orphaned()`
  handles the unlink).
- `logs/activity.jsonl` — permanent, append-only activity log backing the admin panel.
  Never hand-edit while the server is running (writes go through `audit_log.py`'s
  lock-guarded append); never truncate/delete without the user's explicit say-so, since
  this is the only record of "what did user X do and when" (see Gotchas — no retention
  policy exists yet).
- `audit_uploads/<user>/`, `audit_analysis/<user>/`, `audit_exports/<user>/` — the
  permanent per-user archive backing the admin panel's uploads/analysis/exports
  browsers. Independent of the live `uploads/<user>/`/`parsed_cache/<user>/` dirs above
  — deleting a file from a user's own view (or the whole `uploads/`/`parsed_cache/`
  root) has zero effect on these. Never hand-edit or hand-delete individual entries
  while the server is running; each entry is a `<record_id>[__<filename>]` content file
  plus a `<record_id>.meta.json` sidecar that the admin endpoints read together.

**Repo was reset to a fresh, empty state on 2026-07-15** (every per-user data root
above emptied, all activity/audit history cleared, as part of a general repo cleanup) —
don't be surprised that they all start out empty; that's the current baseline, not a
missing-feature bug.

## Safe to delete anytime

Unlike the section above, none of this is source or user data — regenerated on demand
or simply junk that accumulates during local dev/compile runs. Delete freely:

- `__pycache__/` — generated bytecode.
- `dist/`, `build/` — PyInstaller output from a manual compile (see Compile Mac/Windows
  in Commands). Not something anyone is actively building right now; regenerate by
  re-running the compile command whenever an executable is actually needed.
- `server.log`, `ollama.log` — written by `start_mac.command`'s `nohup ... > *.log`
  redirects when it backgrounds the server/Ollama. Purely for debugging a launcher run
  that failed; safe to delete, gets recreated (or just grows again) next launch.
- `.DS_Store` — macOS Finder metadata, not part of this project.
- Anything else that looks like stray tool output sitting in the repo root and isn't
  referenced by any file in the Map above (e.g. a `format.skill` archive was found and
  removed during the 2026-07-15 cleanup, unrelated to this project) — if it's not
  mentioned in this file, it doesn't belong here.

## Environment & secrets

- No `.env` file, no environment variables read by `app.py`. Account credentials
  (bcrypt hashes) live directly in the `USERS` dict in `app.py` - see Authentication
  above for why storing a bcrypt hash in source is fine, unlike a plaintext password
  or API key.
- The app assumes Ollama is already running, unauthenticated from this app's own
  perspective, on `http://localhost:11434` — but see the Gotcha above about the
  recipient still needing their own Ollama account for the `:cloud` model proxy to
  work.

## Authentication

- Accounts are hardcoded in the `USERS` dict near the top of `app.py` — no signup, no
  database. To add or change one: generate a bcrypt hash
  (`python3 -c "import bcrypt; print(bcrypt.hashpw(b'their-password', bcrypt.gensalt()).decode())"`),
  add/edit an entry in `USERS`, restart the server (or let `--reload` pick it up).
- `get_current_user()` (a FastAPI `Depends()`) is the auth gate — reads the
  `sift_session` cookie, looks it up in the in-memory `_sessions` dict, raises 401 if
  missing/expired. Every `/api/*` route except `/api/login` and `/api/logout` depends
  on it. Its return value (the username) is what every per-user storage helper
  (`user_upload_dir()` etc.) takes as input — it's always a validated `USERS` key,
  never raw request input, which is what makes joining it directly into filesystem
  paths safe (no path-traversal risk from the username itself).
- Sessions: opaque `secrets.token_urlsafe(32)` token, `HttpOnly` + `SameSite=Lax`
  cookie, 6-hour fixed TTL from login time (`SESSION_TTL_SECONDS`, not sliding/idle-
  based - a session expires 6h after login regardless of activity), in-memory
  server-side table only (see Gotchas — wiped on restart/reload). Not JWT -
  deliberately simple for a single-process local/LAN tool.
- Admin accounts: any `USERS` entry with `"is_admin": True` (currently just `admin`)
  can reach `/static/admin.html` and every `/api/admin/*` route
  (`get_current_admin` dependency, 403 for everyone else) — see Map/Flows for what the
  panel shows. This is an additional capability on top of a normal account, not a
  separate account system; that account still uses the main app exactly as before.
- Login has a lightweight brute-force guard: 5 failed attempts for one username locks
  that username for 60 seconds (`_login_attempts` dict, `LOGIN_MAX_FAILURES` /
  `LOGIN_LOCKOUT_SECONDS`). Login also runs `bcrypt.checkpw()` against a dummy hash
  even for an unknown username (`_DUMMY_PASSWORD_HASH`) so response timing doesn't
  reveal which usernames exist.
- Frontend: `static/script.js`'s `checkAuth()` runs on every page load (`GET /api/me`),
  showing `#login-overlay` or revealing `#app-main` accordingly. Every existing
  `fetch()` call site was bulk-renamed to `apiFetch()`, a thin wrapper that centrally
  re-shows the login screen on any `401` mid-session - the login form's own request and
  `checkAuth()`'s own probe deliberately use plain `fetch()` instead, since a 401 there
  is the expected "not logged in yet" case, not a surprise mid-session expiry.
- See README.md's Authentication section for the full user-facing explanation,
  including the explicit no-TLS disclosure.

## Workflow

- No CI. No branch/commit convention has been established yet for this project — ask
  before assuming one.
- Never commit from this directory (on the original dev machine) without scoping paths
  explicitly — the ambient repo is the whole Desktop, not this project.
- Distribution: this folder is meant to be copied/zipped and handed to someone else to
  run entirely on their own machine via the launcher scripts — not deployed to any
  cloud host. No Docker, no Render, no server-side hosting of any kind.

<!-- MAINTENANCE (keep this comment): this file is code, and whichever model is
running right now is its owner. A command here failed, a path moved, a rule contradicts
reality → fix this file in the same turn you discover it. Stepped on a landmine this
file didn't warn about → add the gotcha (trap + consequence, one line) before finishing
the task. Verified a non-obvious fact the hard way → record it so no future session
pays that cost again. Prune any line that no longer changes behavior. All edits follow
the same bars as creation: verified facts, checkable rules, better absent than wrong. -->
