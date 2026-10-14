import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GameMode } from '@gomoku/shared';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { connectSocket, getSocket, disconnectSocket } from '../../services/socket';
import styles from './OnlineLobby.module.css';

const OnlineLobby: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteRoomCode = searchParams.get('room');

  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.STANDARD);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{ roomId: string; roomCode: string; inviteUrl: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // 如果有邀请链接中的房间号，自动填入
    if (inviteRoomCode) {
      setRoomCode(inviteRoomCode);
    }
  }, [inviteRoomCode]);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('room:created', (data) => {
      setCreatedRoom(data);
      setWaiting(true);
    });

    socket.on('room:joined', (data) => {
      navigate('/online/game', {
        state: {
          room: data.room,
          yourColor: data.yourColor,
          playerName,
        },
      });
    });

    socket.on('room:error', (data) => {
      setError(data.message);
      setWaiting(false);
    });

    socket.on('game:start', (data) => {
      navigate('/online/game', {
        state: {
          gameState: data.gameState,
          yourColor: data.yourColor,
          playerName,
        },
      });
    });

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:error');
      socket.off('game:start');
    };
  }, [navigate, playerName]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('请输入你的名字');
      return;
    }
    setError('');
    const socket = getSocket();
    socket.emit('room:create', { playerName: playerName.trim(), mode: selectedMode });
    setShowCreateModal(false);
    setWaiting(true);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('请输入你的名字');
      return;
    }
    if (!roomCode.trim()) {
      setError('请输入房间号');
      return;
    }
    setError('');
    const socket = getSocket();
    socket.emit('room:join', { roomCode: roomCode.trim(), playerName: playerName.trim() });
    setWaiting(true);
  };

  const handleLeave = () => {
    disconnectSocket();
    setWaiting(false);
    setCreatedRoom(null);
  };

  const copyInviteLink = () => {
    if (createdRoom) {
      navigator.clipboard.writeText(createdRoom.inviteUrl).catch(() => {
        // fallback
        const input = document.createElement('input');
        input.value = createdRoom.inviteUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      });
    }
  };

  return (
    <div className={styles.lobby}>
      <Header title="双人在线对战" showBack />

      <div className={styles.content}>
        {!waiting ? (
          <>
            <div className={styles.nameSection}>
              <label className={styles.label}>你的昵称</label>
              <input
                className={styles.input}
                type="text"
                placeholder="输入昵称..."
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                maxLength={12}
              />
            </div>

            <div className={styles.actions}>
              <Button
                variant="primary"
                size="large"
                fullWidth
                onClick={() => setShowCreateModal(true)}
              >
                创建房间
              </Button>

              <div className={styles.divider}>
                <span>或者</span>
              </div>

              <div className={styles.joinSection}>
                <label className={styles.label}>输入房间号</label>
                <div className={styles.joinRow}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="6位房间号"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value)}
                    maxLength={6}
                  />
                  <Button variant="secondary" onClick={handleJoinRoom}>
                    加入
                  </Button>
                </div>
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}
          </>
        ) : (
          <div className={styles.waiting}>
            {createdRoom ? (
              <>
                <div className={styles.waitingIcon}>&#9819;</div>
                <h3 className={styles.waitingTitle}>房间已创建</h3>
                <p className={styles.roomCode}>房间号: <strong>{createdRoom.roomCode}</strong></p>
                <p className={styles.waitingText}>等待对手加入...</p>
                <div className={styles.inviteSection}>
                  <p className={styles.label}>邀请链接</p>
                  <div className={styles.inviteRow}>
                    <input
                      className={styles.inviteInput}
                      type="text"
                      value={createdRoom.inviteUrl}
                      readOnly
                    />
                    <Button variant="secondary" size="small" onClick={copyInviteLink}>
                      复制
                    </Button>
                  </div>
                </div>
                <Button variant="ghost" onClick={handleLeave}>取消</Button>
              </>
            ) : (
              <>
                <div className={styles.waitingIcon}>&#9819;</div>
                <h3 className={styles.waitingTitle}>正在加入房间...</h3>
                <p className={styles.waitingText}>正在连接到房间 {roomCode}</p>
                <Button variant="ghost" onClick={handleLeave}>取消</Button>
              </>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="创建房间">
        <div className={styles.createForm}>
          <div className={styles.formGroup}>
            <label className={styles.label}>游戏模式</label>
            <div className={styles.modeOptions}>
              <button
                className={`${styles.modeBtn} ${selectedMode === GameMode.STANDARD ? styles.modeSelected : ''}`}
                onClick={() => setSelectedMode(GameMode.STANDARD)}
              >
                标准模式
              </button>
              <button
                className={`${styles.modeBtn} ${selectedMode === GameMode.ENDLESS ? styles.modeSelected : ''}`}
                onClick={() => setSelectedMode(GameMode.ENDLESS)}
              >
                无尽模式
              </button>
            </div>
          </div>
          <Button variant="primary" fullWidth onClick={handleCreateRoom}>
            确认创建
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default OnlineLobby;
