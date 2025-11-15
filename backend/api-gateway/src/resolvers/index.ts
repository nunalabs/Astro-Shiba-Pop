import { DateTimeResolver } from 'graphql-scalars';
import { Context } from '../context.js';

export const resolvers = {
  DateTime: DateTimeResolver,

  Query: {
    // Tokens
    token: async (_: any, { address }: any, { prisma }: Context) => {
      return prisma.token.findUnique({ where: { address } });
    },

    tokens: async (
      _: any,
      { limit, offset, orderBy, search }: any,
      { prisma }: Context
    ) => {
      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { symbol: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const orderByMap: any = {
        CREATED_AT_DESC: { createdAt: 'desc' },
        CREATED_AT_ASC: { createdAt: 'asc' },
        MARKET_CAP_DESC: { marketCap: 'desc' },
        VOLUME_DESC: { volume24h: 'desc' },
        HOLDERS_DESC: { holders: 'desc' },
      };

      const [edges, total] = await Promise.all([
        prisma.token.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: orderByMap[orderBy] || { createdAt: 'desc' },
        }),
        prisma.token.count({ where }),
      ]);

      return {
        edges,
        pageInfo: {
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
          total,
        },
      };
    },

    trendingTokens: async (_: any, { limit }: any, { prisma }: Context) => {
      return prisma.token.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        orderBy: [{ volume24h: 'desc' }, { holders: 'desc' }],
        take: limit,
      });
    },

    // Pools
    pool: async (_: any, { address }: any, { prisma }: Context) => {
      return prisma.pool.findUnique({
        where: { address },
        include: { token0: true, token1: true },
      });
    },

    pools: async (_: any, { limit, offset }: any, { prisma }: Context) => {
      const [edges, total] = await Promise.all([
        prisma.pool.findMany({
          take: limit,
          skip: offset,
          orderBy: { tvl: 'desc' },
          include: { token0: true, token1: true },
        }),
        prisma.pool.count(),
      ]);

      return {
        edges,
        pageInfo: {
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
          total,
        },
      };
    },

    // Users
    user: async (_: any, { address }: any, { prisma }: Context) => {
      return prisma.user.findUnique({
        where: { address },
        include: { achievements: true },
      });
    },

    leaderboard: async (_: any, { type, limit }: any, { prisma }: Context) => {
      let orderBy: any;
      let valueField: string;

      switch (type) {
        case 'CREATORS':
          orderBy = { tokensCreatedCount: 'desc' };
          valueField = 'tokensCreatedCount';
          break;
        case 'TRADERS':
          orderBy = { totalVolumeTraded: 'desc' };
          valueField = 'totalVolumeTraded';
          break;
        case 'LIQUIDITY_PROVIDERS':
          orderBy = { totalLiquidityProvided: 'desc' };
          valueField = 'totalLiquidityProvided';
          break;
        case 'VIRAL_TOKENS':
          orderBy = { points: 'desc' };
          valueField = 'points';
          break;
        default:
          orderBy = { points: 'desc' };
          valueField = 'points';
      }

      const users = await prisma.user.findMany({
        orderBy,
        take: limit,
      });

      return users.map((user, index) => ({
        rank: index + 1,
        address: user.address,
        user,
        value: String(user[valueField as keyof typeof user]),
        change24h: 0, // TODO: Calculate from history
      }));
    },

    // Transactions
    transactions: async (
      _: any,
      { address, tokenAddress, type, limit, offset }: any,
      { prisma }: Context
    ) => {
      const where: any = {};

      if (address) {
        where.OR = [{ from: address }, { to: address }];
      }

      if (tokenAddress) {
        where.tokenAddress = tokenAddress;
      }

      if (type) {
        where.type = type;
      }

      const [edges, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { timestamp: 'desc' },
          include: { token: true },
        }),
        prisma.transaction.count({ where }),
      ]);

      return {
        edges,
        pageInfo: {
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
          total,
        },
      };
    },

    // Global stats
    globalStats: async (_: any, __: any, { prisma }: Context) => {
      const [totalTokens, totalPools, totalUsers, tokens] = await Promise.all([
        prisma.token.count(),
        prisma.pool.count(),
        prisma.user.count(),
        prisma.token.findMany({
          select: { volume24h: true },
        }),
      ]);

      const totalVolume24h = tokens.reduce(
        (sum, token) => sum + BigInt(token.volume24h),
        BigInt(0)
      );

      const pools = await prisma.pool.findMany({
        select: { tvl: true },
      });

      const totalTVL = pools.reduce(
        (sum, pool) => sum + BigInt(pool.tvl || '0'),
        BigInt(0)
      );

      return {
        totalTokens,
        totalPools,
        totalUsers,
        totalVolume24h: totalVolume24h.toString(),
        totalTVL: totalTVL.toString(),
      };
    },
  },

  // Field resolvers
  Token: {
    creator: async (token: any, _: any, { prisma }: Context) => {
      return prisma.user.findUnique({
        where: { address: token.creator },
      });
    },

    pools: async (token: any, _: any, { prisma }: Context) => {
      return prisma.pool.findMany({
        where: {
          OR: [{ token0Address: token.address }, { token1Address: token.address }],
        },
        include: { token0: true, token1: true },
      });
    },
  },

  Pool: {
    token0: async (pool: any, _: any, { prisma }: Context) => {
      return prisma.token.findUnique({
        where: { address: pool.token0Address },
      });
    },

    token1: async (pool: any, _: any, { prisma }: Context) => {
      return prisma.token.findUnique({
        where: { address: pool.token1Address },
      });
    },
  },

  User: {
    tokensCreated: async (user: any, _: any, { prisma }: Context) => {
      return prisma.token.findMany({
        where: { creator: user.address },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Transaction: {
    token: async (transaction: any, _: any, { prisma }: Context) => {
      if (!transaction.tokenAddress) return null;
      return prisma.token.findUnique({
        where: { address: transaction.tokenAddress },
      });
    },
  },
};
