import { Sequelize } from "sequelize";
import { initModels } from "../models/init";
import { isMainThread } from "worker_threads";

function envBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  return ["1", "true", "yes", "on", "require"].includes(value.trim().toLowerCase());
}

function requiresSsl(databaseUrl?: string): boolean {
  const explicit = envBoolean(process.env.DB_SSL);
  if (explicit !== undefined) return explicit;
  if (process.env.PGSSLMODE?.trim().toLowerCase() === "disable") return false;
  if (process.env.PGSSLMODE?.trim().toLowerCase() === "require") return true;
  if (databaseUrl?.toLowerCase().includes("sslmode=require")) return true;
  return databaseUrl?.toLowerCase().includes("supabase") === true;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export class SequelizeSingleton {
  private static instance: SequelizeSingleton;
  private sequelize: Sequelize;
  public models: any;

  private constructor() {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    const sslEnabled = requiresSsl(databaseUrl);
    const host = process.env.DB_HOST?.trim();
    const port = positiveInteger(process.env.DB_PORT, 5432);
    const connectionTimeoutMillis = positiveInteger(process.env.DB_CONNECT_TIMEOUT_MS, 10000);
    const poolMax = positiveInteger(process.env.DB_POOL_MAX, 5);

    if (!databaseUrl && (!process.env.DB_NAME || !process.env.DB_USER || !host)) {
      throw new Error(
        "Missing database configuration. Set DATABASE_URL for Supabase PostgreSQL or DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, and DB_PORT."
      );
    }

    console.log("\x1b[36mDatabase Configuration:\x1b[0m");
    console.log("  DIALECT: postgres");
    console.log(`  DATABASE_URL: ${databaseUrl ? "[configured]" : "(not set)"}`);
    console.log(`  DB_HOST: ${host || "(from DATABASE_URL)"}`);
    console.log(`  DB_PORT: ${databaseUrl ? "(from DATABASE_URL)" : port}`);
    console.log(`  SSL: ${sslEnabled ? "enabled" : "disabled"}`);
    console.log(`  CONNECTION_TIMEOUT_MS: ${connectionTimeoutMillis}`);

    const options = {
      dialect: "postgres" as const,
      logging: false,
      benchmark: false,
      pool: {
        max: poolMax,
        min: 0,
        acquire: positiveInteger(process.env.DB_POOL_ACQUIRE_MS, 30000),
        idle: positiveInteger(process.env.DB_POOL_IDLE_MS, 10000),
        evict: positiveInteger(process.env.DB_POOL_EVICT_MS, 1000),
      },
      dialectOptions: {
        connectionTimeoutMillis,
        keepAlive: true,
        application_name: process.env.PG_APPLICATION_NAME || "quatava-backend",
        ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
      },
    };

    this.sequelize = databaseUrl
      ? new Sequelize(databaseUrl, options)
      : new Sequelize(process.env.DB_NAME as string, process.env.DB_USER as string, process.env.DB_PASSWORD || "", {
          ...options,
          host,
          port,
        });

    this.models = this.initModels();
  }

  public static getInstance(): SequelizeSingleton {
    if (!SequelizeSingleton.instance) {
      SequelizeSingleton.instance = new SequelizeSingleton();
    }
    return SequelizeSingleton.instance;
  }

  public async initialize(): Promise<void> {
    if (isMainThread) {
      await this.syncDatabase();
      console.log("\x1b[36mMain Thread: Database synced successfully...\x1b[0m");
    }
  }

  public getSequelize(): Sequelize {
    return this.sequelize;
  }

  private initModels() {
    return initModels(this.sequelize);
  }

  private async syncDatabase() {
    try {
      await this.sequelize.authenticate();
      await this.sequelize.sync();
    } catch (error) {
      console.error("Database connection or sync failed:", error);
      throw error;
    }
  }
}

export const db = SequelizeSingleton.getInstance();
export const sequelize = db.getSequelize();
export const models = db.models;
export default db;
