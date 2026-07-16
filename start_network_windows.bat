@echo off
REM Start Sift bound to 0.0.0.0 to allow local network (LAN) connections.
REM
REM Ollama is now the cloud API: there's no local daemon to start. Make sure
REM your .env file contains OLLAMA_API_KEY before launching (see .env.example).

cd /d "%~dp0"

echo === Sift - Network Startup ===
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

REM --- 3. Resolve local IP address ---
set LOCAL_IP=127.0.0.1
for /f "usebackq tokens=*" %%a in (`powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '127.*' -and $_.InterfaceAlias -notlike '*Loopback*'} | Select-Object -ExpandProperty IPAddress | Select-Object -First 1"`) do set LOCAL_IP=%%a

REM --- 4. Start the app server in the background bound to 0.0.0.0 ---
REM NOTE: the wait loop below deliberately keeps every label at the top level
REM (never inside parentheses) - cmd.exe abandons block parsing when a goto
REM lands inside a ( ) block, which breaks the surrounding if/else.
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
