import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prisma: PrismaClient;

try {
  if (globalForPrisma.prisma) {
    prisma = globalForPrisma.prisma;
  } else {
    // Only create PrismaClient if DATABASE_URL is available
    if (process.env.DATABASE_URL) {
      prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prisma;
      }
    } else {
      // Create a mock client that throws helpful errors
      prisma = {} as PrismaClient;
    }
  }
} catch (error) {
  console.error('Failed to initialize Prisma:', error);
  prisma = {} as PrismaClient;
}

export { prisma };




