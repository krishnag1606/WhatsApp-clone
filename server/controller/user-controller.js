import User from "../model/User.js";

export const addUser = async (request, response) => {
  try {
    let exist = await User.findOne({ sub: request.body.user.sub });

    if (exist) {
      response.status(200).json("user already exists");
      return;
    }

    const newUser = new User(request.body.user);
    await newUser.save();
    response.status(200).json(newUser);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getUsers = async (request, response) => {
  try {
    const user = await User.find({});
    response.status(200).json(user);
  } catch (error) {
    response.status(500).json(error);
  }
};
