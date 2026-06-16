import { z } from "zod";
import User from "../model/User.js";
import { verifyGoogleToken } from "../util/google.js";
import { signSession } from "../util/jwt.js";

const googleAuthSchema = z.object({
  credential: z.string().min(1),
});

// POST /api/auth/google
// Verifies the Google credential server-side, upserts the user, and returns a
// Flux session JWT. The userId is the verified Google `sub` — never trusted
// from the client.
export const googleAuth = async (request, response) => {
  try {
    const parsed = googleAuthSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: "A `credential` is required" });
    }

    const profile = await verifyGoogleToken(parsed.data.credential);

    const user = await User.findByIdAndUpdate(
      profile.sub,
      {
        _id: profile.sub,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const token = signSession({ sub: profile.sub });
    return response.status(200).json({ token, user });
  } catch (error) {
    return response.status(401).json({ error: "Google token verification failed" });
  }
};

// GET /api/auth/me  (requireAuth)
export const getMe = async (request, response) => {
  try {
    const user = await User.findById(request.userId);
    if (!user) return response.status(404).json({ error: "User not found" });
    return response.status(200).json(user);
  } catch (error) {
    return response.status(500).json({ error: "Failed to load user" });
  }
};
