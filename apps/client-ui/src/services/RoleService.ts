import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";
import { IRole } from "../store/IStore";

export interface RoleInput {
  name: string;
  color?: string;
  permissions?: number;
  position?: number;
}

class RoleService {
  list(communityId: string): Promise<IRole[]> {
    return apiGet<IRole[]>(`/api/communities/${communityId}/roles`);
  }

  create(communityId: string, data: RoleInput): Promise<IRole> {
    return apiPost<IRole>(`/api/communities/${communityId}/roles`, data);
  }

  update(
    communityId: string,
    roleId: string,
    data: Partial<RoleInput>
  ): Promise<IRole> {
    return apiPut<IRole>(
      `/api/communities/${communityId}/roles/${roleId}`,
      data
    );
  }

  remove(communityId: string, roleId: string): Promise<{ ok: boolean }> {
    return apiDelete(`/api/communities/${communityId}/roles/${roleId}`);
  }
}

export const roleService = new RoleService();
