import { apiGet, apiPost, setToken } from "./apiClient";
import { IUser } from "../store/IStore";

interface GoogleAuthResponse {
  token: string;
  user: IUser;
}

class AuthService {
  // Server-verified login: exchange the Google credential for a Flux JWT.
  async googleAuth(credential: string): Promise<GoogleAuthResponse> {
    const data = await apiPost<GoogleAuthResponse>("/api/auth/google", {
      credential,
    });
    setToken(data.token);
    return data;
  }

  // Validates the stored session and returns the current user.
  async getMe(): Promise<IUser> {
    return apiGet<IUser>("/api/auth/me");
  }
}

export const authService = new AuthService();
