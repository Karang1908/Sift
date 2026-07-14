# Sift

An industrial-grade, single-screen dashboard utility designed to upload arbitrary-size documents, cache parsed text, enhance user extraction prompts using AI, and stream query results with inline Markdown and PDF exporting capabilities.

This tool utilizes the high-context **MiniMax M3** model (`minimax-m3:cloud`) through a local Ollama instance to analyze multiple files concurrently. It's meant to run on one machine — yours, or whoever you hand this folder to — and be shared with a small, known team over your local network, gated behind login so only that team can use it.

---

## 🚀 Features

- **Login-Gated, Per-User Data**: Only accounts you've explicitly configured can use the
  app — everyone else gets a login screen and nothing else. Each account's uploads,
  presets, and export templates live in their own private storage; no account can see
  another's files, presets, or templates. See **Authentication** below for how accounts
  work and how to add more.
- **Permanent Audit Trail & Admin Panel**: every upload, deletion, analysis run, and
  export is permanently logged and archived on the server — including the actual
  uploaded file, the prompt used, the generated analysis text, and the exported
  document, with real timestamps, kept even after a user deletes something from their
  own view. An account flagged as admin gets an **Admin Panel** link in the header
  (a separate page, `/static/admin.html`) to browse and download all of this, per user.
  See **Authentication** below.
- **Multi-Format Document Parsing**: PDF, Word (`.docx`/`.doc`), Excel (`.xlsx`/`.xls`), PowerPoint (`.pptx`), images (OCR), and plain text formats (`.txt`, `.md`, `.json`, `.csv`, etc.).
- **Smart Citation Tagging**: Structural descriptors (`[Page X]`, `[Slide Y]`, `[Sheet Name]`) are automatically embedded during parsing to assist the model in citation tracking.
- **Single-Box AI Prompt Enhancement**: Refines plain language extraction requests into structured, professional prompt templates. Enhancements are updated in place, allowing manual refinement.
- **Saved Prompt Presets**: Save, load, and delete named prompt templates from a dropdown next to the query box.
- **Real-Time Output Streaming**: Uses Server-Sent Events (SSE) to stream analysis results live from the model into the output panel.
- **AI-Designed Document Exporting**: Export the report as Markdown, PDF, Excel, or Word.
  With no template, the AI reads your specific report and writes a script that decides the
  actual layout (which sections become tables vs. prose, number formatting, multi-sheet vs.
  single-sheet, etc.), validated and run in a sandboxed subprocess with a deterministic
  fallback if generation fails. A live progress bar tracks the real pipeline.
- **Export Instructions & Template Cloning**: Clicking **Export PDF / Excel / Word** opens
  that format's export panel — write free-text styling instructions (with an AI Enhance
  button), save/load them as named presets, or upload your own `.xlsx`/`.docx`/`.pdf`
  template file, all before exporting. With a template, the AI reads its exact existing
  structure and maps your report's data onto it (a bounded field-mapping decision, not
  code generation) — a trusted, tested function then fills the real cells/paragraphs/form
  fields directly, so every other bit of formatting, labels, and layout in your template
  stays untouched. PDF templates with fillable form fields get the same high-fidelity
  treatment; a PDF with no form fields falls back to a lower-fidelity best-effort text
  overlay (clearly indicated). No customization needed either — click Export and go
  straight to the AI-designed document if you don't need a template or instructions.
- **Full Viewport Dashboard**: Designed for high-readability desktop views. Individual panels scroll internally to avoid page-level scrolling.
- **One-click startup**: `start_mac.command` / `start_windows.bat` start Ollama and the app server in the background and open your browser automatically — no terminal needed.

---

## 🛠️ Project Structure

```text
├── app.py                 # FastAPI backend server with REST endpoints
├── parser_utils.py        # Extract text from PDF, DOCX, XLSX, PPTX, images (OCR), and text files
├── audit_log.py           # Permanent activity log + per-user upload/analysis/export archive
├── main.py                # PyInstaller entry point only (see Building a Standalone Executable)
├── static/
│   ├── index.html         # Clean two-column panel HTML structure + Export Instructions modal
│   ├── style.css          # Dashboard styling, flex layouts, and print styles
│   ├── script.js          # File uploads, presets, event listeners, stream parsing, exports
│   ├── admin.html         # Admin panel page (activity/uploads/analysis/exports browser)
│   └── admin.js           # Admin panel logic - standalone, no shared state with script.js
├── start_mac.command       # Double-click launcher for macOS
├── start_windows.bat       # Double-click launcher for Windows
├── Icon.png / Icon.icns   # App icon (source PNG + macOS-format build)
├── COMPILE_MAC.md         # Standalone macOS executable build guide
├── COMPILE_WINDOWS.md     # Standalone Windows executable build guide
├── ARCHITECTURE.md        # Deep technical docs: network flow, request flows, data model
├── test_backend.py        # Validation script for Ollama connectivity
└── verify_integration.py  # End-to-end integration test flow script
```

---

## ⚙️ Getting Started

### The easy way

