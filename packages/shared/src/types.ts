// ==================== 枚举 ====================

/** 棋子颜色 */
export enum PieceColor {
  BLACK = 'black',
  WHITE = 'white',
  NONE = 'none',
}

/** 游戏模式 */
export enum GameMode {
  /** 标准模式：任意一方先连成5子获胜 */
  STANDARD = 'standard',
  /** 无尽模式：连成5子可提子+吃子，最终剩余棋子多者胜 */
  ENDLESS = 'endless',
}

/** 游戏状态 */
export enum GameStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

/** AI 难度 */
export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

/** 游戏结束原因 */
export enum GameEndReason {
  FIVE_IN_ROW = 'five_in_row',
  BOARD_FULL = 'board_full',
  NO_PIECES_LEFT = 'no_pieces_left',
  OPPONENT_DISCONNECTED = 'opponent_disconnected',
  SURRENDER = 'surrender',
}

// ==================== 接口 ====================

/** 棋盘坐标 */
export interface Position {
  row: number;
  col: number;
}

/** 落子记录 */
export interface Move {
  position: Position;
  color: PieceColor;
  moveNumber: number;
  timestamp: number;
}

/** 棋子信息（无尽模式用） */
export interface Piece {
  color: PieceColor;
  position: Position;
}

/** 玩家信息 */
export interface Player {
  id: string;
  name: string;
  color: PieceColor;
  isAI?: boolean;
  isReady?: boolean;
}

/** 游戏状态 */
export interface GameState {
  board: PieceColor[][];
  currentPlayer: PieceColor;
  moves: Move[];
  status: GameStatus;
  winner: PieceColor | null;
  endReason?: GameEndReason;
  mode: GameMode;
  /** 无尽模式：黑方剩余棋子数 */
  blackPiecesRemaining?: number;
  /** 无尽模式：白方剩余棋子数 */
  whitePiecesRemaining?: number;
  /** 无尽模式：等待吃子选择 */
  awaitingCapture?: boolean;
  /** 无尽模式：成线的棋子位置（用于高亮） */
  linePositions?: Position[];
}

/** 房间信息 */
export interface Room {
  id: string;
  code: string;
  host: Player;
  guests: Player[];
  gameState: GameState | null;
  mode: GameMode;
  createdAt: number;
}

// ==================== Socket 事件类型 ====================

/** 客户端 -> 服务端事件 */
export interface ClientToServerEvents {
  'room:create': (data: { playerName: string; mode: GameMode }) => void;
  'room:join': (data: { roomCode: string; playerName: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'game:move': (data: { roomId: string; position: Position }) => void;
  'game:capture': (data: { roomId: string; targetPosition: Position }) => void;
  'game:restart': (data: { roomId: string }) => void;
  'game:surrender': (data: { roomId: string }) => void;
}

/** 服务端 -> 客户端事件 */
export interface ServerToClientEvents {
  'room:created': (data: { roomId: string; roomCode: string; inviteUrl: string }) => void;
  'room:joined': (data: { room: Room; yourColor: PieceColor }) => void;
  'room:updated': (data: { room: Room }) => void;
  'room:error': (data: { message: string }) => void;
  'game:start': (data: { gameState: GameState; yourColor: PieceColor }) => void;
  'game:move': (data: { move: Move; newState: GameState }) => void;
  'game:capture': (data: { capturedPosition: Position; removedPositions: Position[]; newState: GameState }) => void;
  'game:end': (data: { winner: PieceColor | null; reason: GameEndReason; gameState: GameState }) => void;
  'game:restart': (data: { gameState: GameState }) => void;
  'player:joined': (data: { player: Player }) => void;
  'player:left': (data: { playerId: string }) => void;
}
