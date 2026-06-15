import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const USERNAME = process.env.DB_USERNAME;
const PASSWORD = process.env.DB_PASSWORD;

const Connection = async () => {
  const url = `mongodb+srv://${USERNAME}:${PASSWORD}@cluster0.gkx1ojl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
  try {
    console.log("Connecting to the database");
    await mongoose.connect(url);
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Error while connecting to the database", error);
  }
};

export default Connection;
