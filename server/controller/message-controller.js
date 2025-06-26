import Message from "../model/Message.js";
import Conversation from "../model/Conversation.js";

export const addNewMessage = async (request, response) => {
  try {
    const newMessage = request.body?.message;
    const message = new Message(newMessage);
    await message.save();

    await Conversation.findByIdAndUpdate(request.body.message?.conversationId, {
      message: request.body.message?.text,
    });

    return response.status(200).json("Message added successfully");
  } catch (error) {
    return response.status(500).json(error);
  }
};

export const getMessages = async (request, response) => {
  try {
    const messages = await Message.find({ conversationId: request.params.id });

    return response.status(200).json(messages);
  } catch (error) {
    return response.status(500).json(error);
  }
};
