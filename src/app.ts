import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import swaggerSpec from "./swagger.js"; // 👈 your swagger.ts file
import locationRoutes from "./routes/location.routes.js";

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:4200" }));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK" });
});

// Routes
app.use("/api/locations", locationRoutes);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


export default app;
