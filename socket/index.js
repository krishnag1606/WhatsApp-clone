// Flux real-time server (Phase 3). Authenticates the Flux session JWT on the
// handshake, then uses Socket.IO ROOMS keyed by channel (`channel:<id>`): a
// client joins a room when it opens a channel and leaves on switch. Messages
// are persisted encrypted-at-rest and broadcast to the room.
//
// We reuse the REST server's models + crypto/jwt helpers via relative import;
// their deps (mongoose, jsonwebtoken, dotenv) resolve from server/node_modules,
// so this package only needs socket.io. ./loadEnv.js MUST be first so the
// shared helpers see the secrets at import time.
import "./loadEnv.js";

import { Server } from "socket.io";
import Connection from "../server/database/db.js";
import { verifySession } from "../server/util/jwt.js";
import { encrypt } from "../server/util/crypto.js";
import { toMessageView } from "../server/util/messageView.js";
import Message from "../server/model/Message.js";
import Channel from "../server/model/Channel.js";
import Membership from "../server/model/Membership.js";

const MAX_MESSAGE_LENGTH = 4000;
const roomFor = (channelId) => `channel:${channelId}`;

await Connection();

const io = new Server(9000, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  },
});

// --- Auth: every connection must present a valid Flux session JWT. ----------
// Identity is derived from the verified token (never a client-supplied field),
// matching the REST server's requireAuth.
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return next(new Error("Missing session token"));
    const payload = verifySession(token);
    socket.data.userId = payload.sub;
    next();
  } catch (error) {
    next(new Error("Invalid or expired session token"));
  }
});

// Resolves the channel's community and confirms the socket's user has an active
// (non-banned) membership. Returns the channel doc, or null if not allowed.
// Per-permission/mute enforcement is layered on in Phase 4/5.
const resolveMembership = async (userId, channelId) => {
  const channel = await Channel.findById(channelId);
  if (!channel) return null;
  const membership = await Membership.findOne({
    communityId: channel.communityId,
    userId,
  });
  if (!membership || membership.banned) return null;
  return channel;
};

io.on("connection", (socket) => {
  const { userId } = socket.data;
  console.log("🔌 connected:", socket.id, "user:", userId);

  // Join a channel room (membership-checked). Leaves the previous channel so a
  // socket is only ever in the room it's currently viewing.
  socket.on("joinChannel", async (channelId, ack) => {
    try {
      if (!channelId) throw new Error("channelId required");
      const channel = await resolveMembership(userId, channelId);
      if (!channel) throw new Error("Not a member of this channel's community");

      // Leave any other channel rooms before joining the new one.
      for (const room of socket.rooms) {
        if (room.startsWith("channel:") && room !== roomFor(channelId)) {
          socket.leave(room);
        }
      }
      socket.join(roomFor(channelId));
      if (typeof ack === "function") ack({ ok: true });
    } catch (error) {
      if (typeof ack === "function") ack({ ok: false, error: error.message });
      socket.emit("errorMessage", { error: error.message });
    }
  });

  socket.on("leaveChannel", (channelId) => {
    if (channelId) socket.leave(roomFor(channelId));
  });

  // Persist (encrypt-at-rest) then broadcast to the channel room — including
  // the sender, so the client doesn't need an optimistic insert. The server is
  // authoritative: membership is re-checked here, not trusted from the client.
  socket.on("sendMessage", async (data, ack) => {
    try {
      const channelId = data?.channelId;
      const text = typeof data?.text === "string" ? data.text.trim() : "";
      if (!channelId) throw new Error("channelId required");
      if (!text) throw new Error("Message text required");
      if (text.length > MAX_MESSAGE_LENGTH)
        throw new Error("Message too long");

      const channel = await resolveMembership(userId, channelId);
      if (!channel) throw new Error("Not a member of this channel's community");

      const message = await Message.create({
        channelId,
        authorId: userId,
        content: encrypt(text),
        type: data?.type || "text",
      });

      const view = toMessageView(message);
      io.to(roomFor(channelId)).emit("newMessage", view);
      if (typeof ack === "function") ack({ ok: true, message: view });
    } catch (error) {
      console.error("sendMessage failed:", error.message);
      if (typeof ack === "function") ack({ ok: false, error: error.message });
      socket.emit("errorMessage", { error: error.message });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("disconnected:", socket.id, "-", reason);
  });
});

console.log("⚡ Flux socket server running on port 9000");
