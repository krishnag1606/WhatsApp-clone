import { verifySession } from "../util/jwt.js";

// requireAuth: validates the Flux session JWT from the Authorization header
// and attaches req.userId (the Google `sub`). Identity is ALWAYS derived from
// the verified token, never from a client-supplied field.
export const requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Missing or malformed Authorization header" });
    }
    const payload = verifySession(token);
    req.userId = payload.sub;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired session token" });
  }
};
