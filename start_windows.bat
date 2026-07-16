@echo off
REM Double-click this file to start the app server (in the background) and
REM open your browser. Safe to double-click again later - it detects if the
REM server is already running and won't start a duplicate.
REM
REM Ollama is now the cloud API: there's no local daemon to start. Make sure
REM your .env file contains OLLAMA_API_KEY before launching (see .env.example).

cd /d "%~dp0"

echo === Sift - Startup ===
echo.

REM --- 1. Check .env / OLLAMA_API_KEY ---
if not exist .env (
    echo ERROR: .env file is missing.
    echo Copy .env.example to .env and add your Ollama API key, then run this script again.
    pause
    exit /b 1
)
findstr /B /C:"OLLAMA_API_KEY=" .env >nul
if errorlevel 1 goto no_key
findstr /B /C:"OLLAMA_API_KEY=." .env >nul
if errorlevel 1 goto no_key
goto key_ok

:no_key
echo ERROR: OLLAMA_API_KEY is not set in .env.
echo Open .env and add a line like:  OLLAMA_API_KEY=your-key-here
echo (you can get a key from https://ollama.com)
pause
exit /b 1

:key_ok

REM --- 2. Check Python and dependencies ---
where python >nul 2>nul
if errorlevel 1 (
    echo ERROR: python is not installed. Install Python 3.13+ from https://python.org and try again.
    echo Make sure to check "Add python.exe to PATH" during installation.
    pause
    exit /b 1
)

python -c "import fastapi, uvicorn, dotenv" >nul 2>nul
if errorlevel 1 (
    echo Installing required Python packages ^(first run only, may take a minute^)...
    python -m pip install -r requirements.txt
)

REM --- 3. Start the app server in the background, if it isn't already running ---
REM NOTE: the wait loop below deliberately keeps every label at the top level
REM (never inside parentheses) - cmd.exe abandons block parsing when a goto
REM lands inside a ( ) block, which breaks the surrounding if/else.
curl -s -o nul -m 2 http://127.0.0.1:8000/api/files
if not errorlevel 1 (
    echo App server is already running.
    goto server_done
)
echo Starting the app server in the background...
start "Sift Server" /min python -m uvicorn app:app --host 127.0.0.1 --port 8000
echo Waiting for the app server to become ready...
set SERVER_TRIES=0

:server_wait
curl -s -o nul -m 2 http://127.0.0.1:8000/api/files
if not errorlevel 1 (
    echo App server is ready.
    goto server_done
)
set /a SERVER_TRIES+=1
if %SERVER_TRIES% geq 30 (
    echo ERROR: App server did not start within 30 seconds.
    pause
    exit /b 1
)
timeout /t 1 /nobreak >nul
goto server_wait

:server_done

REM --- 4. Open the app in your default browser ---
echo.
echo Opening http://127.0.0.1:8000 ...
start http://127.0.0.1:8000

echo.
echo All set. You can close this window - the app server will keep running in the background (check the minimized windows in your taskbar).
pause
