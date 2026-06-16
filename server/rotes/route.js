import express from "express";

// Legacy 1:1 controllers (pre-pivot). Kept wired until Phase 2 swaps the UI
// over to the community model; the legacy message routes are gone (Message is
// now channel-scoped + encrypted).
import { addUser, getUsers } from "../controller/user-controller.js";
import {
  createConversation,
  getConversation,
  getConversations,
} from "../controller/conversation-controller.js";

// Phase 1 community-model controllers + middleware.
import { requireAuth } from "../middleware/auth.js";
import { requireMembership } from "../middleware/membership.js";
import { googleAuth, getMe } from "../controller/auth-controller.js";
import {
  createCommunity,
  getMyCommunities,
  getCommunity,
  joinCommunity,
} from "../controller/community-controller.js";
import {
  createChannel,
  getChannels,
} from "../controller/channel-controller.js";
import {
  addMessage,
  getMessages,
} from "../controller/message-controller.js";

const route = express.Router();

/* ---------------- Legacy 1:1 routes (removed in Phase 2) ---------------- */
route.post("/add", addUser);
route.get("/users", getUsers);
route.post("/conversation/add", createConversation);
route.post("/conversation/get", getConversation);
route.post("/conversation/all", getConversations);

/* -------------------------------- Auth --------------------------------- */
route.post("/api/auth/google", googleAuth);
route.get("/api/auth/me", requireAuth, getMe);

/* ----------------------------- Communities ----------------------------- */
route.post("/api/communities", requireAuth, createCommunity);
route.get("/api/communities", requireAuth, getMyCommunities);
route.post("/api/communities/join", requireAuth, joinCommunity);
route.get("/api/communities/:communityId", requireAuth, requireMembership, getCommunity);

/* ------------------------------- Channels ------------------------------ */
route.post(
  "/api/communities/:communityId/channels",
  requireAuth,
  requireMembership,
  createChannel
);
route.get(
  "/api/communities/:communityId/channels",
  requireAuth,
  requireMembership,
  getChannels
);

/* ------------------------------- Messages ------------------------------ */
route.post(
  "/api/channels/:channelId/messages",
  requireAuth,
  requireMembership,
  addMessage
);
route.get(
  "/api/channels/:channelId/messages",
  requireAuth,
  requireMembership,
  getMessages
);

export default route;
