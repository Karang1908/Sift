#!/bin/bash
# Double-click this file in Finder to start everything: Ollama (in the
# background), the app server (in the background), then opens your browser
# to the app. Safe to double-click again later - it detects what's already
# running and won't start duplicates.

set -e
cd "$(dirname "$0")"

pause() {
    if [ -t 0 ]; then
        read -n 1 -s -r -p "Press any key to close this window..."
    fi
}

echo "=== Sift - Startup ==="
echo ""

# --- 1. Check Ollama is installed ---
if ! command -v ollama >/dev/null 2>&1; then
    echo "ERROR: Ollama is not installed."
    echo "Install it from https://ollama.com/download, then run this script again."
    pause
    exit 1
fi

# --- 2. Start Ollama in the background, if it isn't already running ---
if curl -s -o /dev/null -m 2 http://localhost:11434/api/tags; then
    echo "Ollama is already running."
else
    echo "Starting Ollama in the background..."
    nohup ollama serve > "$(dirname "$0")/ollama.log" 2>&1 &
    echo "Waiting for Ollama to become ready..."
    for i in $(seq 1 30); do
        if curl -s -o /dev/null -m 2 http://localhost:11434/api/tags; then
            echo "Ollama is ready."
            break
        fi
        sleep 1
        if [ "$i" -eq 30 ]; then
            echo "ERROR: Ollama did not start within 30 seconds. Check ollama.log for details."
            pause
            exit 1
        fi
    done
fi

# --- 3. Make sure the required model is available ---
if ollama list 2>/dev/null | grep -q "minimax-m3:cloud"; then
    echo "Model minimax-m3:cloud is already available."
else
    echo "Pulling minimax-m3:cloud (this uses Ollama's cloud proxy - you need an Ollama account)..."
    if ! ollama pull minimax-m3:cloud; then
        echo "ERROR: Could not pull minimax-m3:cloud."
        echo "This model requires an Ollama account - run 'ollama login' (or sign in via the Ollama app) and try again."
        pause
        exit 1
    fi
fi

# --- 4. Check Python and dependencies ---
if ! command -v python3 >/dev/null 2>&1; then
    echo "ERROR: python3 is not installed. Install Python 3.13+ from https://python.org and try again."
    pause
    exit 1
fi

if ! python3 -c "import fastapi, uvicorn" >/dev/null 2>&1; then
    echo "Installing required Python packages (first run only, may take a minute)..."
    python3 -m pip install -r requirements.txt --break-system-packages
fi

# --- 5. Start the app server in the background, if it isn't already running ---
if curl -s -o /dev/null -m 2 http://127.0.0.1:8000/api/files; then
    echo "App server is already running."
else
    echo "Starting the app server in the background..."
    nohup python3 -m uvicorn app:app --host 127.0.0.1 --port 8000 > "$(dirname "$0")/server.log" 2>&1 &
    echo "Waiting for the app server to become ready..."
    for i in $(seq 1 30); do
        if curl -s -o /dev/null -m 2 http://127.0.0.1:8000/api/files; then
            echo "App server is ready."
            break
        fi
        sleep 1
        if [ "$i" -eq 30 ]; then
            echo "ERROR: App server did not start within 30 seconds. Check server.log for details."
            pause
            exit 1
        fi
    done
fi

# --- 6. Open the app in your default browser ---
echo ""
echo "Opening http://127.0.0.1:8000 ..."
open http://127.0.0.1:8000

echo ""
echo "All set. You can close this window - Ollama and the app server will keep running in the background."
pause
