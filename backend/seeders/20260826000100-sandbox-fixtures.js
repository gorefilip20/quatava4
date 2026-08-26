"use strict";

const { v4: uuidv4 } = require("uuid");
const argon2 = require("argon2");

const FIXTURES = {
  serviceId: "sandbox-kyc",
  levelId: "7f4e0d1c-2a94-4c3e-9a11-20b8d7a9f001",
  traderId: "7f4e0d1c-2a94-4c3e-9a11-20b8d7a9f002",
  recipientId: "7f4e0d1c-2a94-4c3e-9a11-20b8d7a9f003",
  traderEmail: "sandbox.trader@example.com",
  recipientEmail: "sandbox.recipient@example.com",
  password: "Sandbox#2026!",
};

const KYC_FIELDS = [
  {
    id: "full_name",
    order: 1,
    type: "TEXT",
    label: "Full legal name",
    required: true,
    validation: { minLength: 3, maxLength: 120 },
  },
  {
    id: "country",
    order: 2,
    type: "SELECT",
    label: "Country of residence",
    required: true,
    options: [
      { label: "United Kingdom", value: "GB" },
      { label: "United States", value: "US" },
      { label: "Germany", value: "DE" },
      { label: "Singapore", value: "SG" },
      { label: "Japan", value: "JP" },
    ],
  },
  {
    id: "identity",
    order: 3,
    type: "IDENTITY",
    label: "Government identity document",
    required: true,
    identityTypes: [
      {
        value: "PASSPORT",
        fields: [
          { id: "front", label: "Passport image", type: "FILE", required: true },
          { id: "selfie", label: "Selfie image", type: "FILE", required: true },
        ],
      },
    ],
  },
];

const APPROVED_DATA = {
  sandboxDecision: "PASS",
  full_name: "Alex Sandbox",
  country: "GB",
  identity: {
    type: "PASSPORT",
    front: "https://sandbox.invalid/passport-front.jpg",
    selfie: "https://sandbox.invalid/selfie.jpg",
  },
};

const PENDING_DATA = {
  sandboxDecision: "PENDING",
  full_name: "Taylor Pending",
  country: "US",
  identity: {
    type: "PASSPORT",
    front: "https://sandbox.invalid/passport-front.jpg",
    selfie: "https://sandbox.invalid/selfie.jpg",
  },
};

