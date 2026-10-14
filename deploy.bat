@echo off
chcp 65001 >nul
echo ========================================
echo   五子棋游戏 - 阿里云一键部署脚本
echo ========================================
echo.

set SERVER_IP=47.111.121.62
set SERVER_USER=root
set SERVER_PASS=Cwq411324.

echo 正在连接服务器 %SERVER_IP% ...
echo.
echo 注意：此脚本需要 SSH 密码交互，请在提示时输入密码：%SERVER_PASS%
echo.
pause

echo.
echo ========================================
echo 第 1 步：安装 Node.js 和依赖
echo ========================================
ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs git && node -v && npm -v"

echo.
echo ========================================
echo 第 2 步：克隆项目并安装依赖
echo ========================================
ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "cd /root && git clone https://github.com/CC411324/gomoku.git && cd gomoku && npm install"

echo.
echo ========================================
echo 第 3 步：构建项目
echo ========================================
ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "cd /root/gomoku && npm run build"

echo.
echo ========================================
echo 第 4 步：安装 PM2 并启动服务
echo ========================================
ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "npm install -g pm2 && cd /root/gomoku && pm2 start packages/server/dist/index.js --name gomoku && pm2 save && pm2 startup"

echo.
echo ========================================
echo 部署完成！
echo ========================================
echo.
echo 访问地址：http://%SERVER_IP%:3001
echo.
echo 如果无法访问，请在阿里云安全组中开放 3001 端口
echo.
pause
