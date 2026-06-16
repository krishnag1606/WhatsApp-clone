import Membership from "../model/Membership.js";
import Channel from "../model/Channel.js";

// requireMembership: confirms req.userId has an active (non-banned) membership
// in the relevant community, resolved from (in order):
//   1. req.params.communityId / req.body.communityId
//   2. req.params.channelId  -> the channel's communityId
// Attaches req.communityId and req.membership for downstream handlers.
// Must run after requireAuth. Per-permission gating is layered on in Phase 4.
export const requireMembership = async (req, res, next) => {
  try {
    let communityId = req.params.communityId || req.body.communityId;

    if (!communityId && req.params.channelId) {
      const channel = await Channel.findById(req.params.channelId);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }
      communityId = channel.communityId.toString();
      req.channel = channel;
    }

    if (!communityId) {
      return res.status(400).json({ error: "Could not resolve community for this request" });
    }

    const membership = await Membership.findOne({
      communityId,
      userId: req.userId,
    });

    if (!membership || membership.banned) {
      return res.status(403).json({ error: "You are not a member of this community" });
    }

    req.communityId = communityId;
    req.membership = membership;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Failed to verify membership" });
  }
};
