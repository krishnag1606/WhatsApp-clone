import { create } from "zustand";
import { ICredentials, IStore, IConversation } from "./IStore";

export const useStore = create<IStore>((set) => ({
  credentials: null,
  setCredentials: (newCredentials: any) =>
    set((state: IStore) => ({ credentials: newCredentials })),

  profileView: false,
  setProfileView: (profileView: boolean) =>
    set((state: IStore) => ({ profileView })),

  users: [],
  setUsers: (users: ICredentials[]) => set((state: IStore) => ({ users })),

  // Selected chat
  selectedChat: null,
  setSelectedChat: (selectedChat: ICredentials | null) =>
    set((state: IStore) => ({ selectedChat })),

  // Conversation
  conversation: null,
  setConversation: (conversation: IConversation | null) =>
    set((state: IStore) => ({ conversation })),

  // Messages
  messages: [],
  setMessages: (messages: any[]) => set((state: IStore) => ({ messages })),

  // socket
  socket: null,
  setSocket: (socket: any) => set((state: IStore) => ({ socket })),

  // Active users
  activeUsers: [],
  setActiveUsers: (activeUsers: ICredentials[]) =>
    set((state: IStore) => ({ activeUsers })),
}));
