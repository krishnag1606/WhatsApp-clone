import { apiGet, apiPost } from "./apiClient";
import { IPoll } from "../store/IStore";

// REST client for polls (Phase 7). Voting + creation go socket-first (see
// socketService) and fall back to these when the socket is disconnected.
class PollService {
  // Oldest-first, so the client can interleave polls with messages by createdAt.
  list(channelId: string): Promise<IPoll[]> {
    return apiGet<IPoll[]>(`/api/channels/${channelId}/polls`);
  }

  create(
    channelId: string,
    data: { question: string; options: string[]; allowMultiple?: boolean }
  ): Promise<IPoll> {
    return apiPost<IPoll>(`/api/channels/${channelId}/polls`, data);
  }

  vote(channelId: string, pollId: string, optionId: string): Promise<IPoll> {
    return apiPost<IPoll>(
      `/api/channels/${channelId}/polls/${pollId}/vote`,
      { optionId }
    );
  }
}

export const pollService = new PollService();
