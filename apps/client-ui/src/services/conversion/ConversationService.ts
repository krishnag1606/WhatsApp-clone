import { Api } from "@common/shared";
import { IConversation, IMessage } from "../../store";

// TODO: Update this URL to match your backend server
// You can also use environment variables: process.env.REACT_APP_API_BASE_URL
const url = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export interface IConversationResponse {
  createdAt: string;
  updatedAt: string;
  __v: number;
  _id: string;
  members: string[];
  message: string;
}

class ConversationService extends Api {
  async createConversation(data: {
    senderId: string;
    receiverId: string;
  }): Promise<void> {
    const response = await fetch(`${url}/conversation/add`, {
      method: "POST",
      body: JSON.stringify({
        data,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  }

  async getConversation(data: {
    senderId: string;
    receiverId: string;
  }): Promise<IConversationResponse> {
    try {
      const response = await fetch(`${url}/conversation/get`, {
        method: "POST",
        body: JSON.stringify({
          data,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    } catch (error) {
      throw error;
    }
  }

  async getAllConversations(data: {
    senderId: string;
    receiverId: string;
  }): Promise<IConversationResponse[]> {
    try {
      const response = await fetch(`${url}/conversation/all`, {
        method: "POST",
        body: JSON.stringify({
          data,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    } catch (error) {
      throw error;
    }
  }

  // Add message

  addNewMessage = async (message: IMessage) => {
    const response = await fetch(`${url}/message/add`, {
      method: "POST",
      body: JSON.stringify({
        message,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  };

  // Get messages of a conversation
  getMessages = async (conversationId: string) => {
    try {
      let response = await fetch(`${url}/message/${conversationId}`);
      return response.json();
    } catch (error) {
      throw error;
    }
  };
}

const conversationService = new ConversationService();
export { conversationService };
