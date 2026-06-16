import { apiGet, apiPost } from "./apiClient";
import { ICommunity, IChannel } from "../store/IStore";

interface CreateCommunityResponse {
  community: ICommunity;
  roles: { _id: string; name: string }[];
  defaultChannel: IChannel;
}

interface JoinCommunityResponse {
  community: ICommunity;
  membership: { _id: string };
}

class CommunityService {
  // Communities the current user belongs to.
  list(): Promise<ICommunity[]> {
    return apiGet<ICommunity[]>("/api/communities");
  }

  create(name: string): Promise<CreateCommunityResponse> {
    return apiPost<CreateCommunityResponse>("/api/communities", { name });
  }

  get(communityId: string): Promise<ICommunity> {
    return apiGet<ICommunity>(`/api/communities/${communityId}`);
  }

  join(inviteCode: string): Promise<JoinCommunityResponse> {
    return apiPost<JoinCommunityResponse>("/api/communities/join", { inviteCode });
  }
}

export const communityService = new CommunityService();
