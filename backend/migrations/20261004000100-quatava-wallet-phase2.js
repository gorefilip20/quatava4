/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const existingTables = new Set(await queryInterface.showAllTables());
    const tableExists = (name) => existingTables.has(name);
    const markCreated = (name) => existingTables.add(name);
    const uuid = { type: Sequelize.UUID, allowNull: false };
    if (!(await tableExists("virtual_bank_account"))) {
      await queryInterface.createTable("virtual_bank_account", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true }, userId: { ...uuid, references: { model: "user", key: "id" }, onDelete: "CASCADE" },
        currency: { type: Sequelize.ENUM("USD", "EUR", "GBP", "LOCAL"), allowNull: false }, countryCode: Sequelize.STRING(2), accountType: Sequelize.STRING(32), bankName: Sequelize.STRING(120), routingNumber: Sequelize.STRING(32), accountNumber: Sequelize.STRING(64), iban: Sequelize.STRING(64), bic: Sequelize.STRING(32), sortCode: Sequelize.STRING(16), status: { type: Sequelize.ENUM("ACTIVE", "SUSPENDED"), allowNull: false, defaultValue: "ACTIVE" }, metadata: Sequelize.JSON, createdAt: { type: Sequelize.DATE, allowNull: false }, updatedAt: { type: Sequelize.DATE, allowNull: false },
      });
      await queryInterface.addConstraint("virtual_bank_account", { fields: ["userId", "currency"], type: "unique", name: "virtual_bank_account_user_currency_unique" });
      markCreated("virtual_bank_account");
    }
    if (!(await tableExists("virtual_card"))) {
      await queryInterface.createTable("virtual_card", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true }, userId: { ...uuid, references: { model: "user", key: "id" }, onDelete: "CASCADE" }, currency: { type: Sequelize.ENUM("USD"), allowNull: false, defaultValue: "USD" }, cardholderName: { type: Sequelize.STRING(160), allowNull: false }, last4: { type: Sequelize.STRING(4), allowNull: false }, expiryMonth: { type: Sequelize.INTEGER, allowNull: false }, expiryYear: { type: Sequelize.INTEGER, allowNull: false }, balance: { type: Sequelize.DECIMAL(24, 8), allowNull: false, defaultValue: 0 }, status: { type: Sequelize.ENUM("ACTIVE", "FROZEN", "CLOSED"), allowNull: false, defaultValue: "ACTIVE" }, providerReference: Sequelize.STRING(120), createdAt: { type: Sequelize.DATE, allowNull: false }, updatedAt: { type: Sequelize.DATE, allowNull: false },
      });
      await queryInterface.addConstraint("virtual_card", { fields: ["userId"], type: "unique", name: "virtual_card_user_unique" });
      markCreated("virtual_card");
    }
    if (!(await tableExists("market_product"))) {
      await queryInterface.createTable("market_product", { id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true }, category: { type: Sequelize.ENUM("GIFT_CARD", "UTILITY", "TICKET", "ESIM", "DIGITAL"), allowNull: false }, name: { type: Sequelize.STRING(160), allowNull: false }, description: Sequelize.TEXT, price: { type: Sequelize.DECIMAL(24, 8), allowNull: false }, currency: { type: Sequelize.STRING(12), allowNull: false, defaultValue: "USD" }, status: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }, metadata: Sequelize.JSON, createdAt: { type: Sequelize.DATE, allowNull: false }, updatedAt: { type: Sequelize.DATE, allowNull: false } });
      const now = new Date();
      await queryInterface.bulkInsert("market_product", [
        { id: "b4b7d258-119f-4e1e-9626-700000000001", category: "GIFT_CARD", name: "Global retail gift card", description: "Digital gift card delivered after payment.", price: 25, currency: "USD", status: true, metadata: JSON.stringify({ fulfillment: "mock" }), createdAt: now, updatedAt: now },
        { id: "b4b7d258-119f-4e1e-9626-700000000002", category: "UTILITY", name: "Electricity bill token", description: "Mock utility payment product.", price: 10, currency: "USD", status: true, metadata: JSON.stringify({ provider: "mock-utility" }), createdAt: now, updatedAt: now },
        { id: "b4b7d258-119f-4e1e-9626-700000000003", category: "ESIM", name: "Regional data eSIM", description: "Digital eSIM profile for supported regions.", price: 15, currency: "USD", status: true, metadata: JSON.stringify({ fulfillment: "mock" }), createdAt: now, updatedAt: now },
      ], { ignoreDuplicates: true });
      markCreated("market_product");
    }
    if (!(await tableExists("market_order"))) {
      await queryInterface.createTable("market_order", { id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true }, userId: { ...uuid, references: { model: "user", key: "id" }, onDelete: "CASCADE" }, productId: { ...uuid, references: { model: "market_product", key: "id" }, onDelete: "RESTRICT" }, quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 }, total: { type: Sequelize.DECIMAL(24, 8), allowNull: false }, fee: { type: Sequelize.DECIMAL(24, 8), allowNull: false, defaultValue: 0 }, currency: { type: Sequelize.STRING(12), allowNull: false }, status: { type: Sequelize.ENUM("PENDING", "COMPLETED", "FAILED"), allowNull: false, defaultValue: "PENDING" }, fulfillmentData: Sequelize.JSON, createdAt: { type: Sequelize.DATE, allowNull: false }, updatedAt: { type: Sequelize.DATE, allowNull: false } });
      markCreated("market_order");
    }
    if (!(await tableExists("user_activity_log"))) {
      await queryInterface.createTable("user_activity_log", { id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true }, userId: { ...uuid, references: { model: "user", key: "id" }, onDelete: "CASCADE" }, action: { type: Sequelize.STRING(120), allowNull: false }, category: { type: Sequelize.ENUM("SECURITY", "WALLET", "CARD", "MARKET", "PROFILE"), allowNull: false }, ipAddress: Sequelize.STRING(64), userAgent: Sequelize.STRING(512), metadata: Sequelize.JSON, createdAt: { type: Sequelize.DATE, allowNull: false }, });
      markCreated("user_activity_log");
    }
    if (!(await tableExists("legacy_feature_deprecation"))) {
      await queryInterface.createTable("legacy_feature_deprecation", { feature: { type: Sequelize.STRING(64), primaryKey: true }, status: { type: Sequelize.STRING(32), allowNull: false }, replacement: Sequelize.STRING(120), notes: Sequelize.TEXT, createdAt: { type: Sequelize.DATE, allowNull: false }, updatedAt: { type: Sequelize.DATE, allowNull: false } });
      markCreated("legacy_feature_deprecation");
    }
    const now = new Date();
    await queryInterface.bulkInsert("legacy_feature_deprecation", [
      { feature: "spot_trading", status: "DEPRECATED", replacement: "dashboard_wallet", notes: "Removed from user navigation; data retained for audit and rollback.", createdAt: now, updatedAt: now },
      { feature: "futures", status: "DEPRECATED", replacement: "dashboard_wallet", notes: "Removed from user navigation; data retained for audit and rollback.", createdAt: now, updatedAt: now },
      { feature: "staking", status: "DEPRECATED", replacement: "dashboard_wallet", notes: "Removed from user navigation; data retained for audit and rollback.", createdAt: now, updatedAt: now },
      { feature: "nft_marketplace", status: "DEPRECATED", replacement: "market", notes: "Removed from user navigation; data retained for audit and rollback.", createdAt: now, updatedAt: now },
      { feature: "ai_trading", status: "DEPRECATED", replacement: "market", notes: "Removed from user navigation; data retained for audit and rollback.", createdAt: now, updatedAt: now },
    ], { ignoreDuplicates: true });
  },
  async down(queryInterface) {
    const existingTables = new Set(await queryInterface.showAllTables());
    for (const table of ["user_activity_log", "market_order", "market_product", "virtual_card", "virtual_bank_account", "legacy_feature_deprecation"]) {
      if (existingTables.has(table)) await queryInterface.dropTable(table);
    }
  },
};
