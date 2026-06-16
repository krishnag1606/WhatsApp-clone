import { apiGet, apiPost, apiPut } from "./apiClient";
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

  // Update channel settings (slowmode, name) — requires MANAGE_CHANNELS.
  update(
    channelId: string,
    data: { name?: string; slowmodeSeconds?: number; type?: ChannelType }
  ): Promise<IChannel> {
    return apiPut<IChannel>(`/api/channels/${channelId}`, data);
  }
}

export const channelService = new ChannelService();
