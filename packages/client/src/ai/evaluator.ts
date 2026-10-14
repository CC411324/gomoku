import { PieceColor, BOARD_SIZE, PATTERN_SCORES } from '@gomoku/shared';
import type { Position } from '@gomoku/shared';
import { PatternType, checkPatternAtPoint, identifyPattern, getPiecePositions } from './patterns';

/**
 * 棋型分数映射
 */
const SCORE_MAP: Record<PatternType, number> = {
  [PatternType.FIVE]: PATTERN_SCORES.FIVE,
  [PatternType.LIVE_FOUR]: PATTERN_SCORES.LIVE_FOUR,
  [PatternType.RUSH_FOUR]: PATTERN_SCORES.RUSH_FOUR,
  [PatternType.LIVE_THREE]: PATTERN_SCORES.LIVE_THREE,
  [PatternType.SLEEP_THREE]: PATTERN_SCORES.SLEEP_THREE,
  [PatternType.LIVE_TWO]: PATTERN_SCORES.LIVE_TWO,
  [PatternType.SLEEP_TWO]: PATTERN_SCORES.SLEEP_TWO,
  [PatternType.NONE]: 0,
};

/**
 * 评估单个位置的分数
 */
function evaluatePosition(board: PieceColor[][], pos: Position, color: PieceColor): number {
  if (board[pos.row][pos.col] !== color) return 0;
  const pattern = identifyPattern(board, pos, color);
  return SCORE_MAP[pattern];
}

/**
 * 评估整个棋盘的局面分数
 * 正值有利于 aiColor，负值有利于对手
 */
export function evaluateBoard(board: PieceColor[][], aiColor: PieceColor): number {
  const opponentColor = aiColor === PieceColor.BLACK ? PieceColor.WHITE : PieceColor.BLACK;
  let aiScore = 0;
  let opponentScore = 0;

  // 评估所有棋子的棋型
  const aiPositions = getPiecePositions(board, aiColor);
  const opponentPositions = getPiecePositions(board, opponentColor);

  for (const pos of aiPositions) {
    aiScore += evaluatePosition(board, pos, aiColor);
  }

  for (const pos of opponentPositions) {
    opponentScore += evaluatePosition(board, pos, opponentColor);
  }

  // 评估潜在威胁（空位上的棋型分析）
  aiScore += evaluatePotential(board, aiColor);
  opponentScore += evaluatePotential(board, opponentColor);

  return aiScore - opponentScore * 1.1; // 稍微偏重防守
}

/**
 * 评估潜在威胁（在空位上可以形成的棋型）
 */
function evaluatePotential(board: PieceColor[][], color: PieceColor): number {
  let score = 0;
  const checked = new Set<string>();

  // 只检查已有棋子周围的空位
  const candidates = getCandidatePositions(board);

  for (const pos of candidates) {
    const key = `${pos.row},${pos.col}`;
    if (checked.has(key)) continue;
    checked.add(key);

    const pattern = checkPatternAtPoint(board, pos, color);
    // 潜在棋型给予较低分数
    score += SCORE_MAP[pattern] * 0.3;
  }

  return score;
}

/**
 * 获取候选落子位置（已有棋子周围2格内的空位）
 */
export function getCandidatePositions(board: PieceColor[][]): Position[] {
  const candidates = new Set<string>();
  const result: Position[] = [];
  const radius = 2;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== PieceColor.NONE) {
        // 检查周围的空位
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
              if (board[nr][nc] === PieceColor.NONE) {
                const key = `${nr},${nc}`;
                if (!candidates.has(key)) {
                  candidates.add(key);
                  result.push({ row: nr, col: nc });
                }
              }
            }
          }
        }
      }
    }
  }

  // 如果棋盘为空，返回中心点
  if (result.length === 0) {
    const center = Math.floor(BOARD_SIZE / 2);
    result.push({ row: center, col: center });
  }

  return result;
}

/**
 * 快速评估某个位置对某方的重要性（用于候选位置排序）
 */
export function evaluateMove(board: PieceColor[][], pos: Position, color: PieceColor): number {
  const opponentColor = color === PieceColor.BLACK ? PieceColor.WHITE : PieceColor.BLACK;

  // 我在此处落子后的棋型
  const myPattern = checkPatternAtPoint(board, pos, color);
  const myScore = SCORE_MAP[myPattern];

  // 对手在此处落子的棋型（防守价值）
  const oppPattern = checkPatternAtPoint(board, pos, opponentColor);
  const oppScore = SCORE_MAP[oppPattern];

  return myScore + oppScore * 0.9;
}
