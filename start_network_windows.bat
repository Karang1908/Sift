@echo off
REM Start Sift bound to 0.0.0.0 to allow local network (LAN) connections.

cd /d "%~dp0"

echo === Sift - Network Startup ===
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

REM --- 5. Resolve local IP address ---
set LOCAL_IP=127.0.0.1
for /f "usebackq tokens=*" %%a in (`powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '127.*' -and $_.InterfaceAlias -notlike '*Loopback*'} | Select-Object -ExpandProperty IPAddress | Select-Object -First 1"`) do set LOCAL_IP=%%a

REM --- 6. Start the app server in the background bound to 0.0.0.0 ---
curl -s -o nul -m 2 http://localhost:8000/api/files
if not errorlevel 1 (
    echo App server is already running.
    goto server_done
)
echo Starting the app server on the network...
start "Sift Server" /min python -m uvicorn app:app --host 0.0.0.0 --port 8000
echo Waiting for the app server to become ready...
set SERVER_TRIES=0

:server_wait
curl -s -o nul -m 2 http://localhost:8000/api/files
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

echo.
echo ====================================================
echo Sift is live on your network!
echo ====================================================
echo.
echo 1. Local URL (this machine): http://127.0.0.1:8000/static/index.html
echo 2. Network URL (other machines): http://%LOCAL_IP%:8000/static/index.html
echo.
echo Note: If other devices cannot connect, make sure your Windows Defender
echo Firewall allows incoming TCP traffic on port 8000.
echo.

start http://127.0.0.1:8000/static/index.html
pause
