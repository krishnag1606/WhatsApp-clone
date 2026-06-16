import { create } from "zustand";
import { IStore, IUser, ICommunity, IChannel, IMessage } from "./IStore";
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

  // Messages
  messages: [],
  setMessages: (messages: IMessage[]) => set({ messages }),
  addMessage: (message: IMessage) =>
    set((state) => ({ messages: [...state.messages, message] })),

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
      messages: [],
    }),
}));
