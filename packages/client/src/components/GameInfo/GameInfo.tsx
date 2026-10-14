import React from 'react';
import { PieceColor, GameMode, GameStatus, GameState } from '@gomoku/shared';
import styles from './GameInfo.module.css';

interface GameInfoProps {
  gameState: GameState;
  playerName?: string;
  opponentName?: string;
}

const GameInfo: React.FC<GameInfoProps> = ({ gameState, playerName = '玩家', opponentName = '对手' }) => {
  const { currentPlayer, status, winner, mode, blackPiecesRemaining, whitePiecesRemaining, moves } = gameState;

  const getStatusText = () => {
    if (status === GameStatus.FINISHED) {
      if (winner === PieceColor.BLACK) return '黑方获胜！';
      if (winner === PieceColor.WHITE) return '白方获胜！';
      return '平局！';
    }
    if (gameState.awaitingCapture) {
      return `${currentPlayer === PieceColor.BLACK ? '黑方' : '白方'}请选择吃子位置`;
    }
    return `${currentPlayer === PieceColor.BLACK ? '黑方' : '白方'}回合`;
  };

  const getCurrentIndicator = () => {
    if (status === GameStatus.FINISHED) return null;
    return (
      <div className={styles.turnIndicator}>
        <div className={`${styles.stoneIcon} ${currentPlayer === PieceColor.BLACK ? styles.blackIcon : styles.whiteIcon}`} />
        <span>{getStatusText()}</span>
      </div>
    );
  };

  return (
    <div className={styles.gameInfo}>
      <div className={styles.statusSection}>
        {getStatusText() && (
          <div className={`${styles.statusText} ${status === GameStatus.FINISHED ? styles.finished : ''}`}>
            {getStatusText()}
          </div>
        )}
        {getCurrentIndicator()}
      </div>

      <div className={styles.players}>
        <div className={`${styles.player} ${currentPlayer === PieceColor.BLACK && status === GameStatus.PLAYING ? styles.active : ''}`}>
          <div className={`${styles.playerStone} ${styles.blackStone}`} />
          <div className={styles.playerInfo}>
            <span className={styles.playerName}>{playerName}</span>
            <span className={styles.playerLabel}>黑方</span>
          </div>
          {mode === GameMode.ENDLESS && (
            <span className={styles.pieceCount}>剩余: {blackPiecesRemaining ?? 0}</span>
          )}
        </div>

        <div className={styles.vs}>VS</div>

        <div className={`${styles.player} ${currentPlayer === PieceColor.WHITE && status === GameStatus.PLAYING ? styles.active : ''}`}>
          <div className={`${styles.playerStone} ${styles.whiteStone}`} />
          <div className={styles.playerInfo}>
            <span className={styles.playerName}>{opponentName}</span>
            <span className={styles.playerLabel}>白方</span>
          </div>
          {mode === GameMode.ENDLESS && (
            <span className={styles.pieceCount}>剩余: {whitePiecesRemaining ?? 0}</span>
          )}
        </div>
      </div>

      <div className={styles.moveCount}>
        第 {moves.length} 手
      </div>
    </div>
  );
};

export default GameInfo;
