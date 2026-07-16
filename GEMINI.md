# GEMINI.md

Sift is a single-screen FastAPI dashboard that allows uploading documents, parsing them (including OCR for images), refining user prompts, streaming AI analysis via a local Ollama instance (`minimax-m3:cloud`), and exporting results to Excel, PDF, or Word documents.

---

## Verified Commands

| Task | Command | Notes |
|---|---|---|
| Smoke/Unit tests | `python3 test_backend.py` | Verified (2026-07-15): checks local Ollama server connectivity (ping) and basic plain-text file parser round-trip. |
| Dev server start | `python3 -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload` | Starts FastAPI app on port 8000. Wipes session keys on auto-reload. |
| E2E Integration test | `SIFT_TEST_PASSWORD="your_password" python3 verify_integration.py` | Requires server to be already running. Note: `verify_integration.py` defaults to `http://127.0.0.1:8000` (override with `SIFT_BASE_URL`), matching the dev-server port. |

---

## File Structure & Directory Map

* **Entry point**: [app.py](file:///Users/karangarg/Desktop/file%20parsing/app.py) — FastAPI routing, authentication logic, in-memory session mapping, and SSE stream orchestration.
* **Parser utilities**: [parser_utils.py](file:///Users/karangarg/Desktop/file%20parsing/parser_utils.py) — Extracts text content from PDF, Word, Excel, PowerPoint, and images (OCR via pytesseract).
* **Audit Trail**: [audit_log.py](file:///Users/karangarg/Desktop/file%20parsing/audit_log.py) — Administrative log tracker writing inter-account events to `logs/activity.jsonl` and keeping copies of all processed files.
* **Launchers**: [start_mac.command](file:///Users/karangarg/Desktop/file%20parsing/start_mac.command) / [start_windows.bat](file:///Users/karangarg/Desktop/file%20parsing/start_windows.bat) — Scripts that background-start Ollama and the server, then open the web client.
* **Frontend Assets**: Inside the [static/](file:///Users/karangarg/Desktop/file%20parsing/static/) directory:
  * [index.html](file:///Users/karangarg/Desktop/file%20parsing/static/index.html) / [script.js](file:///Users/karangarg/Desktop/file%20parsing/static/script.js) — The user-facing dashboard application.
  * [admin.html](file:///Users/karangarg/Desktop/file%20parsing/static/admin.html) / [admin.js](file:///Users/karangarg/Desktop/file%20parsing/static/admin.js) — The administrator panel that views the audit log and archives.
* **Per-user directories**:
  * Live storage: `uploads/<user>/`, `parsed_cache/<user>/`, `presets/<user>.json`, `export_templates/<user>/`, `export_presets/<user>.json`.
  * Permanent archives: `audit_uploads/<user>/`, `audit_analysis/<user>/`, `audit_exports/<user>/`.

---

## Key Gotchas & Development Guardrails

1. **Git Repository Location**: This directory is NOT its own Git repository. The `.git` folder resides at `~/Desktop`. Running `git add -A` or general Git commands from here will interact with files across the entire desktop. **Always scope paths explicitly when using Git.**
2. **Ollama Quota Limits**: The `minimax-m3:cloud` model runs via a local Ollama daemon but routes requests to Ollama's cloud infrastructure. Quotas (~5M tokens/week) are shared across all Sift user accounts on this machine. Exceeding this triggers a `429` status code, which might cause tests to fail.
3. **Session State is In-Memory**: Sessions are stored in simple dictionaries in `app.py`. A server restart or a uvicorn reload (e.g., when editing code) invalidates all sessions, logging out current users.
4. **Transport Security (CORS)**: Wildcard origin `allow_origins=["*"]` is enabled, but `allow_credentials=True` is omitted. Sift operates purely on HTTP; there is no SSL/TLS layer built into the Python stack.
5. **PDF Template Overlay**: PDFs without fillable AcroForm fields fall back to the "script pipeline" (which constructs reportlab canvases to merge a best-effort text overlay on the pages) rather than using the "clone pipeline" (which maps JSON values to fillable field keys directly).
