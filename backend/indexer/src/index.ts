import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { logger } from './lib/logger.js';
import { EventIndexer } from './services/event-indexer.js';
import { MetricsCalculator } from './services/metrics-calculator.js';

const prisma = new PrismaClient();

async function main() {
  logger.info('🚀 Starting AstroShibaPop Indexer...');

  // Check environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'STELLAR_RPC_URL',
    'TOKEN_FACTORY_CONTRACT_ID',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      logger.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✓ Database connected');

    // Start event indexer
    const eventIndexer = new EventIndexer(prisma);
    await eventIndexer.start();

    // Start metrics calculator (runs every 60 seconds)
    const metricsCalculator = new MetricsCalculator(prisma);
    setInterval(() => {
      metricsCalculator.calculateAll().catch((error) => {
        logger.error('Error calculating metrics:', error);
      });
    }, 60000);

    logger.info('✓ Indexer running');

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down...');
      await eventIndexer.stop();
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Failed to start indexer:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
