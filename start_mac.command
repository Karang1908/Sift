#!/bin/bash
# Double-click this file in Finder to start the app server (in the
# background) and open your browser. Safe to double-click again later -
# it detects if the server is already running and won't start a duplicate.
#
# Ollama is now the cloud API: there's no local daemon to start. Make sure
# your .env file contains OLLAMA_API_KEY before launching (see .env.example).

set -e
cd "$(dirname "$0")"

pause() {
    if [ -t 0 ]; then
        read -n 1 -s -r -p "Press any key to close this window..."
    fi
}

echo "=== Sift - Startup ==="
echo ""

# --- 1. Check .env / OLLAMA_API_KEY ---
if [ ! -f .env ] || ! grep -q "^OLLAMA_API_KEY=.\+" .env; then
    echo "ERROR: OLLAMA_API_KEY is not set."
    echo "Copy .env.example to .env and add your Ollama API key, then run this script again."
    pause
    exit 1
fi

# --- 2. Check Python and dependencies ---
if ! command -v python3 >/dev/null 2>&1; then
    echo "ERROR: python3 is not installed. Install Python 3.13+ from https://python.org and try again."
    pause
    exit 1
fi

if ! python3 -c "import fastapi, uvicorn, dotenv" >/dev/null 2>&1; then
    echo "Installing required Python packages (first run only, may take a minute)..."
    python3 -m pip install -r requirements.txt --break-system-packages
fi

# --- 3. Start the app server in the background, if it isn't already running ---
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

# --- 4. Open the app in your default browser ---
echo ""
echo "Opening http://127.0.0.1:8000 ..."
open http://127.0.0.1:8000

echo ""
echo "All set. You can close this window - the app server will keep running in the background."
pause
