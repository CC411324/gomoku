import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { RoomManager } from './rooms/RoomManager';
import { registerHandlers } from './socket/handlers';

const app = express();
const httpServer = createServer(app);

// CORS 配置 - 生产环境允许所有来源（同源部署）
const isProduction = process.env.NODE_ENV === 'production';
const io = new Server(httpServer, {
  cors: {
    origin: isProduction ? true : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

// 中间件
app.use(cors());
app.use(express.json());

// 房间管理器
const roomManager = new RoomManager();

// API 路由
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    rooms: roomManager.getRoomCount(),
    uptime: process.uptime(),
  });
});

app.get('/api/rooms', (_req, res) => {
  res.json({ count: roomManager.getRoomCount() });
});

// Socket.io 连接
io.on('connection', (socket) => {
  console.log(`[连接] 新客户端: ${socket.id}`);
  registerHandlers(io, socket, roomManager);
});

// 生产环境：托管前端静态文件
if (isProduction) {
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));
  // SPA 路由回退
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// 启动服务器
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[服务器] 运行在端口 ${PORT}`);
  if (isProduction) {
    console.log(`[服务器] 生产模式 - 前端已托管`);
  } else {
    console.log(`[服务器] http://localhost:${PORT}`);
  }
});
