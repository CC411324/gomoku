import { Room } from './Room';
import { GameMode } from '@gomoku/shared';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private codeIndex: Map<string, string> = new Map(); // code -> roomId
  private playerRoomMap: Map<string, string> = new Map(); // playerId -> roomId

  /**
   * 创建房间
   */
  createRoom(hostId: string, hostName: string, mode: GameMode): Room {
    // 如果玩家已在其他房间，先离开
    this.leaveAllRooms(hostId);

    const room = new Room(hostId, hostName, mode);
    this.rooms.set(room.id, room);
    this.codeIndex.set(room.code, room.id);
    this.playerRoomMap.set(hostId, room.id);

    return room;
  }

  /**
   * 通过房间号查找房间
   */
  findByCode(code: string): Room | null {
    const roomId = this.codeIndex.get(code.toUpperCase());
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  /**
   * 通过 ID 查找房间
   */
  findById(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  /**
   * 获取玩家所在房间
   */
  getPlayerRoom(playerId: string): Room | null {
    const roomId = this.playerRoomMap.get(playerId);
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  /**
   * 玩家加入房间
   */
  joinRoom(roomCode: string, playerId: string, playerName: string): { room: Room; error?: string } {
    const room = this.findByCode(roomCode);
    if (!room) {
      return { room: null as any, error: '房间不存在' };
    }

    if (room.isFull()) {
      return { room, error: '房间已满' };
    }

    // 如果玩家已在其他房间，先离开
    this.leaveAllRooms(playerId);

    const player = room.addPlayer(playerId, playerName);
    if (!player) {
      return { room, error: '无法加入房间' };
    }

    this.playerRoomMap.set(playerId, room.id);
    return { room };
  }

  /**
   * 玩家离开房间
   */
  leaveRoom(roomId: string, playerId: string): { room: Room | null; shouldDestroy: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) return { room: null, shouldDestroy: false };

    const shouldDestroy = room.removePlayer(playerId);
    this.playerRoomMap.delete(playerId);

    if (shouldDestroy || room.getAllPlayers().length === 0) {
      this.destroyRoom(roomId);
      return { room, shouldDestroy: true };
    }

    return { room, shouldDestroy: false };
  }

  /**
   * 玩家离开所有房间
   */
  leaveAllRooms(playerId: string): void {
    const roomId = this.playerRoomMap.get(playerId);
    if (roomId) {
      this.leaveRoom(roomId, playerId);
    }
  }

  /**
   * 销毁房间
   */
  private destroyRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.destroy();
      this.codeIndex.delete(room.code);
      this.rooms.delete(roomId);
    }
  }

  /**
   * 获取所有活跃房间数
   */
  getRoomCount(): number {
    return this.rooms.size;
  }
}
