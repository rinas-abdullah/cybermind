#!/usr/bin/env node

/**
 * Database Testing Script
 * Tests connection and configuration for CyberMind
 */

require("dotenv").config();
const { config } = require("./backend/config/environment");

async function main() {
  console.log("🔍 CyberMind Database Configuration Test\n");
  console.log("=".repeat(50));

  // Display current config
  console.log("\n📋 Current Configuration:");
  console.log(`  - Environment: ${config.server.nodeEnv}`);
  console.log(`  - Database Type: ${config.database.type}`);
  console.log(`  - Server Port: ${config.server.port}`);
  console.log(`  - Server Host: ${config.server.host}`);
  console.log(`  - CORS Origins: ${config.cors.origins.length > 0 ? "✅" : "❌"}`);
  console.log(`  - Rate Limit: ${config.rateLimit.max} req/${config.rateLimit.windowMs}ms`);

  console.log("\n" + "=".repeat(50));

  // Test database connection
  console.log("\n🔗 Testing Database Connection...\n");

  const { DB_TYPE } = require("./backend/db");

  if (DB_TYPE === "in-memory") {
    console.log("✅ In-Memory Database: Ready");
    console.log("   ⚠️  Note: Data will be lost when server stops\n");
  } else if (DB_TYPE === "postgresql") {
    try {
      const { testConnection } = require("./backend/db");
      const result = await testConnection();

      if (result.success) {
        console.log("✅ PostgreSQL Connection: " + result.message);
      } else {
        console.error("❌ PostgreSQL Connection Failed: " + result.message);
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ Error testing PostgreSQL:", error.message);
      console.log("   Troubleshooting:");
      console.log("   1. Ensure PostgreSQL is running");
      console.log("   2. Check DATABASE_URL in .env");
      console.log("   3. Verify database exists: psql -U <user> -d <database>\n");
      process.exit(1);
    }
  } else {
    console.log(`⚠️  Database type '${DB_TYPE}' requires additional setup`);
  }

  // Test environment variables
  console.log("\n🔐 Testing Environment Variables...\n");

  const requiredVars = [
    "NODE_ENV",
    "DB_TYPE",
    "PORT",
    "JWT_SECRET",
  ];

  const missingVars = [];

  requiredVars.forEach((variable) => {
    const value = process.env[variable];
    if (value) {
      console.log(`  ✅ ${variable}: ${
        variable === "JWT_SECRET" ? "***" : value
      }`);
    } else {
      console.log(`  ❌ ${variable}: Missing`);
      missingVars.push(variable);
    }
  });

  console.log("\n" + "=".repeat(50));

  if (missingVars.length > 0) {
    console.log(
      `\n⚠️  Missing ${missingVars.length} required environment variable(s):`
    );
    missingVars.forEach((v) => console.log(`   - ${v}`));
    console.log("\n💡 Run: cp .env.example .env");
    console.log("   Then update .env with your values\n");
    process.exit(1);
  }

  console.log("\n✅ All checks passed!");
  console.log("\n💬 Ready to start the server with: npm start\n");
}

main().catch((error) => {
  console.error("❌ Fatal Error:", error.message);
  process.exit(1);
});
