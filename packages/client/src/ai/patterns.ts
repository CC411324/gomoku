import { PieceColor, BOARD_SIZE, DIRECTIONS } from '@gomoku/shared';
import type { Position } from '@gomoku/shared';

/**
 * 棋型枚举
 */
export enum PatternType {
  FIVE,         // 连五
  LIVE_FOUR,    // 活四
  RUSH_FOUR,    // 冲四
  LIVE_THREE,   // 活三
  SLEEP_THREE,  // 眠三
  LIVE_TWO,     // 活二
  SLEEP_TWO,    // 眠二
  NONE,         // 无棋型
}

/**
 * 分析某方向上的棋型
 * @param board 棋盘
 * @param pos 当前位置
 * @param dir 方向 [dr, dc]
 * @param color 棋子颜色
 */
export function analyzeDirection(
  board: PieceColor[][],
  pos: Position,
  dir: readonly [number, number],
  color: PieceColor
): { count: number; openEnds: number } {
  const [dr, dc] = dir;
  let count = 1;
  let openEnds = 0;

  // 正方向计数
  let r = pos.row + dr;
  let c = pos.col + dc;
  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
    count++;
    r += dr;
    c += dc;
  }
  // 检查正方向端点
  if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === PieceColor.NONE) {
    openEnds++;
  }

  // 反方向计数
  r = pos.row - dr;
  c = pos.col - dc;
  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
    count++;
    r -= dr;
    c -= dc;
  }
  // 检查反方向端点
  if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === PieceColor.NONE) {
    openEnds++;
  }

  return { count, openEnds };
}

/**
 * 识别某位置的棋型
 */
export function identifyPattern(
  board: PieceColor[][],
  pos: Position,
  color: PieceColor
): PatternType {
  if (board[pos.row][pos.col] !== color) return PatternType.NONE;

  let bestPattern = PatternType.NONE;

  for (const dir of DIRECTIONS) {
    const { count, openEnds } = analyzeDirection(board, pos, dir, color);

    if (count >= 5) return PatternType.FIVE;

    if (count === 4) {
      if (openEnds === 2) return PatternType.LIVE_FOUR;
      if (openEnds === 1) bestPattern = Math.max(bestPattern, PatternType.RUSH_FOUR);
    } else if (count === 3) {
      if (openEnds === 2) bestPattern = Math.max(bestPattern, PatternType.LIVE_THREE);
      if (openEnds === 1) bestPattern = Math.max(bestPattern, PatternType.SLEEP_THREE);
    } else if (count === 2) {
      if (openEnds === 2) bestPattern = Math.max(bestPattern, PatternType.LIVE_TWO);
      if (openEnds === 1) bestPattern = Math.max(bestPattern, PatternType.SLEEP_TWO);
    }
  }

  return bestPattern;
}

/**
 * 检查某位置落子后是否形成特定棋型（用于评估潜在威胁）
 */
export function checkPatternAtPoint(
  board: PieceColor[][],
  pos: Position,
  color: PieceColor
): PatternType {
  if (board[pos.row][pos.col] !== PieceColor.NONE) return PatternType.NONE;

  // 临时放置棋子
  board[pos.row][pos.col] = color;
  const pattern = identifyPattern(board, pos, color);
  board[pos.row][pos.col] = PieceColor.NONE;

  return pattern;
}

/**
 * 获取棋盘上所有指定颜色棋子的位置
 */
export function getPiecePositions(board: PieceColor[][], color: PieceColor): Position[] {
  const positions: Position[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === color) {
        positions.push({ row: r, col: c });
      }
    }
  }
  return positions;
}
