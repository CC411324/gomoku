import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title = '五子棋', showBack = false }) => {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      {showBack && (
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          &larr;
        </button>
      )}
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
};

export default Header;
