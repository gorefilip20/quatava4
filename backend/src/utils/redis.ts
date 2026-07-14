import { Redis, Cluster } from "ioredis";

type RedisLike = Redis & {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    ...args: Array<string | number>
  ): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string>;
  del(...keys: string[]): Promise<number>;
  hset(hash: string, key: string, value: string): Promise<number>;
  hgetall(hash: string): Promise<Record<string, string>>;
  ttl(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  pipeline(): { hset: Function; set: Function; del: Function; exec: Function };
  multi(): { incr: Function; expire: Function; exec: Function };
  expire(key: string, seconds: number): Promise<number>;
  quit(): Promise<void>;
  on(event: string, handler: (...args: any[]) => void): void;
};

const redisDisabled = process.env.REDIS_DISABLED === "true";

class InMemoryRedis {
  private store = new Map<string, { value: string; expiresAt?: number }>();
  private hashStore = new Map<
    string,
    { value: Map<string, string>; expiresAt?: number }
  >();

  on(_event: string, _handler: (...args: any[]) => void) {
    // no-op for in-memory store
  }

  private isExpired(expiresAt?: number) {
    return typeof expiresAt === "number" && expiresAt <= Date.now();
  }

  private getEntry(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.isExpired(entry.expiresAt)) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  private getHashEntry(key: string) {
    const entry = this.hashStore.get(key);
    if (!entry) return null;
    if (this.isExpired(entry.expiresAt)) {
      this.hashStore.delete(key);
      return null;
    }
    return entry;
  }

  async get(key: string) {
    const entry = this.getEntry(key);
    return entry ? entry.value : null;
  }

