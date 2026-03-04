/**
 * Script to seed initial clients and setup
 * Run with: npx tsx server/scripts/seedClients.ts
 */

import { getDb } from '../db';
import { organizations, funnels, users } from '../../drizzle/schema';
import { hashPassword } from '../services/auth';

async function seedClients() {
  console.log('🌱 Starting client seed...\n');

  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available. Check DATABASE_URL in .env');
    process.exit(1);
  }

  try {
    // 1. Create Organizations
    console.log('📦 Creating organizations...');

    const clientsData = [
      {
        name: 'LemonTech',
        googleSheetId: '1DDw7kBS828ZQ7kGLMAlgnmuXoHxrvYro9vbsY2LI1dI', // Sheet actual
        primaryColor: '#f97316', // Orange
        logo: '/lemontech-logo-dark.png',
      },
      {
        name: 'Del Mundo',
        googleSheetId: '1DDw7kBS828ZQ7kGLMAlgnmuXoHxrvYro9vbsY2LI1dI', // Usar el mismo sheet como demo
        primaryColor: '#3b82f6', // Blue
        logo: null,
      },
      {
        name: 'Gullich Expediciones',
        googleSheetId: '1DDw7kBS828ZQ7kGLMAlgnmuXoHxrvYro9vbsY2LI1dI', // Usar el mismo sheet como demo
        primaryColor: '#10b981', // Green
        logo: null,
      },
      {
        name: 'Falda del Carmen',
        googleSheetId: '1DDw7kBS828ZQ7kGLMAlgnmuXoHxrvYro9vbsY2LI1dI', // Usar el mismo sheet como demo
        primaryColor: '#8b5cf6', // Purple
        logo: null,
      },
    ];

    const orgIds: number[] = [];

    for (const client of clientsData) {
      const result = await db.insert(organizations).values(client);
      const orgId = result[0].insertId;
      orgIds.push(orgId);
      console.log(`  ✓ Created: ${client.name} (ID: ${orgId})`);
    }

    console.log('');

    // 2. Create Funnels for each organization
    console.log('🎯 Creating funnels...');

    const funnelsData = [
      // LemonTech funnels (usando los tabs reales del sheet actual)
      { orgId: orgIds[0], name: 'LemonSuite - Google Ads', platform: 'google_ads' as const, tabName: 'SUITE - Google Ads Lemonsuite', order: 1 },
      { orgId: orgIds[0], name: 'LemonSuite - Meta', platform: 'meta_ads' as const, tabName: 'SUITE - LemonSuite - Meta', order: 2 },
      { orgId: orgIds[0], name: 'CaseTracking - Google Ads', platform: 'google_ads' as const, tabName: 'CaseTracking - Google Ads - LemonSuite', order: 3 },
      { orgId: orgIds[0], name: 'LemonFlow - Google Ads', platform: 'google_ads' as const, tabName: 'FLOW - Google Ads - LemonFlow', order: 4 },
      { orgId: orgIds[0], name: 'LemonFlow - Meta', platform: 'meta_ads' as const, tabName: 'FLOW - Meta - LemonFlow', order: 5 },

      // Del Mundo funnels (usando tabs demo)
      { orgId: orgIds[1], name: 'Google Search', platform: 'google_ads' as const, tabName: 'SUITE - Google Ads Lemonsuite', order: 1 },
      { orgId: orgIds[1], name: 'Meta Ads', platform: 'meta_ads' as const, tabName: 'SUITE - LemonSuite - Meta', order: 2 },

      // Gullich Expediciones funnels
      { orgId: orgIds[2], name: 'Google Ads Principal', platform: 'google_ads' as const, tabName: 'SUITE - Google Ads Lemonsuite', order: 1 },
      { orgId: orgIds[2], name: 'Meta Awareness', platform: 'meta_ads' as const, tabName: 'SUITE - LemonSuite - Meta', order: 2 },

      // Falda del Carmen funnels
      { orgId: orgIds[3], name: 'Google Search', platform: 'google_ads' as const, tabName: 'SUITE - Google Ads Lemonsuite', order: 1 },
      { orgId: orgIds[3], name: 'Meta Retargeting', platform: 'meta_ads' as const, tabName: 'SUITE - LemonSuite - Meta', order: 2 },
    ];

    for (const funnel of funnelsData) {
      await db.insert(funnels).values({
        organizationId: funnel.orgId,
        name: funnel.name,
        platform: funnel.platform,
        sheetTabName: funnel.tabName,
        order: funnel.order,
        isActive: true,
      });
      console.log(`  ✓ Created funnel: ${funnel.name}`);
    }

    console.log('');

    // 3. Create Admin User
    console.log('👤 Creating admin user...');

    const adminPassword = 'admin123456'; // Cambiar en producción
    const adminHash = await hashPassword(adminPassword);

    await db.insert(users).values({
      email: 'admin@agrowth.com',
      name: 'Admin A+Growth',
      hashedPassword: adminHash,
      role: 'admin',
      organizationId: null, // Admin no tiene organización específica
      loginMethod: 'email',
    });

    console.log(`  ✓ Admin user created`);
    console.log(`     Email: admin@agrowth.com`);
    console.log(`     Password: ${adminPassword}`);
    console.log('');

    // 4. Create Client Users
    console.log('👥 Creating client users...');

    const clientUsers = [
      { email: 'lemontech@cliente.com', name: 'Usuario LemonTech', orgId: orgIds[0] },
      { email: 'delmundo@cliente.com', name: 'Usuario Del Mundo', orgId: orgIds[1] },
      { email: 'gullich@cliente.com', name: 'Usuario Gullich', orgId: orgIds[2] },
      { email: 'falda@cliente.com', name: 'Usuario Falda del Carmen', orgId: orgIds[3] },
    ];

    const clientPassword = 'cliente123'; // Misma contraseña para todos los clientes demo
    const clientHash = await hashPassword(clientPassword);

    for (const user of clientUsers) {
      await db.insert(users).values({
        email: user.email,
        name: user.name,
        hashedPassword: clientHash,
        role: 'client_user',
        organizationId: user.orgId,
        loginMethod: 'email',
      });
      console.log(`  ✓ ${user.name} (${user.email})`);
    }

    console.log('');
    console.log(`     Password para todos los clientes: ${clientPassword}`);
    console.log('');

    // Summary
    console.log('✅ Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • ${clientsData.length} organizations created`);
    console.log(`   • ${funnelsData.length} funnels created`);
    console.log(`   • 1 admin user created`);
    console.log(`   • ${clientUsers.length} client users created`);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Admin: admin@agrowth.com / admin123456');
    console.log('   Clients: [email] / cliente123');
    console.log('');
    console.log('🌐 Access the dashboard and login with these credentials!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the seed
seedClients();
