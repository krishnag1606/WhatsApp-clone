import Message from "../model/Message.js";
import { Permissions, hasPermission } from "../constants/permissions.js";

// Returns an error string if the member may NOT send in this channel right now
// (muted, or still within the slowmode window), or null if they may. The
// SEND_MESSAGES/POST_ANNOUNCEMENTS permission is checked separately by callers;
// this covers the time-based gates. Members with MANAGE_MESSAGES bypass
// slowmode. Shared by the REST controller and the socket server so both enforce
// identically.
export const sendCooldownError = async ({ membership, channel, permissions }) => {
  if (
    membership.mutedUntil &&
    new Date(membership.mutedUntil).getTime() > Date.now()
  ) {
    return "You are muted in this community";
  }

  const slow = channel.slowmodeSeconds || 0;
  if (slow > 0 && !hasPermission(permissions, Permissions.MANAGE_MESSAGES)) {
    const last = await Message.findOne({
      channelId: channel._id,
      authorId: membership.userId,
    })
      .sort({ createdAt: -1 })
      .select("createdAt");
    if (last) {
      const elapsedSeconds =
        (Date.now() - new Date(last.createdAt).getTime()) / 1000;
      if (elapsedSeconds < slow) {
        const wait = Math.ceil(slow - elapsedSeconds);
        return `Slowmode is on — wait ${wait}s before sending again`;
      }
    }
  }

  return null;
};
