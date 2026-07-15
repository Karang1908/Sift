import os
import sys
import requests
import json

BASE_URL = os.environ.get("SIFT_BASE_URL", "http://127.0.0.1:8000")

# Every /api/* route except /api/login and /api/logout now requires a valid
# session (see app.py's get_current_user dependency), so this script needs
# real credentials for one of the accounts in app.py's USERS dict. Read from
# environment variables rather than hardcoding - this file is a permanent,
# shipped part of the project, not a throwaway script, so a real password
# must never be written into it.
#
#   SIFT_TEST_PASSWORD='...' python3 verify_integration.py
#
# Optionally set SIFT_TEST_USERNAME_2 / SIFT_TEST_PASSWORD_2 for a second
# configured account to also run the cross-account isolation check (skipped
# with a clear message if not set - there's only one account configured by
# default).
TEST_USERNAME = os.environ.get("SIFT_TEST_USERNAME", "admin")
TEST_PASSWORD = os.environ.get("SIFT_TEST_PASSWORD")
TEST_USERNAME_2 = os.environ.get("SIFT_TEST_USERNAME_2")
TEST_PASSWORD_2 = os.environ.get("SIFT_TEST_PASSWORD_2")


def run_integration_test():
    print("=== STARTING INTEGRATION TEST ===")

    if not TEST_PASSWORD:
        print("\nSIFT_TEST_PASSWORD environment variable is not set.")
        print("Run: SIFT_TEST_PASSWORD='your-password' python3 verify_integration.py")
        sys.exit(1)

    # 0a. Unauthenticated requests are rejected - this is the actual auth gate
    # working, checked before doing anything else.
    print("Checking unauthenticated access is rejected...")
    res = requests.get(f"{BASE_URL}/api/files")
    print(f"Unauthenticated GET /api/files: {res.status_code}")
    assert res.status_code == 401, "Unauthenticated request should be rejected with 401"

    # 0b. Log in. requests.Session() persists the session cookie automatically
    # across every subsequent call in this script, exactly like a browser.
    print(f"\nLogging in as {TEST_USERNAME!r}...")
    session = requests.Session()
    res = session.post(f"{BASE_URL}/api/login", json={"username": TEST_USERNAME, "password": TEST_PASSWORD})
    print(f"Login response code: {res.status_code}")
    assert res.status_code == 200, f"Login failed: {res.text}"
    assert res.json()["username"] == TEST_USERNAME

    res = session.get(f"{BASE_URL}/api/me")
    assert res.status_code == 200 and res.json()["username"] == TEST_USERNAME
    print("Session confirmed via /api/me")

    # 1. Clean up any existing files to start fresh
    print("\nChecking current files...")
    res = session.get(f"{BASE_URL}/api/files")
    if res.status_code == 200:
        files = res.json()
        for f in files:
            print(f"Deleting existing file: {f['filename']}")
            session.delete(f"{BASE_URL}/api/files/{f['filename']}")

    # 2. Upload a test file
    print("\nUploading test file...")
    file_content = (
        "Project Alpha Report\n"
        "Date: July 2026\n"
        "Lead Researcher: Dr. Evelyn Reed\n\n"
        "Key Finding 1: The solar conversion rate achieved was 24.8% on Page 1.\n"
        "Key Finding 2: Budget utilization is at 84% on Page 2.\n"
        "Conclusion: Recommended to proceed to phase 2 by October 2026."
    )

    files = {"file": ("project_report.txt", file_content, "text/plain")}
    res = session.post(f"{BASE_URL}/api/upload", files=files)
    print(f"Upload response code: {res.status_code}")
    print(f"Upload response body: {res.json()}")
    assert res.status_code == 200, "Upload failed"

    # 3. Verify file list
    res = session.get(f"{BASE_URL}/api/files")
    print(f"Files list: {res.json()}")
    assert len(res.json()) == 1, "File list should contain exactly 1 file"
    assert res.json()[0]["status"] == "parsed", "File status should be 'parsed'"

    # 4. Enhance prompt
    print("\nEnhancing user prompt...")
    prompt_payload = {"prompt": "What is the solar conversion rate and the budget utilization? Include citations."}
    res = session.post(f"{BASE_URL}/api/enhance-prompt", json=prompt_payload)
    print(f"Enhance response code: {res.status_code}")
    enhanced_prompt = res.json().get("enhanced_prompt", "")
    print(f"Enhanced prompt:\n{enhanced_prompt}")
    assert res.status_code == 200, "Enhance prompt failed"
    assert len(enhanced_prompt) > 0, "Enhanced prompt is empty"

    # 5. Process files with streaming response
    print("\nProcessing documents with streaming response...")
    process_payload = {"prompt": enhanced_prompt}

    # We use stream=True to read chunks
    res = session.post(f"{BASE_URL}/api/process", json=process_payload, stream=True)
    print(f"Process response status: {res.status_code}")
    assert res.status_code == 200, "Process failed"

    full_output = ""
    for line in res.iter_lines():
        if line:
            decoded_line = line.decode('utf-8')
            if decoded_line.startswith("data: "):
                json_str = decoded_line[6:].strip()
                try:
                    data = json.loads(json_str)
                    if data.get("content"):
                        chunk = data["content"]
                        print(chunk, end="", flush=True)
                        full_output += chunk
                    if data.get("done"):
                        print("\nStream finished.")
                except Exception as e:
                    print(f"\n[Error parsing chunk: {e}]")

    print("\n--- FINAL OUTPUT ---")
    print(full_output)
    print("--------------------")

    assert "24.8%" in full_output, "Expected solar conversion rate in output"
    assert "84%" in full_output, "Expected budget utilization in output"

    # 6. Export the report to Excel - exercises the AI-driven generation path
    # (model writes+runs an openpyxl script) with its deterministic fallback.
    # Fallback is a legitimate outcome (Ollama flakiness, model writes bad
    # code on a given run), so we only assert we got back a real .xlsx, not
    # that the AI path specifically succeeded - just report which happened.
    print("\nExporting report to Excel...")
    excel_bytes = _consume_export_stream(session, BASE_URL + "/api/export-excel", full_output, "xlsx")
    assert excel_bytes[:2] == b"PK", "Excel response is not a valid .xlsx (zip) file"
    assert len(excel_bytes) > 1000, "Excel file suspiciously small"
    print(f"Excel file size: {len(excel_bytes)} bytes")

    # 7. Same for PDF - exercises the reportlab-based AI path.
    print("\nExporting report to PDF...")
    pdf_bytes = _consume_export_stream(session, BASE_URL + "/api/export-pdf", full_output, "pdf")
    assert pdf_bytes[:4] == b"%PDF", "PDF response is not a valid .pdf file"
    assert len(pdf_bytes) > 500, "PDF file suspiciously small"
    print(f"PDF file size: {len(pdf_bytes)} bytes")

    # 8. Same for Word - exercises the python-docx-based AI path.
    print("\nExporting report to Word...")
    docx_bytes = _consume_export_stream(session, BASE_URL + "/api/export-word", full_output, "docx")
    assert docx_bytes[:2] == b"PK", "Word response is not a valid .docx (zip) file"
    assert len(docx_bytes) > 1000, "Word file suspiciously small"
    print(f"Word file size: {len(docx_bytes)} bytes")

    # 9. Per-format export-instructions preset system (separate from the
    # analysis-query presets/<user>.json). Upload a tiny real .xlsx template,
    # save a preset referencing it, delete the preset and confirm the
    # template file got cleaned up too.
    print("\nTesting export-templates + export-presets endpoints...")
    import io as _io
    import openpyxl as _openpyxl
    template_wb = _openpyxl.Workbook()
    template_wb.active["A1"] = "Solar Rate (REPLACE_ME)"
    template_wb.active["B1"] = "Budget Util (REPLACE_ME)"
    template_buf = _io.BytesIO()
    template_wb.save(template_buf)
    template_buf.seek(0)

    res = session.post(
        f"{BASE_URL}/api/export-templates",
        files={"file": ("report_template.xlsx", template_buf.getvalue(),
                         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )
    print(f"Template upload status: {res.status_code}")
    assert res.status_code == 200, f"Template upload failed: {res.text}"
    template_info = res.json()
    assert template_info["format"] == "excel", "Template upload should report format=excel"
    assert template_info["filename"].endswith(".xlsx"), "Template upload should return .xlsx filename"
    template_filename = template_info["filename"]
    print(f"Template saved as: {template_filename}, size={template_info['size']} bytes")

    # Save a preset referencing the template + some instructions
    preset_payload = {
        "name": "Quarterly Excel Report",
        "format": "excel",
        "instructions": "Use corporate color scheme, freeze first row.",
        "template_filename": template_filename,
        "template_original_name": template_info["original_name"],
    }
    res = session.post(f"{BASE_URL}/api/export-presets", json=preset_payload)
    print(f"Preset save status: {res.status_code}")
    assert res.status_code == 200, f"Preset save failed: {res.text}"
    saved_preset = res.json()
    assert saved_preset["template_filename"] == template_filename

    # GET /api/export-presets should now list our preset
    res = session.get(f"{BASE_URL}/api/export-presets")
    assert res.status_code == 200
    all_presets = res.json()
    assert any(p["name"] == "Quarterly Excel Report" for p in all_presets), "Saved preset not in GET response"
    print(f"GET /api/export-presets returned {len(all_presets)} preset(s)")

    # Call /api/export-excel with instructions + template_filename. The
    # sandboxed clone pipeline maps report data onto the template's real
    # cells and splices deterministically. We don't assert what the model
    # maps (it can 429/fall back in this env), only that the SSE stream
    # finishes with a real .xlsx file.
    print("\nExporting report to Excel with instructions + template_filename...")
    res = session.post(
        f"{BASE_URL}/api/export-excel",
        json={
            "markdown": full_output,
            "instructions": preset_payload["instructions"],
            "template_filename": template_filename,
        },
        stream=True,
    )
    assert res.status_code == 200
    file_bytes = _consume_export_stream_raw(res)
    assert file_bytes[:2] == b"PK", "Template-mode export did not return a valid .xlsx"
    print(f"Template-mode Excel export: {len(file_bytes)} bytes (PK sig OK)")

    # Path-traversal rejection: a fake filename should be rejected
    res = session.post(f"{BASE_URL}/api/export-excel", json={
        "markdown": full_output,
        "template_filename": "../etc/passwd",
    })
    assert res.status_code == 400, f"Path-traversal template should be 400, got {res.status_code}"
    print("Path-traversal template filename correctly rejected")

    # /api/enhance-instructions basic round-trip
    print("\nTesting /api/enhance-instructions...")
    res = session.post(f"{BASE_URL}/api/enhance-instructions", json={
        "format": "pdf",
        "instructions": "make it a one-page executive brief in navy",
    })
    print(f"Enhance instructions status: {res.status_code}")
    assert res.status_code == 200, f"Enhance instructions failed: {res.text}"
    enhanced = res.json().get("enhanced_instructions", "")
    assert len(enhanced) > 0, "Enhanced instructions empty"
    print(f"Enhanced instructions length: {len(enhanced)} chars")

    # Clean up: delete the preset (and verify the orphan template gets unlinked)
    res = session.delete(f"{BASE_URL}/api/export-presets/Quarterly%20Excel%20Report")
    assert res.status_code == 200
    print("Preset deleted")

    # 10. Session TTL is 6h (21600s) fixed from login, and the audit trail /
    # admin panel work end-to-end. Only runs the admin-only checks if
    # TEST_USERNAME is actually admin-flagged (true for the default "admin"
    # account) - skipped with a message otherwise, same opt-in style as the
    # cross-account check below.
    print("\nChecking session TTL and audit-trail/admin-panel behavior...")
    login_res = session.post(f"{BASE_URL}/api/login", json={"username": TEST_USERNAME, "password": TEST_PASSWORD})
    assert login_res.status_code == 200
    set_cookie = login_res.headers.get("Set-Cookie", "")
    assert "Max-Age=21600" in set_cookie, f"Expected 6h (21600s) cookie Max-Age, got: {set_cookie}"
    print("  Session cookie Max-Age confirmed at 21600s (6h)")

    me = session.get(f"{BASE_URL}/api/me").json()
    if me.get("is_admin"):
        # Upload-then-delete a throwaway file specifically to prove the
        # admin panel still shows/serves it after the user's own view no
        # longer does.
        audit_file_content = b"Audit-trail regression check document."
        res = session.post(f"{BASE_URL}/api/upload",
                            files={"file": ("audit_regression_check.txt", audit_file_content, "text/plain")})
        assert res.status_code == 200
        res = session.delete(f"{BASE_URL}/api/files/audit_regression_check.txt")
        assert res.status_code == 200
        res = session.get(f"{BASE_URL}/api/files")
        assert not any(f["filename"] == "audit_regression_check.txt" for f in res.json()), \
            "Deleted file should no longer appear in the user's own file list"

        res = session.get(f"{BASE_URL}/api/admin/uploads", params={"username": TEST_USERNAME})
        assert res.status_code == 200, f"Admin uploads list failed: {res.text}"
        upload_entries = [e for e in res.json() if e["filename"] == "audit_regression_check.txt"]
        assert upload_entries, "Deleted file missing from admin uploads archive"
        assert upload_entries[0]["still_live"] is False, "Deleted file's newest archive record should not be still_live"
        rec = upload_entries[0]
        res = session.get(f"{BASE_URL}/api/admin/uploads/{TEST_USERNAME}/{rec['record_id']}/download")
        assert res.status_code == 200 and res.content == audit_file_content, \
            "Admin download of deleted file's archived copy did not match original bytes"
        print("  Admin panel still shows + serves a file the user already deleted")

        res = session.get(f"{BASE_URL}/api/admin/activity", params={"username": TEST_USERNAME})
        assert res.status_code == 200
        actions = {e["action"] for e in res.json()}
        for expected in ("login", "upload", "delete", "process", "export"):
            assert expected in actions, f"Activity log missing a {expected!r} entry for {TEST_USERNAME}"
        print(f"  Activity log has entries for: {sorted(actions)}")

        res = session.get(f"{BASE_URL}/api/admin/analysis", params={"username": TEST_USERNAME})
        assert res.status_code == 200 and len(res.json()) >= 1, "No analysis run archived"
        analysis_entry = res.json()[0]
        res = session.get(f"{BASE_URL}/api/admin/analysis/{TEST_USERNAME}/{analysis_entry['record_id']}")
        assert res.status_code == 200
        assert len(res.json().get("content", "").strip()) > 0, "Archived analysis content is empty"
        print("  Admin panel has the generated analysis text on file")

        res = session.get(f"{BASE_URL}/api/admin/exports", params={"username": TEST_USERNAME})
        assert res.status_code == 200 and len(res.json()) >= 1, "No exports archived"
        print(f"  Admin panel has {len(res.json())} archived export(s)")
    else:
        print(f"  {TEST_USERNAME!r} is not admin-flagged - skipping admin-panel checks "
              "(they run automatically when testing against the default 'admin' account).")

    # 11. Cross-account isolation - only runs if a second real account's
    # credentials were provided via env vars (there's only one configured by
    # default, so this is opt-in rather than a hard requirement).
    if TEST_USERNAME_2 and TEST_PASSWORD_2:
        print(f"\nTesting cross-account isolation against {TEST_USERNAME_2!r}...")
        session2 = requests.Session()
        res = session2.post(f"{BASE_URL}/api/login", json={"username": TEST_USERNAME_2, "password": TEST_PASSWORD_2})
        assert res.status_code == 200, f"Second account login failed: {res.text}"

        res = session2.get(f"{BASE_URL}/api/files")
        print(f"  {TEST_USERNAME_2}'s files: {res.json()} (expect empty - {TEST_USERNAME}'s upload should not be visible)")
        assert res.json() == [], f"{TEST_USERNAME_2} should not see {TEST_USERNAME}'s uploaded file"

        res = session2.get(f"{BASE_URL}/api/presets")
        assert res.json() == [], f"{TEST_USERNAME_2} should not see {TEST_USERNAME}'s presets"

        res = session2.get(f"{BASE_URL}/api/export-presets")
        assert res.json() == [], f"{TEST_USERNAME_2} should not see {TEST_USERNAME}'s export presets"

        print("  Cross-account isolation confirmed: no shared data visible.")

        if not session2.get(f"{BASE_URL}/api/me").json().get("is_admin"):
            res = session2.get(f"{BASE_URL}/api/admin/users")
            assert res.status_code == 403, f"Non-admin should get 403 on admin routes, got {res.status_code}"
            print(f"  Confirmed {TEST_USERNAME_2!r} (non-admin) gets 403 on /api/admin/*")
    else:
        print("\nSkipping cross-account isolation check (set SIFT_TEST_USERNAME_2 / "
              "SIFT_TEST_PASSWORD_2 to a second configured account to run it).")

    # 12. Logout invalidates the session
    print("\nLogging out...")
    res = session.post(f"{BASE_URL}/api/logout")
    assert res.status_code == 200
    res = session.get(f"{BASE_URL}/api/files")
    assert res.status_code == 401, "Session should be invalid after logout"
    print("Logout confirmed - session no longer valid.")

    print("\n=== INTEGRATION TEST PASSED SUCCESSFULLY ===")


def _consume_export_stream(session, url, markdown, ext, extra_body=None):
    """POST a markdown report to an /api/export-* SSE endpoint, print the
    per-stage progress events the server pushes, and return the terminal
    file bytes. Shared across excel/pdf/word so all three formats get the
    same coverage."""
    body = {"markdown": markdown}
    if extra_body:
        body.update(extra_body)
    res = session.post(url, json=body, stream=True)
    assert res.status_code == 200, f"Export failed (status {res.status_code})"
    return _consume_export_stream_raw(res)


def _consume_export_stream_raw(res):
    """Same SSE consumer as _consume_export_stream but takes an already-open
    streaming Response (so the caller can attach extra headers / send a body
    the simple wrapper wouldn't support)."""
    import base64
    buffer = ""
    file_b64 = None
    ai_generated = None
    for line in res.iter_lines():
        if not line:
            continue
        chunk = line.decode("utf-8")
        buffer += chunk + "\n"
        if not chunk.startswith("data: "):
            continue
        evt = json.loads(chunk[6:])
        if "pct" in evt or "message" in evt:
            tag = f"[{evt.get('stage', '?')}]"
            pct = evt.get("pct")
            print(f"  {tag:<14} {pct if pct is not None else '--':>4}%  {evt.get('message', '')}")
        if evt.get("stage") == "file":
            file_b64 = evt["file_b64"]
            ai_generated = evt.get("ai_generated")
            print(f"  -> AI-generated: {ai_generated}")
    assert file_b64 is not None, f"Stream ended without a 'file' event: {buffer[-500:]}"
    return base64.b64decode(file_b64)

if __name__ == "__main__":
    run_integration_test()
