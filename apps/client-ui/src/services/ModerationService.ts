import { apiGet, apiPost } from "./apiClient";

export interface IAuditEntry {
  _id: string;
  action: string;
  reason: string | null;
  actorId: string;
  actorName: string;
  targetId: string | null;
  targetName: string | null;
  createdAt: string;
}

// Member moderation + audit log. All actions are authoritatively enforced and
// audited on the server; these just call the gated endpoints.
class ModerationService {
  kick(communityId: string, userId: string, reason?: string) {
    return apiPost(
      `/api/communities/${communityId}/members/${userId}/kick`,
      { reason }
    );
  }

  ban(communityId: string, userId: string, reason?: string) {
    return apiPost(
      `/api/communities/${communityId}/members/${userId}/ban`,
      { reason }
    );
  }

  unban(communityId: string, userId: string) {
    return apiPost(`/api/communities/${communityId}/members/${userId}/unban`);
  }

  mute(communityId: string, userId: string, minutes: number, reason?: string) {
    return apiPost(
      `/api/communities/${communityId}/members/${userId}/mute`,
      { minutes, reason }
    );
  }

  unmute(communityId: string, userId: string) {
    return apiPost(`/api/communities/${communityId}/members/${userId}/unmute`);
  }

  auditLog(communityId: string): Promise<IAuditEntry[]> {
    return apiGet<IAuditEntry[]>(`/api/communities/${communityId}/audit`);
  }
}

export const moderationService = new ModerationService();
