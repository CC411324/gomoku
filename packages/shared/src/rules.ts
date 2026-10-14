import { PieceColor, Position, GameMode, GameStatus, GameState } from './types';
import { BOARD_SIZE, WIN_COUNT, DIRECTIONS, ENDLESS_INITIAL_PIECES } from './constants';

/**
 * 创建空的棋盘
 */
export function createEmptyBoard(): PieceColor[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => PieceColor.NONE)
  );
}

/**
 * 创建初始游戏状态
 */
export function createInitialGameState(mode: GameMode): GameState {
  const state: GameState = {
    board: createEmptyBoard(),
    currentPlayer: PieceColor.BLACK,
    moves: [],
    status: GameStatus.PLAYING,
    winner: null,
    mode,
  };

  if (mode === GameMode.ENDLESS) {
    state.blackPiecesRemaining = ENDLESS_INITIAL_PIECES;
    state.whitePiecesRemaining = ENDLESS_INITIAL_PIECES;
  }

  return state;
}

/**
 * 验证落子位置是否合法
 */
export function isValidMove(board: PieceColor[][], pos: Position): boolean {
  if (pos.row < 0 || pos.row >= BOARD_SIZE || pos.col < 0 || pos.col >= BOARD_SIZE) {
    return false;
  }
  return board[pos.row][pos.col] === PieceColor.NONE;
}

/**
 * 在棋盘上放置棋子（返回新棋盘，不修改原棋盘）
 */
export function placePiece(board: PieceColor[][], pos: Position, color: PieceColor): PieceColor[][] {
  const newBoard = board.map(row => [...row]);
  newBoard[pos.row][pos.col] = color;
  return newBoard;
}

/**
 * 检查某个位置是否形成五连
 * @returns 连成线的棋子位置数组，如果没有五连则返回 null
 */
export function checkFiveInRow(board: PieceColor[][], pos: Position): Position[] | null {
  const color = board[pos.row][pos.col];
  if (color === PieceColor.NONE) return null;

  for (const [dr, dc] of DIRECTIONS) {
    const line: Position[] = [pos];

    // 正方向延伸
    let r = pos.row + dr;
    let c = pos.col + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
      line.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    // 反方向延伸
    r = pos.row - dr;
    c = pos.col - dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
      line.push({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    if (line.length >= WIN_COUNT) {
      return line;
    }
  }

  return null;
}

/**
 * 检查某个方向上的连续棋子数
 */
export function getLineCount(
  board: PieceColor[][],
  pos: Position,
  direction: readonly [number, number],
  color: PieceColor
): number {
  const [dr, dc] = direction;
  let count = 1;

  // 正方向
  let r = pos.row + dr;
  let c = pos.col + dc;
  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
    count++;
    r += dr;
    c += dc;
  }

  // 反方向
  r = pos.row - dr;
  c = pos.col - dc;
  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
    count++;
    r -= dr;
    c -= dc;
  }

  return count;
}

/**
 * 检查棋盘是否已满
 */
export function isBoardFull(board: PieceColor[][]): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === PieceColor.NONE) return false;
    }
  }
  return true;
}

/**
 * 获取对方颜色
 */
export function getOpponentColor(color: PieceColor): PieceColor {
  return color === PieceColor.BLACK ? PieceColor.WHITE : PieceColor.BLACK;
}

/**
 * 切换当前玩家
 */
export function switchPlayer(currentPlayer: PieceColor): PieceColor {
  return currentPlayer === PieceColor.BLACK ? PieceColor.WHITE : PieceColor.BLACK;
}

/**
 * 执行一步落子（标准模式）
 * @returns 新的游戏状态，如果落子不合法则返回 null
 */
export function makeMove(state: GameState, pos: Position): GameState | null {
  if (state.status !== GameStatus.PLAYING) return null;
  if (!isValidMove(state.board, pos)) return null;

  const color = state.currentPlayer;
  const newBoard = placePiece(state.board, pos, color);
  const newMove = {
    position: pos,
    color,
    moveNumber: state.moves.length + 1,
    timestamp: Date.now(),
  };

  const newState: GameState = {
    ...state,
    board: newBoard,
    moves: [...state.moves, newMove],
    currentPlayer: switchPlayer(color),
  };

  // 检查是否五连获胜
  const line = checkFiveInRow(newBoard, pos);
  if (line) {
    newState.status = GameStatus.FINISHED;
    newState.winner = color;
    newState.linePositions = line;
    return newState;
  }

  // 标准模式：检查棋盘是否已满
  if (state.mode === GameMode.STANDARD) {
    if (isBoardFull(newBoard)) {
      newState.status = GameStatus.FINISHED;
      newState.winner = null;
      return newState;
    }
  }

  return newState;
}
