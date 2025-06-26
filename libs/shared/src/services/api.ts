import { HttpMethod, IApi } from './IApi';

export class Api implements IApi {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    return response.json();
  }

  async post<T>(url: string, body: any): Promise<T> {
    try {
      const response = await fetch(url, {
        method: HttpMethod.POST,
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async put<T>(url: string, body: any): Promise<T> {
    try {
      const response = await fetch(url, {
        method: HttpMethod.PUT,
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async delete<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: HttpMethod.DELETE,
    });
    return response.json();
  }
}
