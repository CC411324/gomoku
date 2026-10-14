import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PieceColor, GameStatus, Position, GameState,
} from '@gomoku/shared';
import {
  isValidMove, skipCapture, getCapturablePositions,
} from '@gomoku/shared';
import Board from '../../components/Board/Board';
import GameInfo from '../../components/GameInfo/GameInfo';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { getSocket, disconnectSocket } from '../../services/socket';
import styles from './OnlineGame.module.css';

interface LocationState {
  room?: any;
  gameState?: GameState;
  yourColor: PieceColor;
  playerName: string;
}

const OnlineGame: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  const [gameState, setGameState] = useState<GameState | null>(
    state?.gameState || null
  );
  const [showResult, setShowResult] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  const [yourColor] = useState<PieceColor>(state?.yourColor || PieceColor.BLACK);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    if (!state) {
      navigate('/online');
      return;
    }

    const socket = getSocket();
    const rid = state.room?.id || '';
    setRoomId(rid);

    if (state.gameState) {
      setGameState(state.gameState);
    }

    socket.on('game:move', (data) => {
      setGameState(data.newState);
    });

    socket.on('game:capture', (data) => {
      setGameState(data.newState);
    });

    socket.on('game:end', (data) => {
      setGameState(data.gameState);
      setShowResult(true);
    });

    socket.on('game:restart', (data) => {
      setGameState(data.gameState);
      setShowResult(false);
    });

    socket.on('player:left', () => {
      setDisconnected(true);
    });

    socket.on('disconnect', () => {
      setDisconnected(true);
    });

    socket.on('connect', () => {
      setDisconnected(false);
    });

    return () => {
      socket.off('game:move');
      socket.off('game:capture');
      socket.off('game:end');
      socket.off('game:restart');
      socket.off('player:left');
      socket.off('disconnect');
      socket.off('connect');
    };
  }, [state, navigate]);

  const handleCellClick = useCallback((pos: Position) => {
    if (!gameState || gameState.status !== GameStatus.PLAYING) return;
    if (gameState.currentPlayer !== yourColor) return;

    // 无尽模式吃子
    if (gameState.awaitingCapture && gameState.currentPlayer === yourColor) {
      const capturable = getCapturablePositions(gameState);
      const isCapturable = capturable.some(p => p.row === pos.row && p.col === pos.col);
      if (isCapturable) {
        const socket = getSocket();
        socket.emit('game:capture', { roomId, targetPosition: pos });
      }
      return;
    }

    if (gameState.awaitingCapture) return;
    if (!isValidMove(gameState.board, pos)) return;

    const socket = getSocket();
    socket.emit('game:move', { roomId, position: pos });
  }, [gameState, yourColor, roomId]);

  const handleSkipCapture = useCallback(() => {
    if (!gameState || !gameState.awaitingCapture) return;
    // 本地执行跳过
    const newState = skipCapture(gameState);
    if (newState) {
      setGameState(newState);
    }
  }, [gameState]);

  const handleSurrender = useCallback(() => {
    const socket = getSocket();
    socket.emit('game:surrender', { roomId });
  }, [roomId]);

  const handleRestart = useCallback(() => {
    const socket = getSocket();
    socket.emit('game:restart', { roomId });
  }, [roomId]);

  const handleLeave = useCallback(() => {
    const socket = getSocket();
    socket.emit('room:leave', { roomId });
    disconnectSocket();
    navigate('/');
  }, [roomId, navigate]);

  if (!gameState) {
    return (
      <div className={styles.loading}>
        <p>等待游戏开始...</p>
      </div>
    );
  }

  const capturablePositions = gameState.awaitingCapture && gameState.currentPlayer === yourColor
    ? getCapturablePositions(gameState)
    : [];

  const lastMove = gameState.moves.length > 0
    ? gameState.moves[gameState.moves.length - 1].position
    : null;

  const isYourTurn = gameState.currentPlayer === yourColor && gameState.status === GameStatus.PLAYING;
  const opponentName = yourColor === PieceColor.BLACK ? '白方' : '黑方';
  const yourName = yourColor === PieceColor.BLACK ? '你 (黑方)' : '你 (白方)';

  const getResultText = () => {
    if (gameState.winner === yourColor) return '恭喜你获胜！';
    if (gameState.winner) return '对手获胜';
    return '平局！';
  };

  return (
    <div className={styles.game}>
      <div className={styles.gameArea}>
        <div className={styles.infoPanel}>
          <GameInfo
            gameState={gameState}
            playerName={yourName}
            opponentName={opponentName}
          />

          {gameState.awaitingCapture && gameState.currentPlayer === yourColor && (
            <div className={styles.captureHint}>
              <p>点击对方棋子吃掉它</p>
              <Button variant="ghost" size="small" onClick={handleSkipCapture}>跳过</Button>
            </div>
          )}

          {disconnected && (
            <div className={styles.disconnect}>连接已断开</div>
          )}

          <div className={styles.actions}>
            {gameState.status === GameStatus.PLAYING && (
              <Button variant="danger" size="small" onClick={handleSurrender}>认输</Button>
            )}
            <Button variant="ghost" size="small" onClick={handleLeave}>离开房间</Button>
          </div>
        </div>

        <div className={styles.boardWrapper}>
          <Board
            board={gameState.board}
            onCellClick={handleCellClick}
            lastMove={lastMove}
            highlightedPositions={gameState.linePositions}
            capturablePositions={capturablePositions}
            disabled={!isYourTurn || gameState.awaitingCapture && gameState.currentPlayer !== yourColor}
          />
          <div className={styles.turnBadge}>
            {gameState.status === GameStatus.PLAYING
              ? (isYourTurn ? '你的回合' : '等待对手...')
              : '游戏结束'}
          </div>
        </div>
      </div>

      <Modal isOpen={showResult} title="游戏结束">
        <div className={styles.result}>
          <p className={styles.resultText}>{getResultText()}</p>
          <p className={styles.resultDetail}>共 {gameState.moves.length} 手</p>
          <div className={styles.resultActions}>
            <Button variant="primary" onClick={handleRestart}>再来一局</Button>
            <Button variant="ghost" onClick={handleLeave}>返回首页</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OnlineGame;
