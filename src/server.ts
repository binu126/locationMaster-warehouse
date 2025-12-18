import app from "./app.js";
import { getPool } from "./config/db.js";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await getPool();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  }
}

start();
