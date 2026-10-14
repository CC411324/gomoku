import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameMode, AIDifficulty } from '@gomoku/shared';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import styles from './SingleSetup.module.css';

const SingleSetup: React.FC = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<AIDifficulty>(AIDifficulty.MEDIUM);
  const [mode, setMode] = useState<GameMode>(GameMode.STANDARD);

  const handleStart = () => {
    navigate('/single/game', { state: { difficulty, mode } });
  };

  return (
    <div className={styles.setup}>
      <Header title="单机模式" showBack />

      <div className={styles.content}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>游戏模式</h3>
          <div className={styles.options}>
            <div
              className={`${styles.option} ${mode === GameMode.STANDARD ? styles.selected : ''}`}
              onClick={() => setMode(GameMode.STANDARD)}
            >
              <div className={styles.optionIcon}>&#9823;</div>
              <div className={styles.optionText}>
                <h4>标准模式</h4>
                <p>任意一方先连成5子获胜</p>
              </div>
            </div>

            <div
              className={`${styles.option} ${mode === GameMode.ENDLESS ? styles.selected : ''}`}
              onClick={() => setMode(GameMode.ENDLESS)}
            >
              <div className={styles.optionIcon}>&#9818;</div>
              <div className={styles.optionText}>
                <h4>无尽模式</h4>
                <p>成5连可提子并吃对方1子，棋子多者胜</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>AI 难度</h3>
          <div className={styles.difficultyOptions}>
            {[
              { value: AIDifficulty.EASY, label: '简单', desc: '适合新手' },
              { value: AIDifficulty.MEDIUM, label: '中等', desc: '有一定挑战' },
              { value: AIDifficulty.HARD, label: '困难', desc: '强力 AI' },
            ].map(d => (
              <button
                key={d.value}
                className={`${styles.diffBtn} ${difficulty === d.value ? styles.diffSelected : ''}`}
                onClick={() => setDifficulty(d.value)}
              >
                <span className={styles.diffLabel}>{d.label}</span>
                <span className={styles.diffDesc}>{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Button variant="primary" size="large" fullWidth onClick={handleStart}>
          开始游戏
        </Button>
      </div>
    </div>
  );
};

export default SingleSetup;
