/** 棋盘尺寸（15x15） */
export const BOARD_SIZE = 15;

/** 获胜所需连线数 */
export const WIN_COUNT = 5;

/** 无尽模式默认初始棋子数 */
export const ENDLESS_INITIAL_PIECES = 40;

/** 房间密码长度 */
export const ROOM_CODE_LENGTH = 6;

/** 断线重连超时（毫秒） */
export const DISCONNECT_TIMEOUT = 5 * 60 * 1000;

/** 棋盘方向向量：横、竖、左斜、右斜 */
export const DIRECTIONS = [
  [0, 1],   // 横向 →
  [1, 0],   // 纵向 ↓
  [1, 1],   // 左斜 ↘
  [1, -1],  // 右斜 ↙
] as const;

/** 棋型评分表 */
export const PATTERN_SCORES = {
  FIVE: 100000,       // 连五
  LIVE_FOUR: 10000,   // 活四
  RUSH_FOUR: 1000,    // 冲四
  LIVE_THREE: 1000,   // 活三
  SLEEP_THREE: 100,   // 眠三
  LIVE_TWO: 100,      // 活二
  SLEEP_TWO: 10,      // 眠二
} as const;
