import { z } from "zod";
import Message from "../model/Message.js";
import { encrypt } from "../util/crypto.js";
import { toMessageView } from "../util/messageView.js";

const createSchema = z.object({
  text: z.string().min(1).max(4000),
  type: z.string().optional(),
});

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// POST /api/channels/:channelId/messages  (requireAuth + requireMembership)
// Encrypts content at rest. NOTE: mute enforcement is layered on in Phase 4.
export const addMessage = async (request, response) => {
  try {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: "Message `text` is required" });
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
