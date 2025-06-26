import { ICredentials } from "../../store";

const url = "http://localhost:8000";

export class GetUserService {
  async getUsers(): Promise<ICredentials[]> {
    const response = await fetch(`${url}/users`);
    const resp = await response.json();
    return resp;
  }
}
