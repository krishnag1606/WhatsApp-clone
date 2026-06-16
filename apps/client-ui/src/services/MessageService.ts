import { apiGet, apiPost } from "./apiClient";
import { IMessage } from "../store/IStore";

class MessageService {
  // Oldest-last (chronological), decrypted by the server.
  list(channelId: string): Promise<IMessage[]> {
    return apiGet<IMessage[]>(`/api/channels/${channelId}/messages`);
  }

  send(channelId: string, text: string): Promise<IMessage> {
    return apiPost<IMessage>(`/api/channels/${channelId}/messages`, { text });
  }
}

export const messageService = new MessageService();
