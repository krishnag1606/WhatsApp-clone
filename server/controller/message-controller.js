import { z } from "zod";
import Message from "../model/Message.js";
import Community from "../model/Community.js";
import { encrypt } from "../util/crypto.js";
import { toMessageView } from "../util/messageView.js";
import { computePermissions, sendPermissionFor } from "../util/permissions.js";
import { hasPermission } from "../constants/permissions.js";

const createSchema = z.object({
  text: z.string().min(1).max(4000),
  type: z.string().optional(),
});

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// POST /api/channels/:channelId/messages  (requireAuth + requireMembership)
// Encrypts content at rest. Permission is channel-type aware: announcement
// channels require POST_ANNOUNCEMENTS, text channels SEND_MESSAGES. Mute
// enforcement is layered on in Phase 5.
export const addMessage = async (request, response) => {
  try {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: "Message `text` is required" });
    }

    // requireMembership attaches req.channel when it resolves via :channelId.
    const channel = request.channel;
    const community = await Community.findById(request.communityId);
    const permissions = await computePermissions(request.membership, community);
    if (!hasPermission(permissions, sendPermissionFor(channel))) {
      return response
        .status(403)
        .json({ error: "You don't have permission to post in this channel" });
    }

    const message = await Message.create({
      channelId: request.params.channelId,
      authorId: request.userId,
      content: encrypt(parsed.data.text),
      type: parsed.data.type || "text",
    });

    return response.status(201).json(toMessageView(message));
  } catch (error) {
    return response.status(500).json({ error: "Failed to send message" });
  }
};

// GET /api/channels/:channelId/messages?limit=&before=
// Returns messages oldest-last (chronological), decrypted.
export const getMessages = async (request, response) => {
  try {
    const limit = Math.min(
      Number(request.query.limit) || DEFAULT_LIMIT,
      MAX_LIMIT
    );

    const query = { channelId: request.params.channelId, deletedAt: null };
    if (request.query.before) {
      query.createdAt = { $lt: new Date(request.query.before) };
    }

    // Fetch newest first for the limit window, then return chronological order.
    const docs = await Message.find(query).sort({ createdAt: -1 }).limit(limit);
    const messages = docs.reverse().map(toMessageView);

    return response.status(200).json(messages);
  } catch (error) {
    return response.status(500).json({ error: "Failed to load messages" });
  }
};
