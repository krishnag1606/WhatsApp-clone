export const RATE_LIMITS = {
  sendMessage: { max: 10, windowMs: 10_000 }, // 10 messages / 10s
  createPoll: { max: 5, windowMs: 60_000 }, // 5 polls / min
  votePoll: { max: 30, windowMs: 60_000 }, // 30 votes / min
};

// Returns true if the event is within budget for this connection, false if the
// socket has exceeded its limit for that event in the current window.
export const allowEvent = (socket, event) => {
  const cfg = RATE_LIMITS[event];
  if (!cfg) return true;

  const now = Date.now();
  if (!socket.data.rate) socket.data.rate = {};
  const state = socket.data.rate[event];

  if (!state || now >= state.resetAt) {
    socket.data.rate[event] = { count: 1, resetAt: now + cfg.windowMs };
    return true;
  }
  if (state.count >= cfg.max) return false;
  state.count += 1;
  return true;
};
