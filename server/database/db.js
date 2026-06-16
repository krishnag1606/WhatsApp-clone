import dns from "dns";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// The `mongodb+srv://` scheme needs a DNS **SRV** lookup. On many Windows /
// VPN / ISP setups the default resolver refuses SRV queries, which surfaces as
// `querySrv ECONNREFUSED`. Pointing Node at a public resolver that serves SRV
// records fixes it. (Overridable via DNS_SERVERS, comma-separated.)
const DNS_SERVERS = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
try {
  dns.setServers(DNS_SERVERS);
} catch (error) {
  console.warn("⚠️  Could not set DNS servers:", error.message);
}

const USERNAME = process.env.DB_USERNAME;
const PASSWORD = process.env.DB_PASSWORD;

// Allow a full override (e.g. the non-SRV `mongodb://host1,host2/...` string
// from Atlas, which avoids SRV lookups entirely). Otherwise build the SRV URL
// from the credentials. Password is URL-encoded so special characters are safe.
const buildUrl = () => {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (!USERNAME || !PASSWORD) {
    console.error("❌ MongoDB credentials not found in environment variables");
    console.log("Set DB_USERNAME and DB_PASSWORD (or MONGODB_URI) in server/.env");
    process.exit(1);
  }
  return `mongodb+srv://${USERNAME}:${encodeURIComponent(
    PASSWORD
  )}@cluster0.gkx1ojl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
};

const Connection = async () => {
  const url = buildUrl();
  try {
    console.log("🔄 Connecting to MongoDB Atlas...");
    await mongoose.connect(url, { serverSelectionTimeoutMS: 15000 });
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Error while connecting to the database:", error.message);
    if (String(error.message).includes("querySrv")) {
      console.error(
        "↳ SRV DNS lookup failed. Either your network blocks SRV records " +
          "(try a different DNS / off VPN), or paste the non-SRV connection " +
          "string from Atlas into MONGODB_URI in server/.env."
      );
    }
    process.exit(1);
  }
};

export default Connection;
