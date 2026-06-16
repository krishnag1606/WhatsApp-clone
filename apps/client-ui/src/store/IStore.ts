// Domain types mirror the Phase 1 backend shapes (server/model/*).

export interface IUser {
  _id: string; // Google sub
  name: string;
  email: string;
  picture?: string;
}

export interface ICommunity {
  _id: string;
  name: string;
  icon?: string;
  ownerId: string;
  inviteCode: string;
  createdAt?: string;
}

export type ChannelType = "text" | "announcement";

export interface IChannel {
  _id: string;
  communityId: string;
  name: string;
  type: ChannelType;
  position: number;
  slowmodeSeconds?: number;
}

export interface IRole {
  _id: string;
  communityId: string;
  name: string;
  color: string;
  permissions: number;
  position: number;
}

// Member view returned by GET /api/communities/:id/members.
export interface IMember {
  userId: string;
  name: string;
  picture?: string | null;
  nickname?: string | null;
  roleIds: string[];
  banned: boolean;
  mutedUntil?: string | null;
  joinedAt?: string;
}

// Decrypted message view returned by GET /api/channels/:id/messages.
export interface IMessage {
  _id: string;
  channelId: string;
  authorId: string;
  text: string | null;
  type: string;
  pinned?: boolean;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string | null;
}

// Poll view returned by GET /api/channels/:id/polls and the socket newPoll /
// pollUpdated events. Each option carries its full voter list so the client can
// derive counts and whether the caller has voted.
export interface IPollOption {
  _id: string;
  text: string;
  voters: string[]; // User._id (Google sub)
}

export interface IPoll {
  _id: string;
  channelId: string;
  authorId: string;
  question: string;
  options: IPollOption[];
  allowMultiple: boolean;
  expiresAt?: string | null;
  createdAt: string;
  type: "poll";
}

export interface IStore {
  // Session
  token: string | null;
  setToken: (token: string | null) => void;
  currentUser: IUser | null;
  setCurrentUser: (user: IUser | null) => void;

  // Communities + active selection
  communities: ICommunity[];
  setCommunities: (communities: ICommunity[]) => void;
  activeCommunityId: string | null;
  setActiveCommunityId: (id: string | null) => void;

  // Channels of the active community
  channels: IChannel[];
  setChannels: (channels: IChannel[]) => void;
  activeChannelId: string | null;
  setActiveChannelId: (id: string | null) => void;

  // Roles & members of the active community + the caller's effective
  // permissions (Phase 4 — used to gate UI controls).
  roles: IRole[];
  setRoles: (roles: IRole[]) => void;
  members: IMember[];
  setMembers: (members: IMember[]) => void;
  myPermissions: number;
  setMyPermissions: (permissions: number) => void;

  // Messages of the active channel
  messages: IMessage[];
  setMessages: (messages: IMessage[]) => void;
  addMessage: (message: IMessage) => void;
  // Replace a message in place (e.g. pin toggled) — matched by _id.
  updateMessage: (message: IMessage) => void;
  // Remove a message from the active channel (e.g. deleted) — matched by _id.
  removeMessage: (messageId: string) => void;

  // Polls of the active channel (Phase 7). Interleaved with messages in the
  // list by createdAt; updated live via the pollUpdated socket event.
  polls: IPoll[];
  setPolls: (polls: IPoll[]) => void;
  addPoll: (poll: IPoll) => void;
  // Replace a poll in place (e.g. a vote changed counts) — matched by _id.
  updatePoll: (poll: IPoll) => void;

  // Socket (wired for real-time in Phase 3)
  socket: any;
  setSocket: (socket: any) => void;

  // Reset everything on logout
  reset: () => void;
}
