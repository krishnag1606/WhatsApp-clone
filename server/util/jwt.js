import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Flux session tokens. Signed with JWT_SECRET; the `sub` claim is the Google
// user id (canonical user id). Reused by the socket server in Phase 3.

const EXPIRES_IN = "7d";

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Add it to server/.env.");
  }
  return secret;
};

export const signSession = ({ sub }) => {
  if (!sub) throw new Error("signSession requires a `sub` (user id).");
  return jwt.sign({ sub }, getSecret(), { expiresIn: EXPIRES_IN });
};

// Returns the decoded payload ({ sub, iat, exp }) or throws if invalid/expired.
export const verifySession = (token) => jwt.verify(token, getSecret());
