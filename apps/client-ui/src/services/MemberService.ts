import { apiGet, apiPut } from "./apiClient";
import { IMember, IRole } from "../store/IStore";

export interface MyMembership {
  membership: { _id: string; userId: string; roleIds: string[] };
  roles: IRole[];
  permissions: number;
}

class MemberService {
  list(communityId: string): Promise<IMember[]> {
    return apiGet<IMember[]>(`/api/communities/${communityId}/members`);
  }

  // The caller's membership + effective permission bitfield (UI gating source).
  me(communityId: string): Promise<MyMembership> {
    return apiGet<MyMembership>(`/api/communities/${communityId}/me`);
  }

  setRoles(
    communityId: string,
    userId: string,
    roleIds: string[]
  ): Promise<{ _id: string; roleIds: string[] }> {
    return apiPut(
      `/api/communities/${communityId}/members/${userId}/roles`,
      { roleIds }
    );
  }
}

export const memberService = new MemberService();
