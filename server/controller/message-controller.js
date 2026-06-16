import { z } from "zod";
import Message from "../model/Message.js";
import { encrypt, decrypt } from "../util/crypto.js";

const createSchema = z.object({
  text: z.string().min(1).max(4000),
  type: z.string().optional(),
});

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// Serializes a stored message into an API view with decrypted `text`. If a
// message can't be decrypted (tampered/corrupt), surface a placeholder rather
// than failing the whole request.
const toView = (doc) => {
  let text;
  try {
    text = decrypt(doc.content);
  } catch (error) {
    text = null;
  }
  return {
    _id: doc._id,
    channelId: doc.channelId,
    authorId: doc.authorId,
    text,
    type: doc.type,
    pinned: doc.pinned,
    createdAt: doc.createdAt,
    editedAt: doc.editedAt,
    deletedAt: doc.deletedAt,
  };
};

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

    return response.status(201).json(toView(message));
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
    const messages = docs.reverse().map(toView);

    return response.status(200).json(messages);
  } catch (error) {
    return response.status(500).json({ error: "Failed to load messages" });
  }
};
