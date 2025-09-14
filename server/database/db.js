import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// TODO: Set up your MongoDB Atlas credentials
// 1. Create account at https://www.mongodb.com/cloud/atlas
// 2. Create a new cluster
// 3. Create a database user
// 4. Get connection string and update .env file
const USERNAME = process.env.DB_USERNAME;
const PASSWORD = process.env.DB_PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.error("❌ MongoDB credentials not found in environment variables");
  console.log("Please create a .env file with DB_USERNAME and DB_PASSWORD");
  process.exit(1);
}

const Connection = async () => {
  const url = `mongodb+srv://${USERNAME}:${PASSWORD}@clone-whatsapp.xcpac.mongodb.net/?retryWrites=true&w=majority&appName=clone-whatsapp`;
  try {
    console.log("🔄 Connecting to MongoDB Atlas...");
    await mongoose.connect(url, {
      useUnifiedTopology: true,
    });
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Error while connecting to the database:", error.message);
    process.exit(1);
  }
};

export default Connection;
