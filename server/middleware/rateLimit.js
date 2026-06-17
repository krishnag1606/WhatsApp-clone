import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Phase 8 — REST rate limiting (express-rate-limit). In-memory store, which is
// fine for the single-instance portfolio deploy; a multi-instance deploy would
// swap in a shared store (Redis). Limits are per IP for unauthenticated routes
// and per user for authenticated writes (so one NAT'd network isn't throttled
// as a single client).
//
// NOTE: when running behind a reverse proxy/CDN you MUST set `app.set('trust
// proxy', n)` so the client IP is read from X-Forwarded-For — otherwise every
// request looks like it comes from the proxy and shares one bucket. See index.js.

const jsonHandler = (request, response, _next, options) =>
  response.status(options.statusCode).json({
    error: options.message,
    retryAfter: Math.ceil(options.windowMs / 1000),
  });

// Key authenticated requests by the verified userId (falls back to IP). Must be
// mounted AFTER requireAuth so req.userId is populated.
const byUserOrIp = (request) =>
  request.userId || ipKeyGenerator(request.ip);

// Strict — login / token exchange. Brute-force and spam-account surface.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts. Try again later.",
  handler: jsonHandler,
});

// Moderate — message + poll creation (and votes). Per authenticated user.
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: byUserOrIp,
  message: "You're doing that too fast. Slow down a moment.",
  handler: jsonHandler,
});

// Light — community/channel/role creation & moderation actions. Per user.
export const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: byUserOrIp,
  message: "Too many requests. Slow down a moment.",
  handler: jsonHandler,
});
