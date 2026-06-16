import AuditLog from "../model/AuditLog.js";

// Records a moderation action. Best-effort: a failed audit write must never
// fail the moderation action itself, so errors are swallowed (logged).
export const writeAudit = async ({
  communityId,
  actorId,
  targetId,
  action,
  reason,
}) => {
  try {
    await AuditLog.create({ communityId, actorId, targetId, action, reason });
  } catch (error) {
    console.error("Failed to write audit log:", error.message);
  }
};
