import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import styles from './Home.module.css';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.home}>
      <div className={styles.logo}>
        <div className={styles.boardIcon}>
          <div className={styles.miniBoard}>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className={styles.miniCell} />
            ))}
          </div>
          <div className={`${styles.miniStone} ${styles.blackMini}`} style={{ top: '20%', left: '20%' }} />
          <div className={`${styles.miniStone} ${styles.whiteMini}`} style={{ top: '35%', left: '35%' }} />
          <div className={`${styles.miniStone} ${styles.blackMini}`} style={{ top: '50%', left: '50%' }} />
          <div className={`${styles.miniStone} ${styles.whiteMini}`} style={{ top: '35%', left: '65%' }} />
          <div className={`${styles.miniStone} ${styles.blackMini}`} style={{ top: '20%', left: '80%' }} />
        </div>
        <h1 className={styles.title}>五子棋</h1>
        <p className={styles.subtitle}>Gomoku</p>
      </div>

      <div className={styles.menu}>
        <Button
          variant="primary"
          size="large"
          fullWidth
          onClick={() => navigate('/online')}
        >
          双人在线对战
        </Button>

        <Button
          variant="secondary"
          size="large"
          fullWidth
          onClick={() => navigate('/single/setup')}
        >
          单机模式
        </Button>
      </div>

      <div className={styles.footer}>
        <p>无禁手规则 | 标准模式 &amp; 无尽模式</p>
      </div>
    </div>
  );
};

export default Home;
