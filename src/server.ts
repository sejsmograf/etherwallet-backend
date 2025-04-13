import app from './app';
import { config } from './config/config';

const startServer = (): void => {
  try {
    // Check if Infura project ID is provided
    if (!config.infura.projectId) {
      throw new Error('INFURA_PROJECT_ID is required');
    }

    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });

    // Handle graceful shutdown
    const shutdown = () => {
      console.log('Shutting down server...');
      server.close(() => {
        console.log('Server shut down successfully');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
