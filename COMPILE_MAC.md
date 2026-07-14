# Compiling a Standalone macOS Executable

This guide walks you through compiling the application into a single, standalone
executable on a Mac. It mirrors `COMPILE_WINDOWS.md` step for step — see that file for
the Windows equivalent.

---

## Prerequisites

1. **Python 3.13+**: `python3 --version` to check. Install from
   [python.org](https://python.org) if needed.
2. **Ollama**: installed and working (`ollama --version`).

---

## Step 1: Install Dependencies

Open Terminal in this project directory and run:

```bash
python3 -m pip install -r requirements.txt --break-system-packages
python3 -m pip install pyinstaller --break-system-packages
```

`--break-system-packages` is needed on macOS because Homebrew's Python (the one
`python3` resolves to on most Macs) marks itself as an "externally managed"
environment — see `CLAUDE.md`'s Gotchas for why this matters and how to tell which
Python you're actually using (`python3 -m pip --version` vs bare `pip --version`).

---

## Step 2: Convert Icon.png to macOS Icon Format (.icns)

`Icon.icns` already exists in this repo, generated from `Icon.png`. To regenerate it
(e.g. after changing the source image):

```bash
sips -s format icns Icon.png --out Icon.icns
```

`sips` is a built-in macOS command-line tool — no extra install needed.

---

## Step 3: Compile Using PyInstaller

```bash
pyinstaller --onefile --add-data "static:static" --icon Icon.icns main.py
```

> [!IMPORTANT]
> Note the **colon** (`:`) path separator in `--add-data "static:static"` — macOS/Linux
> PyInstaller uses `:`, Windows uses `;`. Using the wrong one silently produces a build
> that can't find `static/`, which surfaces at runtime as a 404 on every page asset,
> not a build-time error.

This produces a single-file executable at `dist/main` — no `.app` bundle, since the
command above doesn't pass `--windowed` (this is a background server process that opens
your default browser, not a native GUI app, so a bundle isn't needed).

---

## Step 4: Locate and Run the Executable

1. Open the **`dist/`** directory.
2. Rename **`dist/main`** to **`Sift`** (or whatever you prefer — the name doesn't
   affect anything at runtime).
3. Double-click, or run `./Sift` from Terminal. It will automatically start the FastAPI
   server, launch a background browser-opening thread, and connect to your local
   Ollama instance at `http://127.0.0.1:8000`.

> [!NOTE]
> **Gatekeeper will block the first launch** — this is an unsigned, unnotarized binary
> (no Apple Developer certificate involved), so macOS shows "cannot be opened because
> it is from an unidentified developer" or similar. Either:
> - Right-click (or Control-click) the executable → **Open** → confirm once, or
> - Run `xattr -cr dist/Sift` in Terminal to strip the quarantine attribute before
>   distributing it, so the recipient doesn't have to fight Gatekeeper at all.
>
> This is the exact same class of warning `start_mac.command` already documents in
> `README.md` — nothing new to the compiled-binary path. Code-signing and notarization
> (which would remove this warning entirely) are out of scope for this guide.

---

## Rebuilding after code changes

`dist/` and `build/` are PyInstaller's own output directories, not source — safe to
delete anytime (`rm -rf dist build`) and regenerate by repeating Step 3. There's
nothing to redo from Step 1/2 between rebuilds unless `requirements.txt` or `Icon.png`
changed.
