import { PrismaClient } from '@prisma/client';

export interface Context {
  prisma: PrismaClient;
  userId?: string;
}

export async function createContext({ req, prisma }: any): Promise<Context> {
  // In production, extract user from JWT token
  // For MVP, no authentication required
  return {
    prisma,
  };
}
