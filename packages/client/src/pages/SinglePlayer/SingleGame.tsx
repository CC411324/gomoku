import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PieceColor, GameMode, GameStatus, AIDifficulty, Position, GameState,
} from '@gomoku/shared';
import {
  createInitialGameState, makeMove, isValidMove,
} from '@gomoku/shared';
import {
  createEndlessGameState, makeEndlessMove, makeEndlessCapture,
  skipCapture, getCapturablePositions,
} from '@gomoku/shared';
import Board from '../../components/Board/Board';
import GameInfo from '../../components/GameInfo/GameInfo';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { getAIMove } from '../../ai/engine';
import styles from './SingleGame.module.css';

interface LocationState {
  difficulty: AIDifficulty;
  mode: GameMode;
}

const SingleGame: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as LocationState) || { difficulty: AIDifficulty.MEDIUM, mode: GameMode.STANDARD };

  const [gameState, setGameState] = useState<GameState>(() => {
    if (state.mode === GameMode.ENDLESS) {
      return createEndlessGameState();
    }
    return createInitialGameState(state.mode);
  });
  const [aiThinking, setAiThinking] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const aiColor = PieceColor.WHITE;
  const playerColor = PieceColor.BLACK;
  const aiThinkingRef = useRef(false);

  // AI 走棋
  useEffect(() => {
    if (
      gameState.status === GameStatus.PLAYING &&
      gameState.currentPlayer === aiColor &&
      !gameState.awaitingCapture &&
      !aiThinkingRef.current
    ) {
      aiThinkingRef.current = true;
      setAiThinking(true);

      // 使用 setTimeout 让 UI 先更新
      setTimeout(() => {
        const boardCopy = gameState.board.map(row => [...row]);
        const move = getAIMove(boardCopy, aiColor, state.difficulty);

        if (move && isValidMove(gameState.board, move)) {
          if (state.mode === GameMode.ENDLESS) {
            const result = makeEndlessMove(gameState, move);
            if (result) {
              setGameState(result.newState);
            }
          } else {
            const newState = makeMove(gameState, move);
            if (newState) {
              setGameState(newState);
            }
          }
        }

        setAiThinking(false);
        aiThinkingRef.current = false;
      }, 300);
    }
  }, [gameState, aiColor, state.difficulty, state.mode]);

  // 游戏结束时显示结果
  useEffect(() => {
    if (gameState.status === GameStatus.FINISHED) {
      setTimeout(() => setShowResult(true), 500);
    }
  }, [gameState.status]);

  // 玩家点击棋盘
  const handleCellClick = useCallback((pos: Position) => {
    if (aiThinking) return;
    if (gameState.status !== GameStatus.PLAYING) return;

    // 无尽模式：等待吃子选择
    if (gameState.awaitingCapture && gameState.currentPlayer === playerColor) {
      const capturable = getCapturablePositions(gameState);
      const isCapturable = capturable.some(p => p.row === pos.row && p.col === pos.col);

      if (isCapturable) {
        const newState = makeEndlessCapture(gameState, pos);
        if (newState) {
          setGameState(newState);
        }
      }
      return;
    }

    // 等待吃子时不能吃子（无尽模式对手回合）
    if (gameState.awaitingCapture) return;

    // 非玩家回合
    if (gameState.currentPlayer !== playerColor) return;

    // 标准落子
    if (state.mode === GameMode.ENDLESS) {
      const result = makeEndlessMove(gameState, pos);
      if (result) {
        setGameState(result.newState);
      }
    } else {
      const newState = makeMove(gameState, pos);
      if (newState) {
        setGameState(newState);
      }
    }
  }, [gameState, aiThinking, playerColor, state.mode]);

  // 跳过吃子
  const handleSkipCapture = useCallback(() => {
    const newState = skipCapture(gameState);
    if (newState) {
      setGameState(newState);
    }
  }, [gameState]);

  // 重新开始
  const handleRestart = useCallback(() => {
    setShowResult(false);
    if (state.mode === GameMode.ENDLESS) {
      setGameState(createEndlessGameState());
    } else {
      setGameState(createInitialGameState(state.mode));
    }
  }, [state.mode]);

  // 获取可吃子位置
  const capturablePositions = gameState.awaitingCapture && gameState.currentPlayer === playerColor
    ? getCapturablePositions(gameState)
    : [];

  const lastMove = gameState.moves.length > 0
    ? gameState.moves[gameState.moves.length - 1].position
    : null;

  const getResultText = () => {
    if (gameState.winner === playerColor) return '恭喜你获胜！';
    if (gameState.winner === aiColor) return 'AI 获胜，再接再厉！';
    return '平局！';
  };

  return (
    <div className={styles.game}>
      <div className={styles.gameArea}>
        <div className={styles.infoPanel}>
          <GameInfo
            gameState={gameState}
            playerName="你"
            opponentName={`AI (${state.difficulty === AIDifficulty.EASY ? '简单' : state.difficulty === AIDifficulty.MEDIUM ? '中等' : '困难'})`}
          />

          {gameState.awaitingCapture && gameState.currentPlayer === playerColor && (
            <div className={styles.captureHint}>
              <p>点击对方棋子吃掉它，或跳过</p>
              <Button variant="ghost" size="small" onClick={handleSkipCapture}>
                跳过吃子
              </Button>
            </div>
          )}

          {aiThinking && (
            <div className={styles.thinking}>
              <div className={styles.thinkingDot} />
              <span>AI 思考中...</span>
            </div>
          )}

          <div className={styles.actions}>
            <Button variant="secondary" size="small" onClick={handleRestart}>
              重新开始
            </Button>
            <Button variant="ghost" size="small" onClick={() => navigate('/')}>
              返回首页
            </Button>
          </div>
        </div>

        <div className={styles.boardWrapper}>
          <Board
            board={gameState.board}
            onCellClick={handleCellClick}
            lastMove={lastMove}
            highlightedPositions={gameState.linePositions}
            capturablePositions={capturablePositions}
            disabled={aiThinking || gameState.status === GameStatus.FINISHED}
          />
        </div>
      </div>

      <Modal isOpen={showResult} title="游戏结束">
        <div className={styles.result}>
          <div className={styles.resultEmoji}>
            {gameState.winner === playerColor ? '🎉' : gameState.winner === aiColor ? '😔' : '🤝'}
          </div>
          <p className={styles.resultText}>{getResultText()}</p>
          <p className={styles.resultDetail}>
            共 {gameState.moves.length} 手
            {state.mode === GameMode.ENDLESS && (
              <> | 黑方剩余: {gameState.blackPiecesRemaining ?? 0} | 白方剩余: {gameState.whitePiecesRemaining ?? 0}</>
            )}
          </p>
          <div className={styles.resultActions}>
            <Button variant="primary" onClick={handleRestart}>再来一局</Button>
            <Button variant="secondary" onClick={() => navigate('/single/setup')}>更换设置</Button>
            <Button variant="ghost" onClick={() => navigate('/')}>返回首页</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SingleGame;
