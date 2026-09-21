import { Sequelize } from "sequelize";
import { initModels } from "../models/init";
import { isMainThread } from "worker_threads";

export class SequelizeSingleton {
  private static instance: SequelizeSingleton;
  private sequelize: Sequelize;
  public models: any;

  private constructor() {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    const sslRequired =
      process.env.PGSSLMODE === "require" ||
      process.env.DB_SSL === "true" ||
      databaseUrl?.includes("supabase") === true;

    console.log(`\x1b[36mDatabase Configuration:\x1b[0m`);
    console.log(`  DIALECT: postgres`);
    console.log(`  DATABASE_URL: ${databaseUrl ? '[configured]' : '(not set)'}`);
    console.log(`  DB_HOST: ${process.env.DB_HOST || '(from DATABASE_URL)'}`);
    console.log(`  DB_PORT: ${process.env.DB_PORT || '(from DATABASE_URL)'}`);
    console.log(`  SSL: ${sslRequired ? 'enabled' : 'disabled'}`);

    const options = {
      dialect: "postgres" as const,
      logging: false,
      dialectOptions: {
        ...(sslRequired
          ? { ssl: { require: true, rejectUnauthorized: false } }
          : {}),
        keepAlive: true,
      },
    };

    if (databaseUrl) {
      this.sequelize = new Sequelize(databaseUrl, options);
    } else {
      if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_HOST) {
        throw new Error(
          "Missing database configuration. Set DATABASE_URL for Supabase PostgreSQL or DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, and DB_PORT."
        );
      }

      this.sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD || "",
        {
          ...options,
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT || 5432),
        }
      );
    }
    
    if (!this.sequelize) {
      throw new Error("Failed to create Sequelize instance");
    }
    
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
      console.log(
        `\x1b[36mMain Thread: Database synced successfully...\x1b[0m`
      );
    }
  }

  public getSequelize(): Sequelize {
    return this.sequelize;
  }

  private initModels() {
    const models = initModels(this.sequelize);
    return models;
  }

  private async syncDatabase() {
    try {
      await this.sequelize.sync();
    } catch (error) {
      console.error("Database sync failed:", error);
      throw error;
    }
  }
}

export const db = SequelizeSingleton.getInstance();
export const sequelize = db.getSequelize();
export const models = db.models;
export default db;
