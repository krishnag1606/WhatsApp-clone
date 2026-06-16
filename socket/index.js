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
import {
  computePermissions,
  sendPermissionFor,
} from "../server/util/permissions.js";
import { hasPermission } from "../server/constants/permissions.js";
import { sendCooldownError } from "../server/util/sendGuards.js";
import { deleteMessageAs, togglePinAs } from "../server/util/messageMod.js";
import { toPollView } from "../server/util/pollView.js";
import { applyVoteAs } from "../server/util/pollVote.js";
import { Permissions } from "../server/constants/permissions.js";
import Message from "../server/model/Message.js";
import Channel from "../server/model/Channel.js";
import Membership from "../server/model/Membership.js";
import Community from "../server/model/Community.js";
import Poll from "../server/model/Poll.js";

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
// (non-banned) membership. Returns `{ channel, membership }`, or null if not
// allowed. Permission gating is applied by callers; mute enforcement lands in
// Phase 5.
const resolveMembership = async (userId, channelId) => {
  const channel = await Channel.findById(channelId);
  if (!channel) return null;
  const membership = await Membership.findOne({
    communityId: channel.communityId,
    userId,
  });
  if (!membership || membership.banned) return null;
  return { channel, membership };
};

io.on("connection", (socket) => {
  const { userId } = socket.data;
  console.log("🔌 connected:", socket.id, "user:", userId);

  // Join a channel room (membership-checked). Leaves the previous channel so a
  // socket is only ever in the room it's currently viewing.
  socket.on("joinChannel", async (channelId, ack) => {
    try {
      if (!channelId) throw new Error("channelId required");
      const resolved = await resolveMembership(userId, channelId);
      if (!resolved) throw new Error("Not a member of this channel's community");

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

      const resolved = await resolveMembership(userId, channelId);
      if (!resolved) throw new Error("Not a member of this channel's community");
      const { channel, membership } = resolved;

      // Authoritative permission gate, channel-type aware (mirrors the REST
      // controller): announcement channels need POST_ANNOUNCEMENTS, text
      // channels SEND_MESSAGES.
      const community = await Community.findById(channel.communityId);
      const permissions = await computePermissions(membership, community);
      if (!hasPermission(permissions, sendPermissionFor(channel))) {
        throw new Error("You don't have permission to post in this channel");
      }

      // Time-based gates: mute + slowmode (mods bypass slowmode).
      const cooldown = await sendCooldownError({ membership, channel, permissions });
      if (cooldown) throw new Error(cooldown);

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

  // Delete a message (author or MANAGE_MESSAGES) and broadcast the removal to
  // the room so every viewer drops it live. Soft-delete + audit live in the
  // shared helper so REST and socket behave identically.
  socket.on("deleteMessage", async (data, ack) => {
    try {
      const channelId = data?.channelId;
      const messageId = data?.messageId;
      if (!channelId || !messageId) throw new Error("channelId and messageId required");

      const resolved = await resolveMembership(userId, channelId);
      if (!resolved) throw new Error("Not a member of this channel's community");
      const { channel, membership } = resolved;

      const community = await Community.findById(channel.communityId);
      const permissions = await computePermissions(membership, community);
      const result = await deleteMessageAs({
        messageId,
        channelId,
        userId,
        permissions,
        communityId: channel.communityId,
      });
      if (result.error) throw new Error(result.error);

      io.to(roomFor(channelId)).emit("messageDeleted", { channelId, messageId });
      if (typeof ack === "function") ack({ ok: true });
    } catch (error) {
      if (typeof ack === "function") ack({ ok: false, error: error.message });
      socket.emit("errorMessage", { error: error.message });
    }
  });

  // Pin/unpin a message (MANAGE_MESSAGES) and broadcast the updated message.
  socket.on("pinMessage", async (data, ack) => {
    try {
      const channelId = data?.channelId;
      const messageId = data?.messageId;
      if (!channelId || !messageId) throw new Error("channelId and messageId required");

      const resolved = await resolveMembership(userId, channelId);
      if (!resolved) throw new Error("Not a member of this channel's community");
      const { channel, membership } = resolved;

      const community = await Community.findById(channel.communityId);
      const permissions = await computePermissions(membership, community);
      const result = await togglePinAs({
        messageId,
        channelId,
        userId,
        permissions,
        communityId: channel.communityId,
      });
      if (result.error) throw new Error(result.error);

      const view = toMessageView(result.message);
      io.to(roomFor(channelId)).emit("messagePinned", view);
      if (typeof ack === "function") ack({ ok: true, message: view });
    } catch (error) {
      if (typeof ack === "function") ack({ ok: false, error: error.message });
      socket.emit("errorMessage", { error: error.message });
    }
  });

  // Create a poll in the channel (gated by CREATE_POLLS) and broadcast `newPoll`
  // to the room so everyone sees it live, mirroring the sendMessage flow.
  socket.on("createPoll", async (data, ack) => {
    try {
      const channelId = data?.channelId;
      const question = typeof data?.question === "string" ? data.question.trim() : "";
      const rawOptions = Array.isArray(data?.options) ? data.options : [];
      const options = rawOptions
        .map((o) => (typeof o === "string" ? o.trim() : ""))
        .filter(Boolean);
      if (!channelId) throw new Error("channelId required");
      if (!question) throw new Error("Poll question required");
      if (options.length < 2) throw new Error("At least two options required");
      if (options.length > 10) throw new Error("Too many options");

      const resolved = await resolveMembership(userId, channelId);
      if (!resolved) throw new Error("Not a member of this channel's community");
      const { channel, membership } = resolved;

      const community = await Community.findById(channel.communityId);
      const permissions = await computePermissions(membership, community);
      if (!hasPermission(permissions, Permissions.CREATE_POLLS)) {
        throw new Error("You don't have permission to create polls here");
      }

      const poll = await Poll.create({
        channelId,
        authorId: userId,
        question,
        options: options.map((text) => ({ text, voters: [] })),
        allowMultiple: Boolean(data?.allowMultiple),
        expiresAt: data?.expiresAt ? new Date(data.expiresAt) : undefined,
      });

      const view = toPollView(poll);
      io.to(roomFor(channelId)).emit("newPoll", view);
      if (typeof ack === "function") ack({ ok: true, poll: view });
    } catch (error) {
      if (typeof ack === "function") ack({ ok: false, error: error.message });
      socket.emit("errorMessage", { error: error.message });
    }
  });

  // Toggle the caller's vote on a poll option and broadcast the updated poll
  // (with fresh vote counts) to the room. Membership is re-checked; toggling +
  // allowMultiple are enforced authoritatively in the shared helper.
  socket.on("votePoll", async (data, ack) => {
    try {
      const channelId = data?.channelId;
      const pollId = data?.pollId;
      const optionId = data?.optionId;
      if (!channelId || !pollId || !optionId)
        throw new Error("channelId, pollId and optionId required");

      const resolved = await resolveMembership(userId, channelId);
      if (!resolved) throw new Error("Not a member of this channel's community");

      const result = await applyVoteAs({ pollId, optionId, userId });
      if (result.error) throw new Error(result.error);

      const view = toPollView(result.poll);
      io.to(roomFor(channelId)).emit("pollUpdated", view);
      if (typeof ack === "function") ack({ ok: true, poll: view });
    } catch (error) {
      if (typeof ack === "function") ack({ ok: false, error: error.message });
      socket.emit("errorMessage", { error: error.message });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("disconnected:", socket.id, "-", reason);
  });
});

console.log("⚡ Flux socket server running on port 9000");
