import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

// Server-side verification of the Google credential the client receives from
// @react-oauth/google. NEVER trust a client-supplied userId — identity is
// derived from the verified token's `sub`.

const getClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not set. Add it to server/.env.");
  }
  return { client: new OAuth2Client(clientId), clientId };
};

// Verifies the id_token and returns the canonical user fields.
// Throws if the token is invalid, expired, or for the wrong audience.
export const verifyGoogleToken = async (idToken) => {
  const { client, clientId } = getClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
};
