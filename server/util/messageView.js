import { decrypt } from "./crypto.js";

// Serializes a stored Message document into the API/socket view with decrypted
// `text`. Shared by the REST controller and the Socket.IO server so both paths
// emit an identical shape. If a message can't be decrypted (tampered/corrupt),
// surface `text: null` rather than failing the whole request.
export const toMessageView = (doc) => {
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
