import "dotenv/config";

process.env.NODE_ENV = process.env.NODE_ENV || "test";

jest.setTimeout(20_000);

afterEach(() => {
  jest.clearAllMocks();
});

export {};

