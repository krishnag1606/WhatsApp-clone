// Serializes a stored Poll document into the API/socket view. Shared by the REST
// controller and the Socket.IO server so both paths emit an identical shape.
// Each option carries its full `voters` list (User._id) so the client can both
// count votes and tell whether the caller has voted — fine at portfolio scope.
export const toPollView = (doc) => ({
  _id: doc._id,
  channelId: doc.channelId,
  authorId: doc.authorId,
  question: doc.question,
  options: doc.options.map((opt) => ({
    _id: opt._id,
    text: opt.text,
    voters: [...opt.voters],
  })),
  allowMultiple: doc.allowMultiple,
  expiresAt: doc.expiresAt ?? null,
  createdAt: doc.createdAt,
  // Tagged so the client can interleave polls into the message stream.
  type: "poll",
});
