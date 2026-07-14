import os
import sys
import time
import webbrowser
import threading
import multiprocessing
import subprocess
import urllib.request
import uvicorn

# Redirect stdout/stderr in windowed mode to prevent uvicorn/python write crashes
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")

# Adjust path search for packaged execution
if getattr(sys, 'frozen', False):
    sys.path.append(sys._MEIPASS)

from app import app

def is_ollama_running() -> bool:
    try:
        # Check Ollama server status endpoint
        with urllib.request.urlopen("http://localhost:11434/api/tags", timeout=2) as response:
            return response.status == 200
    except Exception:
        return False

def find_ollama_binary() -> str:
    # macOS binary search in standard installation paths
    if sys.platform == "darwin":
        paths = [
            "/usr/local/bin/ollama",
            "/opt/homebrew/bin/ollama",
            "/Applications/Ollama.app/Contents/Resources/ollama"
        ]
        for p in paths:
            if os.path.exists(p):
                return p
        return "ollama"  # Fallback to PATH search
        
    # Windows binary search in standard installer path
    elif sys.platform == "win32":
        local_appdata = os.environ.get("LOCALAPPDATA", "")
        paths = [
            os.path.join(local_appdata, "Programs", "Ollama", "ollama.exe")
        ]
        for p in paths:
            if os.path.exists(p):
                return p
        return "ollama"  # Fallback to PATH search
        
    return "ollama"

def start_ollama():
    if is_ollama_running():
        return
    
    ollama_bin = find_ollama_binary()
    
    # Headless startup using the CLI daemon in the background
    try:
        if sys.platform == "win32":
            subprocess.Popen([ollama_bin, "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, shell=True)
        else:
            subprocess.Popen([ollama_bin, "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

def ensure_ollama_running():
    if is_ollama_running():
        return True
    
    start_ollama()
    
    # Wait up to 10 seconds for the service to bind and respond
    for _ in range(10):
        if is_ollama_running():
            return True
        time.sleep(1)
    return False

def open_browser():
    # Wait for the uvicorn server to spin up
    time.sleep(1.5)
    webbrowser.open("http://127.0.0.1:8000")

if __name__ == "__main__":
    # Essential for PyInstaller on Windows to prevent recursive process spawning
    multiprocessing.freeze_support()
    
    # Auto-start Ollama in the background if it is shut down
    ensure_ollama_running()
    
    # Start thread to open web browser
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Run uvicorn server on localhost
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
