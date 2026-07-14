# Compiling Standalone Windows Executable (.exe)

This guide walks you through compiling the application into a single, standalone executable on a Windows machine.

---

## Prerequisites

1. **Python 3.13+**: Ensure Python is installed on your Windows machine and added to your system `PATH`.
2. **Ollama**: Ensure Ollama is installed on the machine.

---

## Step 1: Install Dependencies

Open Command Prompt (`cmd`) or PowerShell in this project directory and run:

```cmd
python -m pip install -r requirements.txt
python -m pip install pyinstaller
```

`--break-system-packages` (used in the macOS guide) is a Homebrew/Debian-specific flag
and doesn't apply on Windows — omit it here.

---

## Step 2: Convert Icon.png to Windows Icon Format (.ico)

To compile with a custom icon, you need the icon in `.ico` format. Since you already have Python and Pillow installed, you can generate it with this one-liner command:

```cmd
python -c "from PIL import Image; Image.open('Icon.png').save('Icon.ico', format='ICO')"
```

This will create a new `Icon.ico` file in the directory.

---

## Step 3: Compile Using PyInstaller

Run PyInstaller to bundle the application. 

> [!IMPORTANT]
> Note the semicolon (`;`) used as a path separator. Windows PyInstaller requires a semicolon to separate the source and destination paths, whereas macOS/Linux uses a colon (`:`).

```cmd
pyinstaller --onefile --add-data "static;static" --icon Icon.ico main.py
```

---

## Step 4: Locate and Run the Executable

Once the build finishes:
1. Open the **`dist/`** directory.
2. You will find a standalone **`main.exe`** file — rename it to **`Sift.exe`** (or
   whatever you prefer; the name doesn't affect anything at runtime).
3. Double-click the executable to run the application. It will automatically start the
   FastAPI server, launch a background browser-opening thread, and connect to your
   local Ollama instance.

> [!NOTE]
> **Windows SmartScreen will likely warn on first run** — this is an unsigned
> executable (no code-signing certificate), so Windows can't vouch for its publisher.
> Click **More info → Run anyway** once; this is the same class of warning macOS
> Gatekeeper shows for the `.command` launcher, not a sign anything is wrong with the
> build itself. Code-signing is out of scope for this guide.

---

## Rebuilding after code changes

`dist/` is a build output, not source — safe to delete anytime
(`rmdir /s /q dist`) and regenerate by repeating Step 3. There's nothing to clean up in
Step 1/2 between rebuilds unless `requirements.txt` or `Icon.png` changed.
