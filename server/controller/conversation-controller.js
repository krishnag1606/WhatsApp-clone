import Conversation from "../model/Conversation.js";

export const createConversation = async (request, response) => {
  try {
    const senderId = request.body.data.senderId;
    const receiverId = request.body.data.receiverId;

    const doesConversationExist = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (doesConversationExist) {
      response.status(200).json("Conversation already exists");
      return;
    }

    const newConversation = new Conversation({
      members: [senderId, receiverId],
    });
    await newConversation.save();

    response.status(200).json("Conversation created successfully");
  } catch (error) {
    return response.status(500).json(error);
  }
};

export const getConversation = async (request, response) => {
  try {
    let conversation = await Conversation.findOne({
      members: {
        $all: [request.body.data.senderId, request.body.data.receiverId],
      },
    });

    return response.status(200).json(conversation);
  } catch (error) {
    return response.status(500).json(error.message);
  }
};

export const getConversations = async (request, response) => {
  // Get all the conversations
  try {
    const conversations = await Conversation.find({
      members: { $in: [request.body.data.senderId] },
    });

    return response.status(200).json(conversations);
  } catch (error) {
    return response.status(500).json(error.message);
  }
};
