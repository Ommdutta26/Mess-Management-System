import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import routes from "./routes.js";
process.env.TZ = process.env.TZ || "Asia/Kolkata";
if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
    throw Error("Set MONGO_URI and JWT_SECRET in server/.env");
}
const app = express();
app.use(
    helmet(),
    cors({ origin: process.env.CLIENT_ORIGIN?.split(",") || true }),
    express.json({ limit: "50kb" }),
    morgan("dev"),
);
app.use(
    "/api/auth",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 30,
        message: { error: "Too many attempts. Try again in a few minutes." },
    }),
);
app.get("/api/health", (q, s) => s.json({ ok: true }));
app.use("/api", routes);
app.use((e, q, s, n) => {
    if (e.status) return s.status(e.status).json({ error: e.message });
    if (e.name === "CastError") {
        return s.status(400).json({ error: "Invalid ID." });
    }
    console.error(e);
    s.status(500).json({ error: "Something went wrong." });
});
await mongoose.connect(process.env.MONGO_URI);
app.listen(
    process.env.PORT || 5000,
    () => console.log("API ready on port " + (process.env.PORT || 5000)),
);
