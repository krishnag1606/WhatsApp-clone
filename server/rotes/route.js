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
import { requirePermission, requireAnyPermission } from "../middleware/permission.js";
import { Permissions } from "../constants/permissions.js";
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
  updateChannel,
} from "../controller/channel-controller.js";
import {
  addMessage,
  getMessages,
  deleteMessage,
  pinMessage,
} from "../controller/message-controller.js";
// Phase 4 — roles & permissions.
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../controller/role-controller.js";
import {
  getMembers,
  getMyMembership,
  setMemberRoles,
} from "../controller/member-controller.js";
// Phase 5 — moderation.
import {
  kickMember,
  banMember,
  unbanMember,
  muteMember,
  unmuteMember,
  getAuditLog,
} from "../controller/moderation-controller.js";

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

/* ----------------------- Roles & members (Phase 4) --------------------- */
route.get(
  "/api/communities/:communityId/me",
  requireAuth,
  requireMembership,
  getMyMembership
);
route.get(
  "/api/communities/:communityId/members",
  requireAuth,
  requireMembership,
  getMembers
);
route.put(
  "/api/communities/:communityId/members/:userId/roles",
  requireAuth,
  requireMembership,
  requirePermission(Permissions.MANAGE_ROLES),
  setMemberRoles
);

/* --------------------------- Moderation (Phase 5) ---------------------- */
route.post(
  "/api/communities/:communityId/members/:userId/kick",
  requireAuth,
  requireMembership,
  requirePermission(Permissions.KICK),
  kickMember
);
route.post(
  "/api/communities/:communityId/members/:userId/ban",
  requireAuth,
  requireMembership,
  requirePermission(Permissions.BAN),
  banMember
);
route.post(
  "/api/communities/:communityId/members/:userId/unban",
  requireAuth,
  requireMembership,
  requirePermission(Permissions.BAN),
  unbanMember
);
route.post(
  "/api/communities/:communityId/members/:userId/mute",
  requireAuth,
  requireMembership,
  requirePermission(Permissions.MUTE),
  muteMember
);
route.post(
  "/api/communities/:communityId/members/:userId/unmute",
  requireAuth,
  requireMembership,
  requirePermission(Permissions.MUTE),
  unmuteMember
);
route.get(
  "/api/communities/:communityId/audit",
  requireAuth,
  requireMembership,
  requireAnyPermission(
    Permissions.KICK,
    Permissions.BAN,
    Permissions.MUTE,
    Permissions.MANAGE_MESSAGES,
    Permissions.MANAGE_CHANNELS,
    Permissions.MANAGE_COMMUNITY
  ),
  getAuditLog
);

route.get(
  "/api/communities/:communityId/roles",
  requireAuth,
  requireMembership,
  getRoles
);
route.post(
  "/api/communities/:communityId/roles",
  requireAuth,
  requireMembership,
  requirePermission(Permissions.MANAGE_ROLES),
  createRole
);
route.put(
  "/api/communities/:communityId/roles/:roleId",
  requireAuth,
  requireMembership,
  requirePermission(Permissions.MANAGE_ROLES),
  updateRole
);
route.delete(
  "/api/communities/:communityId/roles/:roleId",
  requireAuth,
  requireMembership,
  requirePermission(Permissions.MANAGE_ROLES),
  deleteRole
);

/* ------------------------------- Channels ------------------------------ */
route.post(
  "/api/communities/:communityId/channels",
  requireAuth,
  requireMembership,
  requirePermission(Permissions.MANAGE_CHANNELS),
  createChannel
);
route.get(
  "/api/communities/:communityId/channels",
  requireAuth,
  requireMembership,
  getChannels
);
route.put(
  "/api/channels/:channelId",
  requireAuth,
  requireMembership,
  requirePermission(Permissions.MANAGE_CHANNELS),
  updateChannel
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
route.delete(
  "/api/channels/:channelId/messages/:messageId",
  requireAuth,
  requireMembership,
  deleteMessage
);
route.post(
  "/api/channels/:channelId/messages/:messageId/pin",
  requireAuth,
  requireMembership,
  pinMessage
);

export default route;
