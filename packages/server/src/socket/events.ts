/** Socket 事件名称定义 */
export const SocketEvents = {
  // 客户端 -> 服务端
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  GAME_MOVE: 'game:move',
  GAME_CAPTURE: 'game:capture',
  GAME_RESTART: 'game:restart',
  GAME_SURRENDER: 'game:surrender',

  // 服务端 -> 客户端
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_UPDATED: 'room:updated',
  ROOM_ERROR: 'room:error',
  GAME_START: 'game:start',
  GAME_MOVE_RESULT: 'game:move',
  GAME_CAPTURE_RESULT: 'game:capture',
  GAME_END: 'game:end',
  GAME_RESTART_RESULT: 'game:restart',
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
} as const;
