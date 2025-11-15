import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { PrismaClient } from '@prisma/client';
import { typeDefs } from './schema/index.js';
import { resolvers } from './resolvers/index.js';
import { logger } from './lib/logger.js';
import { createContext } from './context.js';

const app = express();
const prisma = new PrismaClient();

async function startServer() {
  // Apollo Server setup
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (error) => {
      logger.error('GraphQL Error:', error);
      return error;
    },
  });

  await server.start();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // GraphQL endpoint
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => createContext({ req, prisma }),
    })
  );

  const PORT = process.env.API_PORT || 4000;

  app.listen(PORT, () => {
    logger.info(`🚀 GraphQL API running at http://localhost:${PORT}/graphql`);
    logger.info(`📊 Health check at http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    await server.stop();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
