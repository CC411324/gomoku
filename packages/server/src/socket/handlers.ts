import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  PieceColor, GameMode, GameStatus, GameEndReason, Position,
} from '@gomoku/shared';
import {
  makeMove, isValidMove, makeEndlessMove, makeEndlessCapture,
  skipCapture, getCapturablePositions,
} from '@gomoku/shared';
import { RoomManager } from '../rooms/RoomManager';
import { SocketEvents } from './events';

export function registerHandlers(io: Server, socket: Socket, roomManager: RoomManager): void {
  const playerId = uuidv4();
  let currentRoomId: string | null = null;

  // 创建房间
  socket.on(SocketEvents.ROOM_CREATE, (data) => {
    const room = roomManager.createRoom(playerId, data.playerName, data.mode);
    currentRoomId = room.id;

    const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}?room=${room.code}`;

    socket.emit(SocketEvents.ROOM_CREATED, {
      roomId: room.id,
      roomCode: room.code,
      inviteUrl,
    });

    // 加入 Socket.io room
    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.data.playerId = playerId;
  });

  // 加入房间
  socket.on(SocketEvents.ROOM_JOIN, (data) => {
    const result = roomManager.joinRoom(data.roomCode, playerId, data.playerName);

    if (result.error) {
      socket.emit(SocketEvents.ROOM_ERROR, { message: result.error });
      return;
    }

    const room = result.room;
    currentRoomId = room.id;
    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.data.playerId = playerId;

    const guest = room.guests[room.guests.length - 1];

    // 通知加入者
    socket.emit(SocketEvents.ROOM_JOINED, {
      room: room.toRoomData(),
      yourColor: guest.color,
    });

    // 通知房主
    socket.to(room.id).emit(SocketEvents.PLAYER_JOINED, { player: guest });

    // 房间已满，自动开始游戏
    if (room.isFull()) {
      const gameState = room.startGame();

      // 通知所有玩家游戏开始
      for (const player of room.getAllPlayers()) {
        io.to(room.id).emit(SocketEvents.GAME_START, {
          gameState,
          yourColor: player.color,
        });
      }
    }

    // 更新房间状态
    io.to(room.id).emit(SocketEvents.ROOM_UPDATED, { room: room.toRoomData() });
  });

  // 离开房间
  socket.on(SocketEvents.ROOM_LEAVE, (data) => {
    handleLeave(data.roomId);
  });

  // 游戏落子
  socket.on(SocketEvents.GAME_MOVE, (data) => {
    const room = roomManager.findById(data.roomId);
    if (!room || !room.gameState) return;
    if (room.gameState.status !== GameStatus.PLAYING) return;

    const player = room.getAllPlayers().find(p => p.id === playerId);
    if (!player || player.color !== room.gameState.currentPlayer) return;
    if (room.gameState.awaitingCapture) return;

    if (!isValidMove(room.gameState.board, data.position)) return;

    let newState;

    if (room.mode === GameMode.ENDLESS) {
      const result = makeEndlessMove(room.gameState, data.position);
      if (!result) return;
      newState = result.newState;
    } else {
      newState = makeMove(room.gameState, data.position);
      if (!newState) return;
    }

    room.gameState = newState;

    const move = newState.moves[newState.moves.length - 1];
    io.to(data.roomId).emit(SocketEvents.GAME_MOVE_RESULT, { move, newState });

    // 检查游戏是否结束
    if (newState.status === GameStatus.FINISHED) {
      io.to(data.roomId).emit(SocketEvents.GAME_END, {
        winner: newState.winner,
        reason: newState.endReason || GameEndReason.FIVE_IN_ROW,
        gameState: newState,
      });
    }
  });

  // 无尽模式吃子
  socket.on(SocketEvents.GAME_CAPTURE, (data) => {
    const room = roomManager.findById(data.roomId);
    if (!room || !room.gameState) return;
    if (!room.gameState.awaitingCapture) return;

    const player = room.getAllPlayers().find(p => p.id === playerId);
    if (!player || player.color !== room.gameState.currentPlayer) return;

    const newState = makeEndlessCapture(room.gameState, data.targetPosition);
    if (!newState) return;

    room.gameState = newState;

    io.to(data.roomId).emit(SocketEvents.GAME_CAPTURE_RESULT, {
      capturedPosition: data.targetPosition,
      removedPositions: [],
      newState,
    });

    if (newState.status === GameStatus.FINISHED) {
      io.to(data.roomId).emit(SocketEvents.GAME_END, {
        winner: newState.winner,
        reason: newState.endReason || GameEndReason.FIVE_IN_ROW,
        gameState: newState,
      });
    }
  });

  // 重新开始
  socket.on(SocketEvents.GAME_RESTART, (data) => {
    const room = roomManager.findById(data.roomId);
    if (!room) return;

    const newState = room.restartGame();
    if (newState) {
      io.to(data.roomId).emit(SocketEvents.GAME_RESTART_RESULT, { gameState: newState });
    }
  });

  // 认输
  socket.on(SocketEvents.GAME_SURRENDER, (data) => {
    const room = roomManager.findById(data.roomId);
    if (!room || !room.gameState) return;

    const player = room.getAllPlayers().find(p => p.id === playerId);
    if (!player) return;

    room.gameState.status = GameStatus.FINISHED;
    room.gameState.winner = player.color === PieceColor.BLACK ? PieceColor.WHITE : PieceColor.BLACK;
    room.gameState.endReason = GameEndReason.SURRENDER;

    io.to(data.roomId).emit(SocketEvents.GAME_END, {
      winner: room.gameState.winner,
      reason: GameEndReason.SURRENDER,
      gameState: room.gameState,
    });
  });

  // 断线处理
  socket.on('disconnect', () => {
    if (currentRoomId) {
      const room = roomManager.findById(currentRoomId);
      if (room) {
        room.handleDisconnect(playerId, () => {
          // 超时判负
          if (room.gameState && room.gameState.status === GameStatus.PLAYING) {
            const player = room.getAllPlayers().find(p => p.id === playerId);
            if (player) {
              room.gameState.status = GameStatus.FINISHED;
              room.gameState.winner = player.color === PieceColor.BLACK ? PieceColor.WHITE : PieceColor.BLACK;
              room.gameState.endReason = GameEndReason.OPPONENT_DISCONNECTED;

              io.to(currentRoomId!).emit(SocketEvents.GAME_END, {
                winner: room.gameState.winner,
                reason: GameEndReason.OPPONENT_DISCONNECTED,
                gameState: room.gameState,
              });
            }
          }

          handleLeave(currentRoomId!);
        });

        socket.to(currentRoomId).emit(SocketEvents.PLAYER_LEFT, { playerId });
      }
    }
  });

  // 重连处理
  socket.on('connect', () => {
    if (currentRoomId) {
      const room = roomManager.findById(currentRoomId);
      if (room) {
        room.handleReconnect(playerId);
      }
    }
  });

  function handleLeave(roomId: string) {
    const result = roomManager.leaveRoom(roomId, playerId);
    if (result.room) {
      socket.to(roomId).emit(SocketEvents.PLAYER_LEFT, { playerId });

      if (!result.shouldDestroy) {
        io.to(roomId).emit(SocketEvents.ROOM_UPDATED, { room: result.room.toRoomData() });
      }
    }

    socket.leave(roomId);
    currentRoomId = null;
  }
}