  async set(key: string, value: string, ...args: Array<string | number>) {
    const argsUpper = args.map((arg) =>
      typeof arg === "string" ? arg.toUpperCase() : arg
    );
    const hasNx = argsUpper.includes("NX");
    if (hasNx && this.getEntry(key)) {
      return null;
    }

    let expiresAt: number | undefined;
    const exIndex = argsUpper.indexOf("EX");
    if (exIndex !== -1 && typeof args[exIndex + 1] === "number") {
      const seconds = args[exIndex + 1] as number;
      expiresAt = Date.now() + seconds * 1000;
    }

    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async setex(key: string, seconds: number, value: string) {
    this.store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    return "OK";
  }

  async del(...keys: string[]) {
    let count = 0;
    keys.forEach((key) => {
      if (this.store.delete(key)) count += 1;
      if (this.hashStore.delete(key)) count += 1;
    });
    return count;
  }

  async hset(hash: string, key: string, value: string) {
    let entry = this.getHashEntry(hash);
    if (!entry) {
      entry = { value: new Map<string, string>() };
      this.hashStore.set(hash, entry);
    }
    const existed = entry.value.has(key);
    entry.value.set(key, value);
    return existed ? 0 : 1;
  }

  async hgetall(hash: string) {
    const entry = this.getHashEntry(hash);
    if (!entry) return {};
    const result: Record<string, string> = {};
    entry.value.forEach((val, key) => {
      result[key] = val;
    });
    return result;
  }

  async ttl(key: string) {
    const entry = this.getEntry(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
  }

  async incr(key: string) {
    const current = await this.get(key);
    const nextValue = (current ? parseInt(current, 10) : 0) + 1;
    const entry = this.getEntry(key);
    this.store.set(key, {
      value: String(nextValue),
      expiresAt: entry?.expiresAt,
    });
    return nextValue;
  }

  async keys(pattern: string) {
    const regex = new RegExp(
      "^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"
    );
    const keys = new Set<string>();
    for (const key of this.store.keys()) {
      if (this.getEntry(key) && regex.test(key)) keys.add(key);
    }
    for (const key of this.hashStore.keys()) {
      if (this.getHashEntry(key) && regex.test(key)) keys.add(key);
    }
    return Array.from(keys);
  }

  pipeline() {
    const ops: Array<() => Promise<any>> = [];
    return {
      hset: (hash: string, key: string, value: string) => {
        ops.push(() => this.hset(hash, key, value));
        return this;
      },
      set: (key: string, value: string, ...args: Array<string | number>) => {
        ops.push(() => this.set(key, value, ...args));
        return this;
      },
      del: (...keys: string[]) => {
        ops.push(() => this.del(...keys));
        return this;
      },
      exec: async () => Promise.all(ops.map((op) => op())).then((results) =>
        results.map((result) => [null, result])
      ),
    };
  }

  multi() {
    const ops: Array<() => Promise<any>> = [];
    return {
      incr: (key: string) => {
        ops.push(() => this.incr(key));
        return this;
      },
      expire: (key: string, seconds: number) => {
        ops.push(() => this.expire(key, seconds));
        return this;
      },
      exec: async () => Promise.all(ops.map((op) => op())).then((results) =>
        results.map((result) => [null, result])
      ),
    };
  }

  async expire(key: string, seconds: number) {
    const entry = this.getEntry(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, entry);
    return 1;
  }

  async quit() {
    this.store.clear();
    this.hashStore.clear();
  }
}

export class RedisSingleton {
  private static instance: RedisLike;
  private static isConnecting: boolean = false;

  private constructor() {}

  public static getInstance(): RedisLike {
    if (!RedisSingleton.instance) {
      if (redisDisabled) {
        console.warn(
          "REDIS_DISABLED=true detected in development; using in-memory cache."
        );
        RedisSingleton.instance = new InMemoryRedis() as unknown as RedisLike;
        return RedisSingleton.instance;
      }

      if (RedisSingleton.isConnecting) {
        // Wait for existing connection attempt
        return new Promise((resolve) => {
          const checkConnection = () => {
            if (RedisSingleton.instance) {
              resolve(RedisSingleton.instance);
            } else {
              setTimeout(checkConnection, 10);
            }
          };
          checkConnection();
        }) as any;
      }

      RedisSingleton.isConnecting = true;
      
      try {
        RedisSingleton.instance = new Redis({
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379"),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || "0"),
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          connectTimeout: 5000,
          commandTimeout: 5000,
          lazyConnect: true,
          family: 4,
          keepAlive: 30000,
        }) as unknown as RedisLike;

        // Handle connection events
        RedisSingleton.instance.on("error", (error) => {
          console.error("Redis connection error:", error);
        });

        RedisSingleton.instance.on("connect", () => {
          console.log("Redis connected successfully");
        });

        RedisSingleton.instance.on("ready", () => {
          console.log("Redis ready for commands");
        });

        RedisSingleton.instance.on("close", () => {
          console.log("Redis connection closed");
        });

        RedisSingleton.instance.on("reconnecting", () => {
          console.log("Redis reconnecting...");
        });

      } catch (error) {
        console.error("Failed to create Redis instance:", error);
        throw error;
      } finally {
        RedisSingleton.isConnecting = false;
      }
    }
    
    return RedisSingleton.instance;
  }

  // Add method to safely get with timeout
  public static async safeGet(key: string, timeoutMs: number = 3000): Promise<string | null> {
    const redis = this.getInstance();
    
    return Promise.race([
      redis.get(key),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Redis GET timeout')), timeoutMs)
      )
    ]).catch((error) => {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    });
  }

  // Add method to safely set with timeout
  public static async safeSet(key: string, value: string, timeoutMs: number = 3000): Promise<boolean> {
    const redis = this.getInstance();
    
    return Promise.race([
      redis.set(key, value).then(() => true),
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Redis SET timeout')), timeoutMs)
      )
    ]).catch((error) => {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    });
  }

  // Add cleanup method
  public static async cleanup(): Promise<void> {
    if (RedisSingleton.instance) {
      try {
        await RedisSingleton.instance.quit();
      } catch (error) {
        console.error("Error during Redis cleanup:", error);
      }
      RedisSingleton.instance = null as any;
    }
  }
}

// Export a function that returns the Redis instance
export default function() {
  return RedisSingleton.getInstance();
}
