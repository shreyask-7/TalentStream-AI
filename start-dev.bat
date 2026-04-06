@echo off
echo ===================================================
echo 🚀 Booting up TalentStream AI Universe...
echo ===================================================

echo.
echo 📦 1/5: Starting Infrastructure (Docker)...
docker-compose up -d

echo.
echo 🐍 2/5: Starting Python AI Service...
:: Opens a new terminal, goes to the folder, and starts Uvicorn
start "AI Service" cmd /k "cd ai-service && venv\Scripts\activate && uvicorn main:app --reload --port 5000"

echo.
echo ☕ 3/5: Starting Java Backend...
start "Java Backend" cmd /k "cd backend-java && mvnw spring-boot:run"

echo.
echo 🚪 4/5: Starting Spring Cloud Gateway...
start "Gateway" cmd /k "cd api-gateway && mvnw spring-boot:run"

echo.
echo ⚛️ 5/5: Starting React Frontend...
start "React UI" cmd /k "cd frontend-react && npm run dev"

echo.
echo ✅ All systems initializing! Close this window when ready.
pause