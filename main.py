import os
import sys
import time
import webbrowser
import threading
import multiprocessing
from dotenv import load_dotenv
import uvicorn

# Load .env from the script's own location so the PyInstaller-bundled exe
# and the dev checkout work the same way.
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

# Redirect stdout/stderr in windowed mode to prevent uvicorn/python write crashes
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")

# Adjust path search for packaged execution
if getattr(sys, 'frozen', False):
    sys.path.append(sys._MEIPASS)

from app import app

# Ollama is now reached as the cloud API at https://ollama.com (authenticated
# with OLLAMA_API_KEY from .env). No local `ollama serve` daemon is needed
# or started - all the daemon-management code from the previous version is
# removed because there is nothing for it to manage.

if not os.environ.get("OLLAMA_API_KEY"):
    print("=" * 60)
    print("  OLLAMA_API_KEY is not set.")
    print("  Copy .env.example to .env and add your Ollama API key,")
    print("  or set the OLLAMA_API_KEY environment variable.")
    print("=" * 60)

def open_browser():
    # Wait for the uvicorn server to spin up
    time.sleep(1.5)
    webbrowser.open("http://127.0.0.1:8000")

if __name__ == "__main__":
    # Essential for PyInstaller on Windows to prevent recursive process spawning
    multiprocessing.freeze_support()

    # Start thread to open web browser
    threading.Thread(target=open_browser, daemon=True).start()

    # Run uvicorn server on localhost
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
