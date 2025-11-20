import { Server } from "socket.io";

const io = new Server(9000, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "http://127.0.0.1:3000",
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
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
  console.log("🔌 New socket connection:", socket.id);

  socket.on("addUsers", (userData) => {
    console.log("Adding user:", userData?.given_name);
    addUser(userData, socket.id);
    io.emit("getUsers", users);
  });

  socket.on("sendMessage", (data) => {
    console.log("Sending message from:", data.senderId, "to:", data.receiverId);
    const user = getUser(data.receiverId);
    if (user?.socketId) {
      io.to(user.socketId).emit("getMessage", data);
      console.log("Message delivered to:", user.given_name);
    } else {
      console.log("User not found or offline:", data.receiverId);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    // Remove user from active users list
    const userIndex = users.findIndex(user => user.socketId === socket.id);
    if (userIndex !== -1) {
      console.log("Removing user:", users[userIndex].given_name);
      users.splice(userIndex, 1);
      io.emit("getUsers", users);
    }
  });
});

console.log("Socket.IO server running on port 9000");
console.log("Accepting connections from frontend");
