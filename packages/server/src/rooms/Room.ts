import { v4 as uuidv4 } from 'uuid';
import {
  PieceColor, GameMode, GameStatus, GameState, Player, Room as RoomData,
} from '@gomoku/shared';
import { createInitialGameState } from '@gomoku/shared';
import { createEndlessGameState } from '@gomoku/shared';
import { BOARD_SIZE, ROOM_CODE_LENGTH } from '@gomoku/shared';

export class Room {
  public id: string;
  public code: string;
  public host: Player;
  public guests: Player[] = [];
  public gameState: GameState | null = null;
  public mode: GameMode;
  public createdAt: number;

  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(hostId: string, hostName: string, mode: GameMode) {
    this.id = uuidv4();
    this.code = this.generateCode();
    this.mode = mode;
    this.createdAt = Date.now();

    this.host = {
      id: hostId,
      name: hostName,
      color: PieceColor.BLACK,
    };
  }

  /**
   * 添加玩家到房间
   */
  addPlayer(playerId: string, playerName: string): Player | null {
    if (this.guests.length >= 1) return null; // 房间已满

    const player: Player = {
      id: playerId,
      name: playerName,
      color: PieceColor.WHITE,
    };

    this.guests.push(player);
    return player;
  }

  /**
   * 移除玩家
   */
  removePlayer(playerId: string): boolean {
    if (this.host.id === playerId) {
      // 房主离开，将客人提升为房主
      if (this.guests.length > 0) {
        this.host = this.guests.shift()!;
        this.host.color = PieceColor.BLACK;
      } else {
        return true; // 房间应该被销毁
      }
    } else {
      this.guests = this.guests.filter(p => p.id !== playerId);
    }
    return false;
  }

  /**
   * 获取所有玩家
   */
  getAllPlayers(): Player[] {
    return [this.host, ...this.guests];
  }

  /**
   * 获取房间数据
   */
  toRoomData(): RoomData {
    return {
      id: this.id,
      code: this.code,
      host: { ...this.host },
      guests: this.guests.map(g => ({ ...g })),
      gameState: this.gameState ? { ...this.gameState } : null,
      mode: this.mode,
      createdAt: this.createdAt,
    };
  }

  /**
   * 开始游戏
   */
  startGame(): GameState {
    if (this.mode === GameMode.ENDLESS) {
      this.gameState = createEndlessGameState();
    } else {
      this.gameState = createInitialGameState(this.mode);
    }
    this.gameState.status = GameStatus.PLAYING;
    return this.gameState;
  }

  /**
   * 重置游戏
   */
  restartGame(): GameState | null {
    if (!this.gameState) return null;
    return this.startGame();
  }

  /**
   * 检查房间是否已满（2人）
   */
  isFull(): boolean {
    return this.guests.length >= 1;
  }

  /**
   * 获取对手
   */
  getOpponent(playerId: string): Player | null {
    const allPlayers = this.getAllPlayers();
    return allPlayers.find(p => p.id !== playerId) || null;
  }

  /**
   * 处理断线
   */
  handleDisconnect(playerId: string, onTimeout: () => void): void {
    const timer = setTimeout(() => {
      this.disconnectTimers.delete(playerId);
      onTimeout();
    }, 5 * 60 * 1000); // 5分钟超时

    this.disconnectTimers.set(playerId, timer);
  }

  /**
   * 处理重连
   */
  handleReconnect(playerId: string): void {
    const timer = this.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(playerId);
    }
  }

  /**
   * 清理定时器
   */
  destroy(): void {
    for (const timer of this.disconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.disconnectTimers.clear();
  }

  /**
   * 生成6位房间号
   */
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆字符
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
}
