// import { HttpMethod } from "@common/shared";

import { ICredentials } from "../../store";

const url = "http://localhost:8000";

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
