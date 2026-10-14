import { PieceColor, AIDifficulty, BOARD_SIZE } from '@gomoku/shared';
import type { Position } from '@gomoku/shared';
import { findBestMove } from './minimax';
import { getCandidatePositions, evaluateMove } from './evaluator';

/**
 * 难度对应的搜索深度
 */
const DEPTH_MAP: Record<AIDifficulty, number> = {
  [AIDifficulty.EASY]: 2,
  [AIDifficulty.MEDIUM]: 4,
  [AIDifficulty.HARD]: 6,
};

/**
 * AI 引擎：根据难度计算最佳落子位置
 */
export function getAIMove(
  board: PieceColor[][],
  aiColor: PieceColor,
  difficulty: AIDifficulty
): Position | null {
  // 棋盘为空时，下中心
  const hasAnyPiece = board.some(row => row.some(cell => cell !== PieceColor.NONE));
  if (!hasAnyPiece) {
    const center = Math.floor(BOARD_SIZE / 2);
    return { row: center, col: center };
  }

  const depth = DEPTH_MAP[difficulty];

  // 简单难度：30% 概率随机走
  if (difficulty === AIDifficulty.EASY && Math.random() < 0.3) {
    return getRandomMove(board, aiColor);
  }

  // 简单难度：降低搜索宽度，增加随机性
  if (difficulty === AIDifficulty.EASY) {
    return findBestMoveWithNoise(board, aiColor, depth);
  }

  return findBestMove(board, aiColor, depth);
}

/**
 * 带噪声的 AI 搜索（简单难度）
 */
function findBestMoveWithNoise(
  board: PieceColor[][],
  aiColor: PieceColor,
  _depth: number
): Position | null {
  const candidates = getCandidatePositions(board);
  if (candidates.length === 0) return null;

  // 对候选位置评分
  const scored = candidates.map(pos => ({
    pos,
    score: evaluateMove(board, pos, aiColor) + Math.random() * 500, // 加入随机噪声
  }));
  scored.sort((a, b) => b.score - a.score);

  // 从 top-5 中随机选择
  const topN = scored.slice(0, Math.min(5, scored.length));
  return topN[Math.floor(Math.random() * topN.length)].pos;
}

/**
 * 随机选择一个合法位置（靠近已有棋子）
 */
function getRandomMove(board: PieceColor[][], aiColor: PieceColor): Position | null {
  const candidates = getCandidatePositions(board);
  if (candidates.length === 0) return null;

  // 优先选择评分较高的随机位置
  const scored = candidates.map(pos => ({
    pos,
    score: evaluateMove(board, pos, aiColor),
  }));
  scored.sort((a, b) => b.score - a.score);

  const topThird = scored.slice(0, Math.max(3, Math.floor(scored.length / 3)));
  return topThird[Math.floor(Math.random() * topThird.length)].pos;
}
