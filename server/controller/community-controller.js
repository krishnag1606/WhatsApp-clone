import crypto from "crypto";
import { z } from "zod";
import Community from "../model/Community.js";
import Channel from "../model/Channel.js";
import Role from "../model/Role.js";
import Membership from "../model/Membership.js";
import { DEFAULT_ROLES } from "../constants/permissions.js";

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  icon: z.string().optional(),
});

const joinSchema = z.object({
  inviteCode: z.string().trim().min(1),
});

// Unambiguous alphabet (no 0/O/1/I) for human-shareable codes.
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateInviteCode = (length = 8) => {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
  }
  return code;
};

// Generates an invite code that isn't already taken (retries on collision).
const generateUniqueInviteCode = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    const exists = await Community.exists({ inviteCode: code });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique invite code");
};

// POST /api/communities  (requireAuth)
// Creates a community, seeds Owner/Moderator/Member roles, makes the creator
// an Owner member, and creates a default #general text channel.
export const createCommunity = async (request, response) => {
  try {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: "A community `name` is required" });
    }

    const inviteCode = await generateUniqueInviteCode();
    const community = await Community.create({
      name: parsed.data.name,
      icon: parsed.data.icon,
      ownerId: request.userId,
      inviteCode,
    });

    const roles = await Role.insertMany(
      DEFAULT_ROLES.map((role) => ({ ...role, communityId: community._id }))
    );
    const ownerRole = roles.find((r) => r.name === "Owner");

    await Membership.create({
      communityId: community._id,
      userId: request.userId,
      roleIds: [ownerRole._id],
    });

    const channel = await Channel.create({
      communityId: community._id,
      name: "general",
      type: "text",
      position: 0,
    });

    return response.status(201).json({ community, roles, defaultChannel: channel });
  } catch (error) {
    return response.status(500).json({ error: "Failed to create community" });
  }
};

// GET /api/communities  (requireAuth)
// Lists communities the current user is a member of.
export const getMyCommunities = async (request, response) => {
  try {
    const memberships = await Membership.find({
      userId: request.userId,
      banned: false,
    }).select("communityId");
    const ids = memberships.map((m) => m.communityId);
    const communities = await Community.find({ _id: { $in: ids } });
    return response.status(200).json(communities);
  } catch (error) {
    return response.status(500).json({ error: "Failed to load communities" });
  }
};

// GET /api/communities/:communityId  (requireAuth + requireMembership)
export const getCommunity = async (request, response) => {
  try {
    const community = await Community.findById(request.communityId);
    if (!community) return response.status(404).json({ error: "Community not found" });
    return response.status(200).json(community);
  } catch (error) {
    return response.status(500).json({ error: "Failed to load community" });
  }
};

// POST /api/communities/join  (requireAuth)
// Joins by invite code. Idempotent if already a member; rejects banned users.
export const joinCommunity = async (request, response) => {
  try {
    const parsed = joinSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: "An `inviteCode` is required" });
    }

    const community = await Community.findOne({ inviteCode: parsed.data.inviteCode });
    if (!community) return response.status(404).json({ error: "Invalid invite code" });

    const existing = await Membership.findOne({
      communityId: community._id,
      userId: request.userId,
    });
    if (existing) {
      if (existing.banned) {
        return response.status(403).json({ error: "You are banned from this community" });
      }
      return response.status(200).json({ community, membership: existing });
    }

    const memberRole = await Role.findOne({
      communityId: community._id,
      name: "Member",
    });

    const membership = await Membership.create({
      communityId: community._id,
      userId: request.userId,
      roleIds: memberRole ? [memberRole._id] : [],
    });

    return response.status(201).json({ community, membership });
  } catch (error) {
    return response.status(500).json({ error: "Failed to join community" });
  }
};
