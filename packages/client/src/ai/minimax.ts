import { PieceColor, BOARD_SIZE, checkFiveInRow } from '@gomoku/shared';
import type { Position } from '@gomoku/shared';
import { evaluateBoard, getCandidatePositions, evaluateMove } from './evaluator';

/**
 * Minimax + Alpha-Beta 剪枝
 * @param board 棋盘
 * @param depth 搜索深度
 * @param alpha alpha 值
 * @param beta beta 值
 * @param isMaximizing 是否为最大化玩家
 * @param aiColor AI 的棋子颜色
 * @returns [分数, 最佳位置]
 */
function minimax(
  board: PieceColor[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiColor: PieceColor
): [number, Position | null] {
  const opponentColor = aiColor === PieceColor.BLACK ? PieceColor.WHITE : PieceColor.BLACK;
  const currentColor = isMaximizing ? aiColor : opponentColor;

  // 获取候选位置并排序（优化搜索顺序）
  const candidates = getCandidatePositions(board);

  // 对候选位置进行评分排序，优先搜索高分位置
  const scored = candidates.map(pos => ({
    pos,
    score: evaluateMove(board, pos, currentColor),
  }));
  scored.sort((a, b) => b.score - a.score);

  // 限制搜索宽度（只考虑前 N 个最佳位置）
  const maxBranching = depth >= 4 ? 10 : 15;
  const topMoves = scored.slice(0, maxBranching);

  // 终止条件
  if (depth === 0 || topMoves.length === 0) {
    return [evaluateBoard(board, aiColor), null];
  }

  let bestPos: Position | null = null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const { pos } of topMoves) {
      // 落子
      board[pos.row][pos.col] = aiColor;

      // 检查是否五连
      const line = checkFiveInRow(board, pos);
      let score: number;
      if (line) {
        score = 1000000 + depth; // 越快获胜分数越高
      } else {
        score = minimax(board, depth - 1, alpha, beta, false, aiColor)[0];
      }

      // 撤销
      board[pos.row][pos.col] = PieceColor.NONE;

      if (score > maxEval) {
        maxEval = score;
        bestPos = pos;
      }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // Beta 剪枝
    }
    return [maxEval, bestPos];
  } else {
    let minEval = Infinity;
    for (const { pos } of topMoves) {
      // 落子
      board[pos.row][pos.col] = opponentColor;

      // 检查是否五连
      const line = checkFiveInRow(board, pos);
      let score: number;
      if (line) {
        score = -1000000 - depth; // 越快输掉分数越低
      } else {
        score = minimax(board, depth - 1, alpha, beta, true, aiColor)[0];
      }

      // 撤销
      board[pos.row][pos.col] = PieceColor.NONE;

      if (score < minEval) {
        minEval = score;
        bestPos = pos;
      }
      beta = Math.min(beta, score);
      if (beta <= alpha) break; // Alpha 剪枝
    }
    return [minEval, bestPos];
  }
}

/**
 * 使用 Minimax 算法寻找最佳落子点
 */
export function findBestMove(
  board: PieceColor[][],
  aiColor: PieceColor,
  depth: number = 4
): Position | null {
  // 棋盘为空时，下中心
  const hasAnyPiece = board.some(row => row.some(cell => cell !== PieceColor.NONE));
  if (!hasAnyPiece) {
    const center = Math.floor(BOARD_SIZE / 2);
    return { row: center, col: center };
  }

  // 先检查是否有立即获胜的点
  const candidates = getCandidatePositions(board);
  for (const pos of candidates) {
    board[pos.row][pos.col] = aiColor;
    if (checkFiveInRow(board, pos)) {
      board[pos.row][pos.col] = PieceColor.NONE;
      return pos;
    }
    board[pos.row][pos.col] = PieceColor.NONE;
  }

  // 检查是否需要阻止对手立即获胜
  const opponentColor = aiColor === PieceColor.BLACK ? PieceColor.WHITE : PieceColor.BLACK;
  for (const pos of candidates) {
    board[pos.row][pos.col] = opponentColor;
    if (checkFiveInRow(board, pos)) {
      board[pos.row][pos.col] = PieceColor.NONE;
      return pos; // 必须堵住
    }
    board[pos.row][pos.col] = PieceColor.NONE;
  }

  // 使用 Minimax 搜索
  const boardCopy = board.map(row => [...row]);
  const [, bestPos] = minimax(boardCopy, depth, -Infinity, Infinity, true, aiColor);

  return bestPos;
}
