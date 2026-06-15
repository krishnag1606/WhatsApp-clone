import dns from "dns";
import express from "express";
import Connection from "./database/db.js";
import Route from "./rotes/route.js";
import cors from "cors";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", Route);

Connection();

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
