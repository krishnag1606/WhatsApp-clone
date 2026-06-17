import dns from "dns";
import express from "express";
import Connection from "./database/db.js";
import Route from "./rotes/route.js";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Behind a reverse proxy/CDN (Phase 9 deploy), set TRUST_PROXY to the number of
// proxy hops so express-rate-limit reads the real client IP from
// X-Forwarded-For. Left off in local dev (direct connections) to avoid the
// permissive `trust proxy = true` that lets clients spoof their IP / bucket.
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);
}

// TODO: Update CORS configuration for production
// Add your frontend domain to the origin array
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(
  bodyParser.json({
    extended: true,
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use("/", Route);

Connection();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API available at: http://localhost:${PORT}`);
});