Just double-click **`start_mac.command`** (macOS) or **`start_windows.bat`** (Windows). It will:
1. Start Ollama in the background if it isn't already running.
2. Make sure the `minimax-m3:cloud` model is available (pulling it if needed — this requires an Ollama account; run `ollama login` first if you don't have one).
3. Install Python dependencies on first run.
4. Start the app server in the background.
5. Open your browser to the app automatically.

It's safe to double-click again later — it detects what's already running and won't start duplicates.

> **macOS note**: on the very first run, Gatekeeper may say the script "cannot be opened because it is from an unidentified developer." Right-click the file and choose **Open** instead of double-clicking, then confirm — you only need to do this once.

### The manual way

#### 1. Prerequisites
- **Python**: 3.13+ or 3.14+
- **Ollama**: [Installed](https://ollama.com/download) and running locally, with an account (`ollama login`) since `minimax-m3:cloud` is a cloud-proxied model.
  ```bash
  ollama run minimax-m3:cloud
  ```

#### 2. Installation
```bash
python3 -m pip install -r requirements.txt --break-system-packages
```
Use `python3 -m pip` (not bare `pip`) — some machines have more than one Python install, and a bare `pip` may resolve to the wrong one.

#### 3. Run Verification Tests
```bash
python3 test_backend.py
```

#### 4. Start the Application
```bash
For Localhost: python3 -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
For Network: python3 -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🔐 Authentication

Sift is gated behind login for a small, fixed set of accounts — there's no signup
flow, no database, just a hardcoded list in `app.py`. Every page and every API
endpoint requires a valid session except the login screen itself.

**Adding or changing an account** — edit the `USERS` dict near the top of `app.py`:

1. Generate a bcrypt hash for the new password (never store a plaintext password
   anywhere):
   ```bash
   python3 -c "import bcrypt; print(bcrypt.hashpw(b'their-password', bcrypt.gensalt()).decode())"
   ```
2. Add (or edit) an entry in `USERS`:
   ```python
   USERS = {
       "admin": {"password_hash": b"$2b$12$...existing hash...", "is_admin": True},
       "newperson": {"password_hash": b"$2b$12$...the hash you just generated..."},
   }
   ```
   Add `"is_admin": True` only for accounts that should see the **Admin Panel** (see
   below) — leave it off for a regular account.
3. Restart the server (or let `--reload` pick up the change if it's already running
   in dev mode).

Each username becomes its own private workspace the first time that account logs in
and uses the app — uploads, parsed cache, saved presets, and export templates all
live under that username, invisible to every other account.

**Admin Panel**: an account with `"is_admin": True` gets an **Admin Panel** link next
to Logout in the header, leading to a separate page (`/static/admin.html`) that lists,
per user: login/logout/upload/delete/analysis/export activity with timestamps, every
uploaded file (downloadable, including ones the user later deleted from their own
view), every analysis run (the prompt used and the full generated output), and every
exported document (downloadable). None of this is visible to a non-admin account, and
it's permanent — nothing in the admin panel is affected by what a user deletes in
their own workspace.

**What this is and isn't**, honestly:
- Passwords are bcrypt-hashed, never stored or compared in plaintext.
- Sessions are an opaque random token in an `HttpOnly`, `SameSite=Lax` cookie, checked
  against an **in-memory** server-side session table — nothing session-related touches
  disk. A session expires 6 hours after login (fixed, not extended by activity), or
  restarting the server (including a dev `--reload` triggered by a code change) clears
  all sessions immediately; either way, logging back in picks up right where you left
  off — your uploaded files and presets are saved server-side per account, not tied to
  the session.
- Five failed login attempts for one username locks that username out for 60 seconds.
- **There is no TLS/HTTPS.** This still runs on plain HTTP, so login credentials and
  the session cookie travel unencrypted on your network — sniffable by anyone else on
  an untrusted network (public WiFi, a large shared office network). Fine for a home
  network or a small trusted office LAN; if you need real transport security, put a
  reverse proxy (e.g. Caddy or nginx) with a TLS certificate in front of this app
  rather than exposing it directly.
- This is sized for a handful of known people, not a public service — there's no
  password-reset flow and no rate limiting beyond the per-username lockout above.
  (There *is* a full permanent audit trail — see **Admin Panel** above — that's a
  deliberate feature, not a gap.)

---

## 📖 How to Use

1. **Access the Dashboard**: Open your browser and navigate to **[http://127.0.0.1:8000](http://127.0.0.1:8000)**. You'll land on the login screen — sign in with an account from `USERS` in `app.py` (see **Authentication** above). Your session persists for 6 hours; use **Logout** in the header to end it early.
2. **Upload Documents**: Drag and drop or browse files on the left panel. They will automatically be parsed on the server and cached. The status will display as `PARSED`.
3. **Formulate Query**: Type your plain language analysis request in the prompt textarea on the left.
4. **AI Refine (Optional)**: Click **AI Enhance Prompt** to optimize the query in place. You can edit the resulting template directly.
5. **Save/Load Presets (Optional)**: Use the dropdown above the prompt box to save your current prompt as a named preset, or load one you saved earlier.
6. **Execute Extraction**: Click **Continue & Run Action** on the right panel. The analysis report will stream live.
7. **Export Report**: Once the stream completes, use **Export MD** for an instant plain
   Markdown download. **Export PDF / Excel / Word** open that format's export panel —
   click **Export as &lt;format&gt;** right away for the AI-designed document with no
   customization (the old one-click behavior), or first write styling instructions
   (optionally **AI Enhance** them) and/or upload your own template file to fill, then
   click Export. Save your instructions/template as a named preset to reuse next time.
   A progress bar tracks the actual pipeline either way.

---

## 📦 Building a Standalone Executable

The easiest way to run Sift is still `start_mac.command` / `start_windows.bat` (see
**Getting Started** above) — no compilation needed, just double-click. If you'd rather
hand someone a single executable file instead of this whole folder, `main.py` +
PyInstaller can build one:

- **macOS** → see [`COMPILE_MAC.md`](COMPILE_MAC.md)
- **Windows** → see [`COMPILE_WINDOWS.md`](COMPILE_WINDOWS.md)

Both produce a single-file executable (`--onefile`) that bundles Python, every
dependency, and the `static/` frontend — the recipient only needs Ollama installed
separately. Neither guide requires a code-signing certificate, though both note the
unsigned-binary warning (Gatekeeper on macOS, SmartScreen on Windows) the recipient
will see on first launch.
