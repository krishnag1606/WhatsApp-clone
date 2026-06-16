import Message from "../model/Message.js";
import { Permissions, hasPermission } from "../constants/permissions.js";
import { writeAudit } from "./audit.js";

// Soft-deletes a message. Allowed if the actor is the author OR holds
// MANAGE_MESSAGES. Audited only when a moderator deletes someone else's
// message. Returns { ok, error, message }. Shared by the REST controller and
// the socket server.
export const deleteMessageAs = async ({
  messageId,
  channelId,
  userId,
  permissions,
  communityId,
}) => {
  const message = await Message.findOne({ _id: messageId, channelId });
  if (!message) return { error: "Message not found" };
  if (message.deletedAt) return { ok: true, message };

  const isAuthor = message.authorId === userId;
  if (!isAuthor && !hasPermission(permissions, Permissions.MANAGE_MESSAGES)) {
    return { error: "You can't delete this message" };
  }

  message.deletedAt = new Date();
  await message.save();

  if (!isAuthor) {
    await writeAudit({
      communityId,
      actorId: userId,
      targetId: message.authorId,
      action: "delete_message",
    });
  }
  return { ok: true, message };
};

// Toggles a message's pinned flag. Requires MANAGE_MESSAGES. Returns
// { ok, error, message }.
export const togglePinAs = async ({
  messageId,
  channelId,
  userId,
  permissions,
  communityId,
}) => {
  if (!hasPermission(permissions, Permissions.MANAGE_MESSAGES)) {
    return { error: "You don't have permission to pin messages" };
  }
  const message = await Message.findOne({ _id: messageId, channelId });
  if (!message) return { error: "Message not found" };

  message.pinned = !message.pinned;
  await message.save();

  await writeAudit({
    communityId,
    actorId: userId,
    targetId: message.authorId,
    action: message.pinned ? "pin_message" : "unpin_message",
  });
  return { ok: true, message };
};
