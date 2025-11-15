import { PrismaClient } from '@prisma/client';
import { Server, Horizon } from '@stellar/stellar-sdk';
import { logger } from '../lib/logger.js';
import { TokenEventHandler } from './handlers/token-events.js';
import { PoolEventHandler } from './handlers/pool-events.js';

export class EventIndexer {
  private server: Server;
  private tokenFactory: string;
  private ammFactory: string | null;
  private eventStreams: any[] = [];

  constructor(private prisma: PrismaClient) {
    const rpcUrl = process.env.STELLAR_RPC_URL!;
    this.server = new Server(rpcUrl);
    this.tokenFactory = process.env.TOKEN_FACTORY_CONTRACT_ID!;
    this.ammFactory = process.env.AMM_FACTORY_CONTRACT_ID || null;
  }

  async start() {
    logger.info('Starting event streams...');

    // Index Token Factory events
    await this.indexTokenFactory();

    // Index AMM events (if deployed)
    if (this.ammFactory) {
      await this.indexAMMFactory();
    }

    logger.info('Event streams started');
  }

  async stop() {
    logger.info('Stopping event streams...');
    for (const stream of this.eventStreams) {
      if (stream && typeof stream === 'function') {
        stream();
      }
    }
    this.eventStreams = [];
  }

  private async indexTokenFactory() {
    const tokenHandler = new TokenEventHandler(this.prisma);

    // Get last indexed ledger from database
    const lastIndexed = await this.getLastIndexedLedger('token_factory');
    const cursor = lastIndexed || 'now';

    logger.info(`Indexing Token Factory from cursor: ${cursor}`);

    try {
      const stream = this.server
        .events()
        .forContract(this.tokenFactory)
        .cursor(cursor)
        .stream({
          onmessage: async (event: Horizon.ServerApi.EventRecord) => {
            try {
              await this.handleTokenFactoryEvent(event, tokenHandler);
              await this.updateLastIndexedLedger('token_factory', event.ledger);
            } catch (error) {
              logger.error('Error handling Token Factory event:', error);
            }
          },
          onerror: (error: any) => {
            logger.error('Token Factory stream error:', error);
            // Attempt to reconnect after 5 seconds
            setTimeout(() => this.indexTokenFactory(), 5000);
          },
        });

      this.eventStreams.push(stream);
    } catch (error) {
      logger.error('Failed to start Token Factory stream:', error);
      throw error;
    }
  }

  private async indexAMMFactory() {
    if (!this.ammFactory) return;

    const poolHandler = new PoolEventHandler(this.prisma);
    const lastIndexed = await this.getLastIndexedLedger('amm_factory');
    const cursor = lastIndexed || 'now';

    logger.info(`Indexing AMM Factory from cursor: ${cursor}`);

    try {
      const stream = this.server
        .events()
        .forContract(this.ammFactory)
        .cursor(cursor)
        .stream({
          onmessage: async (event: Horizon.ServerApi.EventRecord) => {
            try {
              await this.handleAMMEvent(event, poolHandler);
              await this.updateLastIndexedLedger('amm_factory', event.ledger);
            } catch (error) {
              logger.error('Error handling AMM event:', error);
            }
          },
          onerror: (error: any) => {
            logger.error('AMM stream error:', error);
            setTimeout(() => this.indexAMMFactory(), 5000);
          },
        });

      this.eventStreams.push(stream);
    } catch (error) {
      logger.error('Failed to start AMM stream:', error);
    }
  }

  private async handleTokenFactoryEvent(
    event: Horizon.ServerApi.EventRecord,
    handler: TokenEventHandler
  ) {
    const eventType = this.getEventType(event);

    logger.debug(`Token Factory event: ${eventType}`);

    switch (eventType) {
      case 'created':
        await handler.handleTokenCreated(event);
        break;
      case 'buy':
        await handler.handleTokenBuy(event);
        break;
      case 'sell':
        await handler.handleTokenSell(event);
        break;
      case 'graduate':
        await handler.handleTokenGraduated(event);
        break;
      default:
        logger.warn(`Unknown Token Factory event type: ${eventType}`);
    }
  }

  private async handleAMMEvent(
    event: Horizon.ServerApi.EventRecord,
    handler: PoolEventHandler
  ) {
    const eventType = this.getEventType(event);

    logger.debug(`AMM event: ${eventType}`);

    switch (eventType) {
      case 'liq_add':
        await handler.handleLiquidityAdded(event);
        break;
      case 'liq_rm':
        await handler.handleLiquidityRemoved(event);
        break;
      case 'swap':
        await handler.handleSwap(event);
        break;
      default:
        logger.warn(`Unknown AMM event type: ${eventType}`);
    }
  }

  private getEventType(event: Horizon.ServerApi.EventRecord): string {
    // Extract event type from topics
    // Soroban events have topics as Symbol short strings
    try {
      if (event.topic && Array.isArray(event.topic) && event.topic.length > 0) {
        return event.topic[0].toString();
      }
      return 'unknown';
    } catch (error) {
      logger.error('Error extracting event type:', error);
      return 'unknown';
    }
  }

  private async getLastIndexedLedger(contract: string): Promise<string | null> {
    // In production, store this in database
    // For MVP, start from 'now'
    return null;
  }

  private async updateLastIndexedLedger(contract: string, ledger: string) {
    // In production, update database with last indexed ledger
    // This allows resuming from last position on restart
  }
}
