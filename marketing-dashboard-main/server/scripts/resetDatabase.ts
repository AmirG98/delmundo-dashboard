/**
 * Script to reset database (clear all multi-tenant data)
 * Run with: npx tsx server/scripts/resetDatabase.ts
 */

import { getDb } from '../db';
import { organizations, funnels, users, organizationUsers } from '../../drizzle/schema';

async function resetDatabase() {
  console.log('🗑️  Resetting database...\n');

  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available. Check DATABASE_URL in .env');
    process.exit(1);
  }

  try {
    console.log('⚠️  WARNING: This will delete all organizations, users, and funnels!');
    console.log('   (Platform connections, reports, and other data will be preserved)\n');

    // Delete in correct order to respect foreign keys
    console.log('Deleting organization_users...');
    await db.delete(organizationUsers);

    console.log('Deleting funnels...');
    await db.delete(funnels);

    console.log('Deleting users...');
    await db.delete(users);

    console.log('Deleting organizations...');
    await db.delete(organizations);

    console.log('');
    console.log('✅ Database reset complete!');
    console.log('   You can now run: npm run seed');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the reset
resetDatabase();
