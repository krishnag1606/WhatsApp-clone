import { z } from "zod";
import Membership from "../model/Membership.js";
import Role from "../model/Role.js";
import User from "../model/User.js";
import Community from "../model/Community.js";
import { computePermissions } from "../util/permissions.js";

const rolesSchema = z.object({
  roleIds: z.array(z.string()).max(50),
});

// Serializes a membership joined with its user profile for the members UI.
const toMemberView = (membership, user) => ({
  userId: membership.userId,
  name: user?.name ?? membership.userId,
  picture: user?.picture ?? null,
  nickname: membership.nickname ?? null,
  roleIds: membership.roleIds.map((id) => id.toString()),
  banned: membership.banned,
  mutedUntil: membership.mutedUntil ?? null,
  joinedAt: membership.joinedAt,
});

// GET /api/communities/:communityId/members  (member)
// Lists members joined with their user profile (name/picture) + role ids.
export const getMembers = async (request, response) => {
  try {
    const memberships = await Membership.find({
      communityId: request.communityId,
    });
    const users = await User.find({
      _id: { $in: memberships.map((m) => m.userId) },
    });
    const usersById = new Map(users.map((u) => [u._id, u]));

    const members = memberships.map((m) =>
      toMemberView(m, usersById.get(m.userId))
    );
    return response.status(200).json(members);
  } catch (error) {
    return response.status(500).json({ error: "Failed to load members" });
  }
};

// GET /api/communities/:communityId/me  (member)
// Returns the caller's membership, their roles, and their effective permission
// bitfield — the source of truth the UI uses to gate controls.
export const getMyMembership = async (request, response) => {
  try {
    const community =
      request.community || (await Community.findById(request.communityId));
    const permissions = await computePermissions(
      request.membership,
      community
    );
    const roles = await Role.find({
      _id: { $in: request.membership.roleIds },
    });
    return response.status(200).json({
      membership: request.membership,
      roles,
      permissions,
    });
  } catch (error) {
    return response.status(500).json({ error: "Failed to load membership" });
  }
};

// PUT /api/communities/:communityId/members/:userId/roles  (MANAGE_ROLES)
// Replaces a member's role set. Guards:
//   - roles must belong to this community
//   - you can't assign a role carrying permissions you don't have
//   - only the owner may change the owner's roles
export const setMemberRoles = async (request, response) => {
  try {
    const parsed = rolesSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: "`roleIds` array is required" });
    }

    const targetUserId = request.params.userId;
    const isOwnerTarget = request.community.ownerId === targetUserId;
    const callerIsOwner = request.community.ownerId === request.userId;
    if (isOwnerTarget && !callerIsOwner) {
      return response
        .status(403)
        .json({ error: "Only the owner can change the owner's roles" });
    }

    const membership = await Membership.findOne({
      communityId: request.communityId,
      userId: targetUserId,
    });
    if (!membership) {
      return response.status(404).json({ error: "Member not found" });
    }

    // Validate the requested roles exist in this community.
    const roles = await Role.find({
      _id: { $in: parsed.data.roleIds },
      communityId: request.communityId,
    });
    if (roles.length !== parsed.data.roleIds.length) {
      return response
        .status(400)
        .json({ error: "One or more roles are invalid for this community" });
    }

    // Escalation guard: can't hand out permissions the caller lacks.
    const grantedBits = roles.reduce((acc, r) => acc | r.permissions, 0);
    if ((grantedBits & ~request.permissions) !== 0) {
      return response
        .status(403)
        .json({ error: "You can't assign permissions you don't have" });
    }

    membership.roleIds = roles.map((r) => r._id);
    await membership.save();

    return response.status(200).json(membership);
  } catch (error) {
    return response.status(500).json({ error: "Failed to update member roles" });
  }
};
