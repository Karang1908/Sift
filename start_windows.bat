@echo off
REM Double-click this file to start everything: Ollama (in the background),
REM the app server (in the background), then opens your browser to the app.
REM Safe to double-click again later - it detects what's already running.

cd /d "%~dp0"

echo === Sift - Startup ===
echo.

REM --- 1. Check Ollama is installed ---
where ollama >nul 2>nul
if errorlevel 1 (
    echo ERROR: Ollama is not installed.
    echo Install it from https://ollama.com/download, then run this script again.
    pause
    exit /b 1
)

REM --- 2. Start Ollama in the background, if it isn't already running ---
REM NOTE: the wait loops below deliberately keep every label at the top level
REM (never inside parentheses) - cmd.exe abandons block parsing when a goto
REM lands inside a ( ) block, which breaks the surrounding if/else.
curl -s -o nul -m 2 http://localhost:11434/api/tags
if not errorlevel 1 (
    echo Ollama is already running.
    goto ollama_done
)
echo Starting Ollama in the background...
start "Ollama" /min ollama serve
echo Waiting for Ollama to become ready...
set OLLAMA_TRIES=0

:ollama_wait
curl -s -o nul -m 2 http://localhost:11434/api/tags
if not errorlevel 1 (
    echo Ollama is ready.
    goto ollama_done
)
set /a OLLAMA_TRIES+=1
if %OLLAMA_TRIES% geq 30 (
    echo ERROR: Ollama did not start within 30 seconds.
    pause
    exit /b 1
)
timeout /t 1 /nobreak >nul
goto ollama_wait

:ollama_done

REM --- 3. Make sure the required model is available ---
ollama list | findstr /C:"minimax-m3:cloud" >nul
if errorlevel 1 (
    echo Pulling minimax-m3:cloud ^(this uses Ollama's cloud proxy - you need an Ollama account^)...
    ollama pull minimax-m3:cloud
    if errorlevel 1 (
        echo ERROR: Could not pull minimax-m3:cloud.
        echo This model requires an Ollama account - run "ollama login" and try again.
        pause
        exit /b 1
    )
) else (
    echo Model minimax-m3:cloud is already available.
)

REM --- 4. Check Python and dependencies ---
where python >nul 2>nul
if errorlevel 1 (
    echo ERROR: python is not installed. Install Python 3.13+ from https://python.org and try again.
    echo Make sure to check "Add python.exe to PATH" during installation.
    pause
    exit /b 1
)

python -c "import fastapi, uvicorn" >nul 2>nul
if errorlevel 1 (
    echo Installing required Python packages ^(first run only, may take a minute^)...
    python -m pip install -r requirements.txt
)

REM --- 5. Start the app server in the background, if it isn't already running ---
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

REM --- 6. Open the app in your default browser ---
echo.
echo Opening http://127.0.0.1:8000 ...
start http://127.0.0.1:8000

echo.
echo All set. You can close this window - Ollama and the app server will keep running in the background (check the minimized windows in your taskbar).
pause
