import Community from "../model/Community.js";
import { computePermissions } from "../util/permissions.js";
import { hasPermission } from "../constants/permissions.js";

// requirePermission(flag): authoritative permission gate. Runs AFTER
// requireAuth + requireMembership (it relies on req.membership + req.communityId).
// Computes the member's effective permissions (OR of their roles' bitfields;
// the owner gets everything) and rejects with 403 if the flag is missing.
// Attaches req.permissions and req.community for downstream handlers so they
// don't re-query.
export const requirePermission = (flag) => async (req, res, next) => {
  try {
    const community =
      req.community || (await Community.findById(req.communityId));
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }
    req.community = community;

    const permissions = await computePermissions(req.membership, community);
    req.permissions = permissions;

    if (!hasPermission(permissions, flag)) {
      return res
        .status(403)
        .json({ error: "You don't have permission to do that" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: "Permission check failed" });
  }
};
