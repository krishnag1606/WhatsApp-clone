import { apiGet, apiPost } from "./apiClient";
import { IChannel, ChannelType } from "../store/IStore";

class ChannelService {
  list(communityId: string): Promise<IChannel[]> {
    return apiGet<IChannel[]>(`/api/communities/${communityId}/channels`);
  }

  create(
    communityId: string,
    data: { name: string; type?: ChannelType }
  ): Promise<IChannel> {
    return apiPost<IChannel>(
      `/api/communities/${communityId}/channels`,
      data
    );
  }
}

export const channelService = new ChannelService();
