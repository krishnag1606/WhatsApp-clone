import { ICredentials } from "../../store";

// TODO: Update this URL to match your backend server
// You can also use environment variables: process.env.REACT_APP_API_BASE_URL
const url = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export class GetUserService {
  async getUsers(): Promise<ICredentials[]> {
    const response = await fetch(`${url}/users`);
    const resp = await response.json();
    return resp;
  }
}
