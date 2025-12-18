import express from "express";
import cors from "cors";
import locationRoutes from "./routes/location.routes.js";

const app = express();

app.use(cors({ origin: "http://localhost:4200" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "OK" });
});

app.use("/api/locations", locationRoutes);

export default app;
