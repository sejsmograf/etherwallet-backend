import app from "./app";
import { config } from "./config/config";
import { testConnection } from "./db/database";

const startServer = async (): Promise<void> => {
  try {
    if (!config.infura.projectId) {
      throw new Error("INFURA_PROJECT_ID is required");
    }

    // --- 3. Dodaj testowanie połączenia z bazą danych ---
    console.log("Connecting to database..."); // Opcjonalny log
    await testConnection();
    // ----------------------------------------------------

    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });

    const shutdown = () => {
      console.log("Shutting down server...");
      server.close(() => {
        console.log("Server shut down successfully");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
