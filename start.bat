@echo off
chcp 65001 >nul
echo ========================================
echo   五子棋游戏 - 本地启动脚本
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 清理旧依赖...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f package-lock.json

echo [2/3] 安装依赖...
npm install
if %errorlevel% neq 0 (
    echo.
    echo 依赖安装失败，请检查 Node.js 和 npm 是否已安装
    pause
    exit /b 1
)

echo [3/3] 编译共享模块并启动...
npm run build --workspace=packages/shared
npm run dev

pause
