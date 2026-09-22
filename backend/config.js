"use strict";

const path = require("path");
const fs = require("fs");

const envPaths = [
  path.resolve(process.cwd(), "../.env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, ".env"),
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const dotenvResult = require("dotenv").config({ path: envPath });
    if (!dotenvResult.error) {
      console.log(`Config: Environment loaded from: ${envPath}`);
      envLoaded = true;
      break;
    }
  }
}
if (!envLoaded) require("dotenv").config();

const environment = process.env.NODE_ENV || "development";
const databaseUrl = process.env.DATABASE_URL?.trim();
const pgSslMode = process.env.PGSSLMODE?.trim().toLowerCase();
const explicitSsl = process.env.DB_SSL?.trim().toLowerCase();
const sslRequired =
  explicitSsl === "true" ||
  explicitSsl === "1" ||
  pgSslMode === "require" ||
  (pgSslMode !== "disable" && databaseUrl?.toLowerCase().includes("supabase") === true);

const positiveInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const requiredEnvVars = databaseUrl ? [] : ["DB_HOST", "DB_USER", "DB_NAME"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`Config: Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

const common = {
  dialect: "postgres",
  logging: environment === "development" ? console.log : false,
  pool: {
    max: positiveInteger(process.env.DB_POOL_MAX, 5),
    min: 0,
    acquire: positiveInteger(process.env.DB_POOL_ACQUIRE_MS, 30000),
    idle: positiveInteger(process.env.DB_POOL_IDLE_MS, 10000),
  },
  dialectOptions: {
    connectionTimeoutMillis: positiveInteger(process.env.DB_CONNECT_TIMEOUT_MS, 10000),
    keepAlive: true,
    ...(sslRequired ? { ssl: { rejectUnauthorized: false } } : {}),
  },
};

const dbConfig = databaseUrl
  ? { ...common, url: databaseUrl }
  : {
      ...common,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: positiveInteger(process.env.DB_PORT, 5432),
    };

module.exports = {
  development: dbConfig,
  test: dbConfig,
  production: dbConfig,
};
