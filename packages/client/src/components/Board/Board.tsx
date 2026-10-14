import React, { useMemo } from 'react';
import { PieceColor, Position, BOARD_SIZE } from '@gomoku/shared';
import Stone from './Stone';
import styles from './Board.module.css';

interface BoardProps {
  board: PieceColor[][];
  onCellClick?: (pos: Position) => void;
  lastMove?: Position | null;
  highlightedPositions?: Position[];
  capturablePositions?: Position[];
  disabled?: boolean;
  cellSize?: number;
}

const Board: React.FC<BoardProps> = ({
  board,
  onCellClick,
  lastMove,
  highlightedPositions = [],
  capturablePositions = [],
  disabled = false,
  cellSize = 40,
}) => {
  const stoneSize = Math.floor(cellSize * 0.88);

  const highlightedSet = useMemo(() => {
    const set = new Set<string>();
    highlightedPositions.forEach(p => set.add(`${p.row},${p.col}`));
    return set;
  }, [highlightedPositions]);

  const capturableSet = useMemo(() => {
    const set = new Set<string>();
    capturablePositions.forEach(p => set.add(`${p.row},${p.col}`));
    return set;
  }, [capturablePositions]);

  const handleClick = (row: number, col: number) => {
    if (disabled) return;
    onCellClick?.({ row, col });
  };

  // 星位坐标 (3,3), (3,11), (7,7), (11,3), (11,11)
  const starPoints = useMemo(() => [
    { row: 3, col: 3 },
    { row: 3, col: 11 },
    { row: 7, col: 7 },
    { row: 11, col: 3 },
    { row: 11, col: 11 },
  ], []);

  const starPointSet = useMemo(() => {
    const set = new Set<string>();
    starPoints.forEach(p => set.add(`${p.row},${p.col}`));
    return set;
  }, [starPoints]);

  const boardWidth = cellSize * (BOARD_SIZE - 1) + cellSize;

  return (
    <div className={styles.boardContainer}>
      <div
        className={styles.board}
        style={{ width: boardWidth, height: boardWidth }}
      >
        {/* 棋盘网格线 */}
        <svg
          className={styles.grid}
          width={boardWidth}
          height={boardWidth}
        >
          {Array.from({ length: BOARD_SIZE }, (_, i) => (
            <React.Fragment key={`line-${i}`}>
              {/* 横线 */}
              <line
                x1={cellSize / 2}
                y1={cellSize / 2 + i * cellSize}
                x2={boardWidth - cellSize / 2}
                y2={cellSize / 2 + i * cellSize}
                stroke="#8B7355"
                strokeWidth="1"
              />
              {/* 竖线 */}
              <line
                x1={cellSize / 2 + i * cellSize}
                y1={cellSize / 2}
                x2={cellSize / 2 + i * cellSize}
                y2={boardWidth - cellSize / 2}
                stroke="#8B7355"
                strokeWidth="1"
              />
            </React.Fragment>
          ))}
          {/* 星位 */}
          {starPoints.map(p => (
            <circle
              key={`star-${p.row}-${p.col}`}
              cx={cellSize / 2 + p.col * cellSize}
              cy={cellSize / 2 + p.row * cellSize}
              r={4}
              fill="#8B7355"
            />
          ))}
        </svg>

        {/* 坐标标签 */}
        <div className={styles.coordinates}>
          {Array.from({ length: BOARD_SIZE }, (_, i) => (
            <React.Fragment key={`coord-${i}`}>
              {/* 上方字母 */}
              <span
                className={styles.coordLabel}
                style={{
                  left: cellSize / 2 + i * cellSize,
                  top: 2,
                  transform: 'translateX(-50%)',
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {/* 左侧数字 */}
              <span
                className={styles.coordLabel}
                style={{
                  left: 2,
                  top: cellSize / 2 + i * cellSize,
                  transform: 'translateY(-50%)',
                }}
              >
                {BOARD_SIZE - i}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* 可点击区域 + 棋子 */}
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const key = `${rowIndex}-${colIndex}`;
            const isLast = lastMove?.row === rowIndex && lastMove?.col === colIndex;
            const isHighlighted = highlightedSet.has(`${rowIndex},${colIndex}`);
            const isCapturable = capturableSet.has(`${rowIndex},${colIndex}`);
            const isStarPoint = starPointSet.has(`${rowIndex},${colIndex}`);

            return (
              <div
                key={key}
                className={`${styles.cell} ${isCapturable ? styles.capturable : ''}`}
                style={{
                  left: colIndex * cellSize,
                  top: rowIndex * cellSize,
                  width: cellSize,
                  height: cellSize,
                }}
                onClick={() => handleClick(rowIndex, colIndex)}
              >
                {cell !== PieceColor.NONE ? (
                  <Stone
                    color={cell}
                    isLastMove={isLast}
                    isHighlighted={isHighlighted}
                    size={stoneSize}
                  />
                ) : (
                  isStarPoint && (
                    <div
                      className={styles.starPointHint}
                      style={{ width: 8, height: 8 }}
                    />
                  )
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(Board);
