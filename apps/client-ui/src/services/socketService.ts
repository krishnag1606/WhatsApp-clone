import { io, Socket } from "socket.io-client";
import { getToken } from "./apiClient";
import { IMessage } from "../store/IStore";

// Real-time channel transport (Phase 3). One shared connection per session,
// authenticated with the Flux JWT. The socket server uses rooms keyed by
// channel; we join/leave as the active channel changes.

// socket.io-client wants an http(s) origin and upgrades to ws itself, so
// normalize a ws:// URL from the env to http://.
const SOCKET_URL = (
  process.env.REACT_APP_SOCKET_URL || "http://localhost:9000"
).replace(/^ws/, "http");

let socket: Socket | null = null;

export const connectSocket = (): Socket | null => {
  if (socket?.connected || socket?.active) return socket;
  try {
    socket = io(SOCKET_URL, {
      auth: { token: getToken() },
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
    // A failed/refused connection must never crash the UI — just log it.
    socket.on("connect_error", (err) =>
      console.warn("Socket connect_error:", err.message)
    );
    return socket;
  } catch (error) {
    console.warn("Failed to open socket connection", error);
    socket = null;
    return null;
  }
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};

export const joinChannel = (channelId: string): void => {
  socket?.emit("joinChannel", channelId);
};

export const leaveChannel = (channelId: string): void => {
  socket?.emit("leaveChannel", channelId);
};

// Emits over the socket; the server persists + broadcasts back as "newMessage"
// (to the sender too), so callers rely on the broadcast rather than the ack.
export const sendMessage = (channelId: string, text: string): boolean => {
  if (!socket?.connected) return false;
  socket.emit("sendMessage", { channelId, text });
  return true;
};

export const onNewMessage = (handler: (msg: IMessage) => void): (() => void) => {
  socket?.on("newMessage", handler);
  return () => socket?.off("newMessage", handler);
};
