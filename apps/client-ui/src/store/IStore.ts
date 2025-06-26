export interface ICredentials {
  aud: string; // Audience ID
  azp: string; // Authorized party ID
  email: string; // User's email
  email_verified: boolean; // Whether the email is verified
  exp: number; // Expiration time (UNIX timestamp)
  family_name: string; // User's last name
  given_name: string; // User's first name
  iat: number; // Issued at time (UNIX timestamp)
  iss: string; // Issuer
  jti: string; // Token ID
  name: string; // Full name
  nbf: number; // Not before time (UNIX timestamp)
  picture: string; // URL to the user's profile picture
  sub: string; // Subject ID (unique identifier for the user)
}

export interface IStore {
  // Credentials of the user
  credentials: ICredentials | null;
  setCredentials: (newCredentials: any) => void;

  // Whether the profile view is open
  profileView: boolean;
  setProfileView: (profileView: boolean) => void;

  // List of all the users
  users: ICredentials[];
  setUsers: (users: ICredentials[]) => void;

  // Selected Chat
  selectedChat: ICredentials | null;
  setSelectedChat: (selectedChat: ICredentials | null) => void;

  // Conversation
  conversation: IConversation | null;
  setConversation: (conversation: IConversation | null) => void;

  // Messages
  messages: IMessage[];
  setMessages: (messages: IMessage[]) => void;

  // Socket
  socket: any;
  setSocket: (socket: any) => void;

  // Set active users
  activeUsers: ICredentials[];
  setActiveUsers: (activeUsers: ICredentials[]) => void;
}

export interface IConversation {
  senderId: string;
  receiverId: string;
  conversationId: string | null;
}

export interface IMessage {
  senderId: string;
  receiverId: string;
  conversationId: string;
  text: string;
  type: string;
  createdAt?: string;
}
