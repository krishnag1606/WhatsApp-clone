import { Server } from "socket.io";

const io = new Server(9000, {
  cors: {
    // allow http://127.0.0.1:3000 and locahost:3000
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  },
});

const users = [];

const addUser = (userData, socketId) => {
  console.log("addUser", userData, socketId);
  !users.some((user) => user.sub === userData.sub) &&
    users.push({
      ...userData,
      socketId,
    });

  const user = users.find((user) => user.sub === userData.sub);
  if (user) {
    user.socketId = socketId;
  }

  console.log("USERS", users);
};

const getUser = (userId) => {
  console.log("trying to find the user");
  console.log("userId", userId);
  console.log("users", users);
  return users.find((user) => {
    console.log("current user is", user);
    return user.sub == userId;
  });
};

io.on("connection", (socket) => {
  console.log("new connection", socket.id);

  socket.on("addUsers", (userData) => {
    addUser(userData, socket.id);
    io.emit("getUsers", users);
  });

  socket.on("sendMessage", (data) => {
    console.log("sendMessage", data);
    const user = getUser(data.receiverId);
    io.to(user?.socketId).emit("getMessage", data);
  });
});
