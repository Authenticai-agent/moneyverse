import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const TEST_ROLE = 'moneyverse_test';
const TEST_PASSWORD = 'moneyverse_test';

export default async function setup() {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/moneyverse';
  process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-32-byte';
  process.env.JWT_ISSUER = 'moneyverse';
  process.env.JWT_AUDIENCE = 'moneyverse-app';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';

  execSync('npx prisma migrate deploy', { stdio: 'inherit' });

  const adminPrisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  await adminPrisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      CREATE ROLE ${TEST_ROLE} WITH LOGIN PASSWORD '${TEST_PASSWORD}';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Role already exists';
    END $$;
  `);

  await adminPrisma.$executeRawUnsafe(`GRANT CONNECT ON DATABASE moneyverse TO ${TEST_ROLE};`);
  await adminPrisma.$executeRawUnsafe(`GRANT USAGE, CREATE ON SCHEMA public TO ${TEST_ROLE};`);
  await adminPrisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${TEST_ROLE};`);
  await adminPrisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${TEST_ROLE};`);
  await adminPrisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${TEST_ROLE};`);
  await adminPrisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${TEST_ROLE};`);

  await adminPrisma.$disconnect();

  process.env.DATABASE_URL = `postgresql://${TEST_ROLE}:${TEST_PASSWORD}@localhost:5433/moneyverse`;
}