async function findById(queryInterface, table, id) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT id FROM ${table} WHERE id = :id LIMIT 1`,
    { replacements: { id }, type: queryInterface.sequelize.QueryTypes.SELECT }
  );
  return rows;
}

async function insertIfMissing(queryInterface, table, rows) {
  for (const row of rows) {
    if (!(await findById(queryInterface, table, row.id))) {
      await queryInterface.bulkInsert(table, [row]);
    }
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.SANDBOX_MODE !== "true" || process.env.NODE_ENV === "production") {
      console.log("Sandbox fixtures skipped. Set SANDBOX_MODE=true in a non-production environment to seed test data.");
      return;
    }

    const now = new Date();
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id FROM role WHERE name = 'User' LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (!roles) {
      throw new Error("User role is required before seeding sandbox fixtures.");
    }

    const password = await argon2.hash(FIXTURES.password);
    await insertIfMissing(queryInterface, "kyc_verification_service", [
      {
        id: FIXTURES.serviceId,
        name: "Sandbox KYC",
        description: "Deterministic verification provider for non-production acceptance tests.",
        type: "SANDBOX",
        integrationDetails: JSON.stringify({ mode: "sandbox", supportedDecisions: ["PASS", "FAIL", "PENDING"] }),
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await insertIfMissing(queryInterface, "kyc_level", [
      {
        id: FIXTURES.levelId,
        serviceId: FIXTURES.serviceId,
        name: "Sandbox identity",
        description: "Test-only identity level. Never use this level for customer onboarding.",
        level: 1,
        fields: JSON.stringify(KYC_FIELDS),
        features: JSON.stringify({ deposits: true, withdrawals: true, trading: true }),
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await insertIfMissing(queryInterface, "user", [
      {
        id: FIXTURES.traderId,
        email: FIXTURES.traderEmail,
        password,
        firstName: "Alex",
        lastName: "Sandbox",
        emailVerified: true,
        phoneVerified: true,
        roleId: roles.id,
        profile: JSON.stringify({ sandbox: true, kycDecision: "PASS" }),
        status: "ACTIVE",
        settings: JSON.stringify({ email: false, sms: false, push: false }),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: FIXTURES.recipientId,
        email: FIXTURES.recipientEmail,
        password,
        firstName: "Taylor",
        lastName: "Pending",
        emailVerified: true,
        phoneVerified: true,
        roleId: roles.id,
        profile: JSON.stringify({ sandbox: true, kycDecision: "PENDING" }),
        status: "ACTIVE",
        settings: JSON.stringify({ email: false, sms: false, push: false }),
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const walletRows = [
      { id: uuidv4(), userId: FIXTURES.traderId, type: "FIAT", currency: "USD", balance: 10000, inOrder: 0, status: true, createdAt: now, updatedAt: now },
      { id: uuidv4(), userId: FIXTURES.traderId, type: "FIAT", currency: "EUR", balance: 5000, inOrder: 0, status: true, createdAt: now, updatedAt: now },
      { id: uuidv4(), userId: FIXTURES.traderId, type: "SPOT", currency: "USDT", balance: 2500, inOrder: 0, status: true, createdAt: now, updatedAt: now },
      { id: uuidv4(), userId: FIXTURES.traderId, type: "SPOT", currency: "BTC", balance: 0.25, inOrder: 0, status: true, createdAt: now, updatedAt: now },
      { id: uuidv4(), userId: FIXTURES.recipientId, type: "FIAT", currency: "USD", balance: 250, inOrder: 0, status: true, createdAt: now, updatedAt: now },
      { id: uuidv4(), userId: FIXTURES.recipientId, type: "SPOT", currency: "USDT", balance: 10, inOrder: 0, status: true, createdAt: now, updatedAt: now },
    ];
    for (const wallet of walletRows) {
      const [existing] = await queryInterface.sequelize.query(
        "SELECT id FROM wallet WHERE userId = :userId AND type = :type AND currency = :currency LIMIT 1",
        { replacements: wallet, type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      if (!existing) await queryInterface.bulkInsert("wallet", [wallet]);
    }

    const fiatRates = { USD: 1, EUR: 1.08, GBP: 1.27, JPY: 0.0068, CNY: 0.138, SGD: 0.74 };
    for (const [id, price] of Object.entries(fiatRates)) {
      await queryInterface.sequelize.query(
        "UPDATE currency SET status = true, price = :price WHERE id = :id",
        { replacements: { id, price } }
      );
    }

    await insertIfMissing(queryInterface, "kyc_application", [
      {
        id: "7f4e0d1c-2a94-4c3e-9a11-20b8d7a9f004",
        userId: FIXTURES.traderId,
        levelId: FIXTURES.levelId,
        status: "APPROVED",
        data: JSON.stringify(APPROVED_DATA),
        reviewedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "7f4e0d1c-2a94-4c3e-9a11-20b8d7a9f005",
        userId: FIXTURES.recipientId,
        levelId: FIXTURES.levelId,
        status: "PENDING",
        data: JSON.stringify(PENDING_DATA),
        createdAt: now,
        updatedAt: now,
      },
    ]);

    console.log(`Sandbox fixtures ready. Login: ${FIXTURES.traderEmail} / ${FIXTURES.password}`);
  },

  async down(queryInterface) {
    if (process.env.SANDBOX_MODE !== "true" || process.env.NODE_ENV === "production") return;
    await queryInterface.bulkDelete("kyc_verification_result", { serviceId: FIXTURES.serviceId });
    await queryInterface.bulkDelete("kyc_application", { id: ["7f4e0d1c-2a94-4c3e-9a11-20b8d7a9f004", "7f4e0d1c-2a94-4c3e-9a11-20b8d7a9f005"] });
    await queryInterface.bulkDelete("wallet", { userId: [FIXTURES.traderId, FIXTURES.recipientId] });
    await queryInterface.bulkDelete("user", { id: [FIXTURES.traderId, FIXTURES.recipientId] });
    await queryInterface.bulkDelete("kyc_level", { id: FIXTURES.levelId });
    await queryInterface.bulkDelete("kyc_verification_service", { id: FIXTURES.serviceId });
  },
};
