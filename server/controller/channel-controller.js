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

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  type: z.enum(["text", "announcement"]).optional(),
  position: z.number().int().optional(),
  slowmodeSeconds: z.number().int().min(0).max(21600).optional(), // up to 6h
});

// PUT /api/channels/:channelId  (requireAuth + requireMembership + MANAGE_CHANNELS)
// Updates channel settings, notably slowmode. requireMembership attaches
// req.channel when it resolves the community via :channelId.
export const updateChannel = async (request, response) => {
  try {
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: "Invalid channel update" });
    }

    const channel = request.channel || (await Channel.findById(request.params.channelId));
    if (!channel) return response.status(404).json({ error: "Channel not found" });

    if (parsed.data.name !== undefined) channel.name = parsed.data.name;
    if (parsed.data.type !== undefined) channel.type = parsed.data.type;
    if (parsed.data.position !== undefined) channel.position = parsed.data.position;
    if (parsed.data.slowmodeSeconds !== undefined)
      channel.slowmodeSeconds = parsed.data.slowmodeSeconds;

    await channel.save();
    return response.status(200).json(channel);
  } catch (error) {
    return response.status(500).json({ error: "Failed to update channel" });
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
