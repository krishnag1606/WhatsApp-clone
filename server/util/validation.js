import { z } from "zod";

// Phase 8 — single source of truth for payload validation, shared by the REST
// controllers and the Socket.IO handlers so both paths validate identically
// before any DB/crypto work. (The socket package has no deps of its own; `zod`
// resolves from server/node_modules because this module lives under server/.)

const id = z.string().trim().min(1).max(100);

// --- Messages --------------------------------------------------------------
const messageText = z.string().trim().min(1).max(4000);

// REST body for POST /channels/:channelId/messages (channelId is in the path).
export const messageBodySchema = z.object({
  text: messageText,
  type: z.string().max(40).optional(),
});

// Socket sendMessage payload (channelId travels in the body).
export const sendMessageSchema = messageBodySchema.extend({ channelId: id });

// Socket delete/pin payloads.
export const messageRefSchema = z.object({ channelId: id, messageId: id });

// --- Polls -----------------------------------------------------------------
const pollFields = {
  question: z.string().trim().min(1).max(300),
  options: z.array(z.string().trim().min(1).max(100)).min(2).max(10),
  allowMultiple: z.boolean().optional(),
  // Optional ISO close time; only accepted if it's in the future.
  expiresAt: z
    .string()
    .datetime()
    .refine((s) => new Date(s).getTime() > Date.now(), {
      message: "expiresAt must be in the future",
    })
    .optional(),
};

export const pollBodySchema = z.object(pollFields);
export const createPollSchema = z.object({ channelId: id, ...pollFields });

export const voteBodySchema = z.object({ optionId: id });
export const votePollSchema = z.object({ channelId: id, pollId: id, optionId: id });
