import { PieceColor, Position, GameState, GameStatus, GameEndReason, GameMode } from './types';
import { BOARD_SIZE, WIN_COUNT, ENDLESS_INITIAL_PIECES } from './constants';
import {
  createEmptyBoard,
  isValidMove,
  placePiece,
  checkFiveInRow,
  switchPlayer,
  getOpponentColor,
  isBoardFull,
} from './rules';

/**
 * 创建无尽模式初始游戏状态
 */
export function createEndlessGameState(): GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: PieceColor.BLACK,
    moves: [],
    status: GameStatus.PLAYING,
    winner: null,
    mode: GameMode.ENDLESS,
    blackPiecesRemaining: ENDLESS_INITIAL_PIECES,
    whitePiecesRemaining: ENDLESS_INITIAL_PIECES,
  };
}

/**
 * 无尽模式落子
 * 成5连后：移除成线的5颗棋子，并可吃掉对方1颗棋子
 */
export function makeEndlessMove(
  state: GameState,
  pos: Position
): { newState: GameState; formedLine: Position[] | null } | null {
  if (state.status !== GameStatus.PLAYING) return null;
  if (state.awaitingCapture) return null; // 正在等待吃子选择
  if (!isValidMove(state.board, pos)) return null;

  const color = state.currentPlayer;
  const newBoard = placePiece(state.board, pos, color);
  const newMove = {
    position: pos,
    color,
    moveNumber: state.moves.length + 1,
    timestamp: Date.now(),
  };

  // 更新剩余棋子数
  const blackRemaining = (state.blackPiecesRemaining ?? ENDLESS_INITIAL_PIECES) - (color === PieceColor.BLACK ? 1 : 0);
  const whiteRemaining = (state.whitePiecesRemaining ?? ENDLESS_INITIAL_PIECES) - (color === PieceColor.WHITE ? 1 : 0);

  const newState: GameState = {
    ...state,
    board: newBoard,
    moves: [...state.moves, newMove],
    blackPiecesRemaining: blackRemaining,
    whitePiecesRemaining: whiteRemaining,
  };

  // 检查是否五连
  const line = checkFiveInRow(newBoard, pos);
  if (line) {
    // 只取前5颗（可能超过5连）
    const lineToRemove = line.slice(0, WIN_COUNT);

    // 移除成线的棋子
    for (const p of lineToRemove) {
      newBoard[p.row][p.col] = PieceColor.NONE;
    }

    // 恢复使用的棋子（成线后不消耗）
    const restoredBlack = blackRemaining + (color === PieceColor.BLACK ? WIN_COUNT : 0);
    const restoredWhite = whiteRemaining + (color === PieceColor.WHITE ? WIN_COUNT : 0);

    newState.board = newBoard;
    newState.blackPiecesRemaining = color === PieceColor.BLACK ? restoredBlack : blackRemaining;
    newState.whitePiecesRemaining = color === PieceColor.WHITE ? restoredWhite : whiteRemaining;
    newState.linePositions = lineToRemove;
    newState.awaitingCapture = true; // 等待选择吃子位置

    return { newState, formedLine: lineToRemove };
  }

  // 未成5连，切换玩家
  newState.currentPlayer = switchPlayer(color);

  // 检查游戏是否结束
  checkEndlessGameEnd(newState);

  return { newState, formedLine: null };
}

/**
 * 无尽模式吃子
 * 成5连后，选择对方一颗棋子吃掉（变为己方颜色）
 */
export function makeEndlessCapture(
  state: GameState,
  targetPos: Position
): GameState | null {
  if (!state.awaitingCapture) return null;

  const color = state.currentPlayer;
  const opponentColor = getOpponentColor(color);

  // 验证目标位置有对方棋子
  if (state.board[targetPos.row][targetPos.col] !== opponentColor) return null;

  const newBoard = state.board.map(row => [...row]);
  // 吃掉对方棋子（变为己方颜色）
  newBoard[targetPos.row][targetPos.col] = color;

  const newState: GameState = {
    ...state,
    board: newBoard,
    currentPlayer: switchPlayer(color),
    awaitingCapture: false,
    linePositions: undefined,
  };

  // 检查游戏是否结束
  checkEndlessGameEnd(newState);

  return newState;
}

/**
 * 跳过吃子（选择不吃）
 */
export function skipCapture(state: GameState): GameState | null {
  if (!state.awaitingCapture) return null;

  const newState: GameState = {
    ...state,
    currentPlayer: switchPlayer(state.currentPlayer),
    awaitingCapture: false,
    linePositions: undefined,
  };

  checkEndlessGameEnd(newState);
  return newState;
}

/**
 * 检查无尽模式游戏是否结束
 */
function checkEndlessGameEnd(state: GameState): void {
  const blackRemaining = state.blackPiecesRemaining ?? 0;
  const whiteRemaining = state.whitePiecesRemaining ?? 0;

  // 某一方无棋子可用
  if (blackRemaining <= 0 && whiteRemaining <= 0) {
    state.status = GameStatus.FINISHED;
    // 比较棋盘上双方棋子数
    state.winner = countPiecesOnBoard(state.board);
    state.endReason = GameEndReason.NO_PIECES_LEFT;
    return;
  }

  // 棋盘已满
  if (isBoardFull(state.board)) {
    state.status = GameStatus.FINISHED;
    state.winner = countPiecesOnBoard(state.board);
    state.endReason = GameEndReason.BOARD_FULL;
    return;
  }

  // 某一方无棋子且棋盘无法继续
  if (blackRemaining <= 0 || whiteRemaining <= 0) {
    // 如果一方没有棋子了，另一方继续下直到棋盘满或也没棋子
    const remaining = blackRemaining > 0 ? blackRemaining : whiteRemaining;
    const emptySpaces = countEmptySpaces(state.board);
    if (remaining <= 0 || emptySpaces <= 0) {
      state.status = GameStatus.FINISHED;
      state.winner = countPiecesOnBoard(state.board);
      state.endReason = remaining <= 0 ? GameEndReason.NO_PIECES_LEFT : GameEndReason.BOARD_FULL;
    }
  }
}

/**
 * 统计棋盘上的棋子，返回棋子多的一方
 */
function countPiecesOnBoard(board: PieceColor[][]): PieceColor | null {
  let blackCount = 0;
  let whiteCount = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === PieceColor.BLACK) blackCount++;
      else if (board[r][c] === PieceColor.WHITE) whiteCount++;
    }
  }

  if (blackCount > whiteCount) return PieceColor.BLACK;
  if (whiteCount > blackCount) return PieceColor.WHITE;
  return null; // 平局
}

/**
 * 统计棋盘上空位数量
 */
function countEmptySpaces(board: PieceColor[][]): number {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === PieceColor.NONE) count++;
    }
  }
  return count;
}

/**
 * 获取可以吃的对方棋子位置（无尽模式）
 */
export function getCapturablePositions(state: GameState): Position[] {
  if (!state.awaitingCapture) return [];

  const opponentColor = getOpponentColor(state.currentPlayer);
  const positions: Position[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (state.board[r][c] === opponentColor) {
        positions.push({ row: r, col: c });
      }
    }
  }

  return positions;
}
