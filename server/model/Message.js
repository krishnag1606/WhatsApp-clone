import mongoose from "mongoose";

// Encrypted-at-rest content. The server encrypts on write / decrypts on read
// via util/crypto.js — content is stored as { ciphertext, iv, tag }, never
// plaintext. See CLAUDE.md "Encryption at rest".
const encryptedContentSchema = new mongoose.Schema(
  {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    tag: { type: String, required: true },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },
    authorId: { type: String, required: true }, // User._id (Google sub)
    content: { type: encryptedContentSchema, required: true },
    type: { type: String, default: "text" }, // text | announcement | poll
    pinned: { type: Boolean, default: false },
    editedAt: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true } // createdAt / updatedAt
);

messageSchema.index({ channelId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
