import React from 'react';
import { PieceColor } from '@gomoku/shared';
import styles from './Stone.module.css';

interface StoneProps {
  color: PieceColor;
  isLastMove?: boolean;
  isHighlighted?: boolean;
  size?: number;
}

const Stone: React.FC<StoneProps> = ({ color, isLastMove, isHighlighted, size = 36 }) => {
  if (color === PieceColor.NONE) return null;

  const stoneClass = [
    styles.stone,
    color === PieceColor.BLACK ? styles.black : styles.white,
    isLastMove ? styles.lastMove : '',
    isHighlighted ? styles.highlighted : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={stoneClass}
      style={{ width: size, height: size }}
    >
      {isLastMove && <div className={styles.lastMoveDot} />}
    </div>
  );
};

export default React.memo(Stone);
