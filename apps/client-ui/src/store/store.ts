import { create } from "zustand";
import {
  IStore,
  IUser,
  ICommunity,
  IChannel,
  IMessage,
  IRole,
  IMember,
  IPoll,
} from "./IStore";
import { getToken } from "../services/apiClient";

export const useStore = create<IStore>((set) => ({
  // Session — token is hydrated from localStorage so refreshes stay logged in.
  token: getToken(),
  setToken: (token: string | null) => set({ token }),
  currentUser: null,
  setCurrentUser: (currentUser: IUser | null) => set({ currentUser }),

  // Communities
  communities: [],
  setCommunities: (communities: ICommunity[]) => set({ communities }),
  activeCommunityId: null,
  setActiveCommunityId: (activeCommunityId: string | null) =>
    set({ activeCommunityId }),

  // Channels
  channels: [],
  setChannels: (channels: IChannel[]) => set({ channels }),
  activeChannelId: null,
  setActiveChannelId: (activeChannelId: string | null) =>
    set({ activeChannelId }),

  // Roles & members of the active community (Phase 4)
  roles: [],
  setRoles: (roles: IRole[]) => set({ roles }),
  members: [],
  setMembers: (members: IMember[]) => set({ members }),
  myPermissions: 0,
  setMyPermissions: (myPermissions: number) => set({ myPermissions }),

  // Messages
  messages: [],
  setMessages: (messages: IMessage[]) => set({ messages }),
  addMessage: (message: IMessage) =>
    set((state) =>
      // Dedup: the socket broadcasts back to the sender too, and a REST send
      // may also append, so guard against inserting the same message twice.
      state.messages.some((m) => m._id === message._id)
        ? {}
        : { messages: [...state.messages, message] }
    ),
  updateMessage: (message: IMessage) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === message._id ? message : m
      ),
    })),
  removeMessage: (messageId: string) =>
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== messageId),
    })),

  // Polls (Phase 7)
  polls: [],
  setPolls: (polls: IPoll[]) => set({ polls }),
  addPoll: (poll: IPoll) =>
    set((state) =>
      // Dedup: the socket broadcasts newPoll to the creator too, and a REST
      // create may also append, so guard against inserting twice.
      state.polls.some((p) => p._id === poll._id)
        ? {}
        : { polls: [...state.polls, poll] }
    ),
  updatePoll: (poll: IPoll) =>
    set((state) => ({
      polls: state.polls.map((p) => (p._id === poll._id ? poll : p)),
    })),

  // Socket (Phase 3)
  socket: null,
  setSocket: (socket: any) => set({ socket }),

  reset: () =>
    set({
      currentUser: null,
      token: null,
      communities: [],
      activeCommunityId: null,
      channels: [],
      activeChannelId: null,
      roles: [],
      members: [],
      myPermissions: 0,
      messages: [],
      polls: [],
      // Drop the socket ref too so a new session never reuses the old
      // connection (AppShell disconnects it on unmount).
      socket: null,
    }),
}));
