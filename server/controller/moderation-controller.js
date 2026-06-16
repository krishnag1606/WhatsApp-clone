import { z } from "zod";
import Membership from "../model/Membership.js";
import AuditLog from "../model/AuditLog.js";
import User from "../model/User.js";
import { computePermissions, canModerate } from "../util/permissions.js";
import { writeAudit } from "../util/audit.js";

const reasonSchema = z.object({ reason: z.string().trim().max(500).optional() });
const muteSchema = reasonSchema.extend({
  minutes: z.number().int().min(1).max(60 * 24 * 14), // up to 14 days
});

// Resolves the target membership and enforces the shared moderation guards:
// target exists, isn't the actor, and is within the actor's authority
// (canModerate). Returns { membership } or sends the error response + returns
// null so callers can early-return.
const resolveTarget = async (request, response) => {
  const targetUserId = request.params.userId;
  if (targetUserId === request.userId) {
    response.status(400).json({ error: "You can't moderate yourself" });
    return null;
  }

  const membership = await Membership.findOne({
    communityId: request.communityId,
    userId: targetUserId,
  });
  if (!membership) {
    response.status(404).json({ error: "Member not found" });
    return null;
  }

  const targetPermissions = await computePermissions(
    membership,
    request.community
  );
  const actorIsOwner = request.community.ownerId === request.userId;
  if (!canModerate(request.permissions, targetPermissions, actorIsOwner)) {
    response
      .status(403)
      .json({ error: "You can't moderate someone with your level of power" });
    return null;
  }

  return membership;
};

// POST /api/communities/:communityId/members/:userId/kick  (KICK)
// Removes the membership entirely; the user may rejoin with an invite code.
export const kickMember = async (request, response) => {
  try {
    const parsed = reasonSchema.safeParse(request.body || {});
    const membership = await resolveTarget(request, response);
    if (!membership) return;

    await membership.deleteOne();
    await writeAudit({
      communityId: request.communityId,
      actorId: request.userId,
      targetId: request.params.userId,
      action: "kick",
      reason: parsed.success ? parsed.data.reason : undefined,
    });
    return response.status(200).json({ ok: true });
  } catch (error) {
    return response.status(500).json({ error: "Failed to kick member" });
  }
};

// POST /api/communities/:communityId/members/:userId/ban  (BAN)
// Flags the membership banned (kept so requireMembership + join both reject it).
export const banMember = async (request, response) => {
  try {
    const parsed = reasonSchema.safeParse(request.body || {});
    const membership = await resolveTarget(request, response);
    if (!membership) return;

    membership.banned = true;
    await membership.save();
    await writeAudit({
      communityId: request.communityId,
      actorId: request.userId,
      targetId: request.params.userId,
      action: "ban",
      reason: parsed.success ? parsed.data.reason : undefined,
    });
    return response.status(200).json({ ok: true });
  } catch (error) {
    return response.status(500).json({ error: "Failed to ban member" });
  }
};

// POST /api/communities/:communityId/members/:userId/unban  (BAN)
export const unbanMember = async (request, response) => {
  try {
    const membership = await Membership.findOne({
      communityId: request.communityId,
      userId: request.params.userId,
    });
    if (!membership) return response.status(404).json({ error: "Member not found" });

    membership.banned = false;
    await membership.save();
    await writeAudit({
      communityId: request.communityId,
      actorId: request.userId,
      targetId: request.params.userId,
      action: "unban",
    });
    return response.status(200).json({ ok: true });
  } catch (error) {
    return response.status(500).json({ error: "Failed to unban member" });
  }
};

// POST /api/communities/:communityId/members/:userId/mute  (MUTE)
// Sets mutedUntil = now + minutes. Enforced in the send paths (REST + socket).
export const muteMember = async (request, response) => {
  try {
    const parsed = muteSchema.safeParse(request.body || {});
    if (!parsed.success) {
      return response.status(400).json({ error: "A `minutes` duration is required" });
    }
    const membership = await resolveTarget(request, response);
    if (!membership) return;

    const mutedUntil = new Date(Date.now() + parsed.data.minutes * 60 * 1000);
    membership.mutedUntil = mutedUntil;
    await membership.save();
    await writeAudit({
      communityId: request.communityId,
      actorId: request.userId,
      targetId: request.params.userId,
      action: "mute",
      reason: parsed.data.reason,
    });
    return response.status(200).json({ ok: true, mutedUntil });
  } catch (error) {
    return response.status(500).json({ error: "Failed to mute member" });
  }
};

// POST /api/communities/:communityId/members/:userId/unmute  (MUTE)
export const unmuteMember = async (request, response) => {
  try {
    const membership = await Membership.findOne({
      communityId: request.communityId,
      userId: request.params.userId,
    });
    if (!membership) return response.status(404).json({ error: "Member not found" });

    membership.mutedUntil = undefined;
    await membership.save();
    await writeAudit({
      communityId: request.communityId,
      actorId: request.userId,
      targetId: request.params.userId,
      action: "unmute",
    });
    return response.status(200).json({ ok: true });
  } catch (error) {
    return response.status(500).json({ error: "Failed to unmute member" });
  }
};

// GET /api/communities/:communityId/audit  (any moderation permission)
// Recent audit entries, newest first, with actor/target display names resolved.
export const getAuditLog = async (request, response) => {
  try {
    const limit = Math.min(Number(request.query.limit) || 50, 200);
    const entries = await AuditLog.find({ communityId: request.communityId })
      .sort({ createdAt: -1 })
      .limit(limit);

    const ids = new Set();
    entries.forEach((e) => {
      ids.add(e.actorId);
      if (e.targetId) ids.add(e.targetId);
    });
    const users = await User.find({ _id: { $in: [...ids] } }).select("name");
    const nameById = new Map(users.map((u) => [u._id, u.name]));

    const view = entries.map((e) => ({
      _id: e._id,
      action: e.action,
      reason: e.reason ?? null,
      actorId: e.actorId,
      actorName: nameById.get(e.actorId) ?? e.actorId,
      targetId: e.targetId ?? null,
      targetName: e.targetId ? nameById.get(e.targetId) ?? e.targetId : null,
      createdAt: e.createdAt,
    }));
    return response.status(200).json(view);
  } catch (error) {
    return response.status(500).json({ error: "Failed to load audit log" });
  }
};
