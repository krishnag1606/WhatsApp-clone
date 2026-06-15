import { ICredentials } from "../../store";

// TODO: Update this URL to match your backend server
// You can also use environment variables: process.env.REACT_APP_API_BASE_URL
const url = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export class AddUserService {
  async addUser(user: ICredentials): Promise<ICredentials> {
    const response = await fetch(`${url}/add`, {
      method: "POST",
      body: JSON.stringify({
        user,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  }
}
