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

  // Messages of the active channel
  messages: IMessage[];
  setMessages: (messages: IMessage[]) => void;
  addMessage: (message: IMessage) => void;

  // Socket (wired for real-time in Phase 3)
  socket: any;
  setSocket: (socket: any) => void;

  // Reset everything on logout
  reset: () => void;
}
