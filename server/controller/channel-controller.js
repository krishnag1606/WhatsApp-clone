import { z } from "zod";
import Channel from "../model/Channel.js";

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(["text", "announcement"]).optional(),
  position: z.number().int().optional(),
});

// POST /api/communities/:communityId/channels  (requireAuth + requireMembership)
// NOTE: MANAGE_CHANNELS permission enforcement is layered on in Phase 4.
export const createChannel = async (request, response) => {
  try {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: "A channel `name` is required" });
    }

    const channel = await Channel.create({
      communityId: request.communityId,
      name: parsed.data.name,
      type: parsed.data.type || "text",
      position: parsed.data.position ?? 0,
    });

    return response.status(201).json(channel);
  } catch (error) {
    return response.status(500).json({ error: "Failed to create channel" });
  }
};

// GET /api/communities/:communityId/channels  (requireAuth + requireMembership)
export const getChannels = async (request, response) => {
  try {
    const channels = await Channel.find({ communityId: request.communityId }).sort({
      position: 1,
      createdAt: 1,
    });
    return response.status(200).json(channels);
  } catch (error) {
    return response.status(500).json({ error: "Failed to load channels" });
  }
};
